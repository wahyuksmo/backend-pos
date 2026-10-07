import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateOrderDto, CreateOrderPaymentDto } from './dto/create-order.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { VoidOrderDto } from './dto/void-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { Prisma } from '@prisma/client';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  private async generateOrderNumber(outletCode: string): Promise<string> {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const countToday = await this.prisma.posOrder.count({
      where: {
        outlet: { outletCode },
        orderedAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    return `ORD/${outletCode}/${dateStr}/${String(countToday + 1).padStart(4, '0')}`;
  }

  private async generateInvoiceNumber(outletCode: string): Promise<string> {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const countToday = await this.prisma.posOrder.count({
      where: {
        outlet: { outletCode },
        invoiceNumber: { not: null },
        orderedAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    return `INV/${outletCode}/${dateStr}/${String(countToday + 1).padStart(4, '0')}`;
  }

  private async resolvePaymentMethod(
    tx: Prisma.TransactionClient,
    pay: { paymentMethodId?: string; paymentMethodCode?: string; paymentMethod?: string },
  ) {
    let pm = pay.paymentMethodId
      ? await tx.posPaymentMethod.findUnique({ where: { paymentMethodId: pay.paymentMethodId } })
      : null;

    if (!pm && (pay.paymentMethodCode || pay.paymentMethod)) {
      const codeOrType = (pay.paymentMethodCode || pay.paymentMethod || '').trim().toUpperCase();
      pm = await tx.posPaymentMethod.findFirst({
        where: {
          OR: [
            { methodCode: codeOrType },
            { methodCode: `PM-${codeOrType}` },
            { methodType: codeOrType },
            { methodName: { contains: codeOrType, mode: 'insensitive' } },
          ],
          isActive: 'Y',
        },
      });
    }

    if (!pm) {
      pm =
        (await tx.posPaymentMethod.findFirst({
          where: { methodType: 'CASH', isActive: 'Y' },
        })) ||
        (await tx.posPaymentMethod.findFirst({
          where: { isActive: 'Y' },
        }));
    }

    if (!pm) {
      pm = await tx.posPaymentMethod.create({
        data: {
          methodCode: 'PM-CASH',
          methodName: 'Uang Tunai / Cash',
          methodType: 'CASH',
          feeType: 'NONE',
          feeValue: 0,
          requiresReference: 'N',
          displayOrder: 1,
          createdBy: 'SYSTEM',
        },
      });
    }

    return pm;
  }

  async create(dto: CreateOrderDto, username: string) {
    // 1. Validasi Outlet
    const outlet = await this.prisma.posOutlet.findUnique({
      where: { outletId: dto.outletId },
    });
    if (!outlet || outlet.isActive !== 'Y') {
      throw new BadRequestException('Outlet tidak ditemukan atau nonaktif');
    }

    // 2. Fetch produk dan variasinya untuk snapshot harga
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.posProduct.findMany({
      where: { productId: { in: productIds }, isActive: 'Y' },
      include: {
        variants: { where: { isActive: 'Y' } },
        outletPrices: { where: { outletId: dto.outletId, isActive: 'Y' } },
        recipesAsProduct: {
          where: { isActive: 'Y' },
          include: {
            ingredientProduct: { select: { unitId: true, costPrice: true } },
          },
        },
        tax: true,
      },
    });
    const productMap = new Map(products.map((p) => [p.productId, p]));

    // 3. Kalkulasi Item-by-item snapshot
    let subtotal = 0;
    let totalTax = 0;

    const preparedItems = dto.items.map((itemDto) => {
      const prod = productMap.get(itemDto.productId);
      if (!prod) {
        throw new BadRequestException(`Produk ID ${itemDto.productId} tidak ditemukan atau nonaktif`);
      }

      const variant = itemDto.variantId
        ? prod.variants.find((v) => v.variantId === itemDto.variantId)
        : null;

      // Prioritas harga: Outlet price -> Variant price -> Product base price
      const outletPrice = prod.outletPrices.find(
        (op) => (variant ? op.variantId === variant.variantId : !op.variantId),
      );

      let unitPrice = outletPrice
        ? Number(outletPrice.sellingPrice)
        : variant
        ? Number(variant.sellingPrice)
        : Number(prod.sellingPrice);

      let costPrice = variant ? Number(variant.costPrice) : Number(prod.costPrice);

      // Hitung HPP / COGS dinamis dari Resep (BOM) jika ada
      if (prod.recipesAsProduct && prod.recipesAsProduct.length > 0) {
        const matchingRecipes = prod.recipesAsProduct.filter((r) =>
          variant ? r.variantId === variant.variantId || !r.variantId : !r.variantId,
        );
        if (matchingRecipes.length > 0) {
          costPrice = matchingRecipes.reduce((sum, r) => {
            const ingCost = Number(r.costPrice || r.ingredientProduct?.costPrice || 0);
            const wastage = 1 + Number(r.wastagePercent || 0) / 100;
            return sum + Number(r.quantity) * ingCost * wastage;
          }, 0);
        }
      }

      // Modifier calculations
      let itemModifierTotal = 0;
      const modifiersData = (itemDto.modifiers || []).map((m) => {
        const modExtra = Number(m.extraPrice || 0);
        const modQty = Number(m.quantity || 1);
        const modSubtotal = modExtra * modQty;
        itemModifierTotal += modSubtotal;
        return {
          modifierGroupId: m.modifierGroupId || null,
          modifierItemId: m.modifierItemId || null,
          modifierGroupName: m.modifierGroupName,
          modifierItemName: m.modifierItemName,
          extraPrice: new Prisma.Decimal(modExtra),
          quantity: modQty,
          subtotal: new Prisma.Decimal(modSubtotal),
          createdBy: username,
        };
      });

      const qty = Number(itemDto.quantity);
      const lineSubtotal = unitPrice * qty + itemModifierTotal;
      subtotal += lineSubtotal;

      // Tax snapshot dari produk
      const taxRate = prod.tax ? Number(prod.tax.rate) : 0;
      const lineTax = (lineSubtotal * taxRate) / 100;
      totalTax += lineTax;

      return {
        productId: prod.productId,
        variantId: variant ? variant.variantId : null,
        kitchenStationId: prod.kitchenStationId || null,
        itemCode: variant ? variant.variantCode : prod.productCode,
        itemName: prod.productName,
        variantName: variant ? variant.variantName : null,
        quantity: new Prisma.Decimal(qty),
        unitPrice: new Prisma.Decimal(unitPrice),
        costPrice: new Prisma.Decimal(costPrice),
        taxPercent: new Prisma.Decimal(taxRate),
        taxAmount: new Prisma.Decimal(lineTax),
        modifiersAmount: new Prisma.Decimal(itemModifierTotal),
        subtotal: new Prisma.Decimal(lineSubtotal),
        totalAmount: new Prisma.Decimal(lineSubtotal + lineTax),
        notes: itemDto.notes || null,
        createdBy: username,
        modifiers: modifiersData,
      };
    });

    // 4. Kalkulasi Diskon Promo / Member
    let discountAmount = 0;
    if (dto.discountId) {
      const discount = await this.prisma.posDiscount.findUnique({
        where: { discountId: dto.discountId },
      });
      if (discount && discount.isActive === 'Y') {
        const minPurch = Number(discount.minPurchase);
        if (subtotal >= minPurch) {
          if (discount.discountType === 'PERCENTAGE') {
            discountAmount = (subtotal * Number(discount.discountValue)) / 100;
            if (discount.maxDiscount && discountAmount > Number(discount.maxDiscount)) {
              discountAmount = Number(discount.maxDiscount);
            }
          } else {
            discountAmount = Number(discount.discountValue);
          }
        }
      }
    } else if (dto.customerId) {
      // Diskon grup pelanggan (Member loyalty)
      const customer = await this.prisma.posCustomer.findUnique({
        where: { customerId: dto.customerId },
        include: { customerGroup: true },
      });
      if (customer?.customerGroup && Number(customer.customerGroup.discountPercent) > 0) {
        discountAmount = (subtotal * Number(customer.customerGroup.discountPercent)) / 100;
      }
    }

    // 5. Kalkulasi Surcharge (Service Charge toko jika ada)
    let surchargeAmount = 0;
    const surcharges = await this.prisma.posSurcharge.findMany({
      where: {
        OR: [{ outletId: dto.outletId }, { outletId: null }],
        isActive: 'Y',
      },
    });
    for (const sc of surcharges) {
      if (
        sc.applicableOrderType === 'ALL' ||
        sc.applicableOrderType === (dto.orderType || 'DINE_IN')
      ) {
        if (sc.surchargeType === 'PERCENTAGE') {
          surchargeAmount += ((subtotal - discountAmount) * Number(sc.rateValue)) / 100;
        } else {
          surchargeAmount += Number(sc.rateValue);
        }
      }
    }

    const tipAmount = Number(dto.tipAmount || 0);
    const grandTotal = Math.max(0, subtotal - discountAmount + totalTax + surchargeAmount + tipAmount);

    // 6. Numbering
    const orderNumber = await this.generateOrderNumber(outlet.outletCode);

    // 7. Evaluasi Pembayaran (Fast Checkout vs Open Tab)
    const paymentsList = dto.payments || [];
    let paidAmount = 0;
    let changeAmount = 0;

    for (const pay of paymentsList) {
      paidAmount += Number(pay.amount);
      if (pay.tenderedAmount && Number(pay.tenderedAmount) > Number(pay.amount)) {
        changeAmount += Number(pay.tenderedAmount) - Number(pay.amount);
      }
    }

    const isFullyPaid = paidAmount >= grandTotal && paymentsList.length > 0;
    const orderStatus = isFullyPaid ? 'COMPLETED' : 'OPEN';
    const paymentStatus = isFullyPaid ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID';
    const invoiceNumber = isFullyPaid ? await this.generateInvoiceNumber(outlet.outletCode) : null;
    const paidAt = isFullyPaid ? new Date() : null;

    // Loyalty points earn (1 point per Rp 10.000 jika member)
    const loyaltyPointsEarned = dto.customerId && isFullyPaid ? Math.floor(grandTotal / 10000) : 0;

    // 8. Simpan ke database via Prisma Transaction
    return this.prisma.$transaction(async (tx) => {
      // Create Order Header
      const createdOrder = await tx.posOrder.create({
        data: {
          orderNumber,
          invoiceNumber,
          shiftId: dto.shiftId || null,
          outletId: dto.outletId,
          registerId: dto.registerId || null,
          channelId: dto.channelId || null,
          tableId: dto.tableId || null,
          customerId: dto.customerId || null,
          orderType: dto.orderType || 'DINE_IN',
          orderStatus,
          paymentStatus,
          guestName: dto.guestName || null,
          paxCount: dto.paxCount || 1,
          subtotal: new Prisma.Decimal(subtotal),
          discountAmount: new Prisma.Decimal(discountAmount),
          discountId: dto.discountId || null,
          surchargeAmount: new Prisma.Decimal(surchargeAmount),
          taxAmount: new Prisma.Decimal(totalTax),
          tipAmount: new Prisma.Decimal(tipAmount),
          totalAmount: new Prisma.Decimal(grandTotal),
          paidAmount: new Prisma.Decimal(paidAmount),
          changeAmount: new Prisma.Decimal(changeAmount),
          loyaltyPointsEarned: new Prisma.Decimal(loyaltyPointsEarned),
          orderedAt: new Date(),
          paidAt,
          notes: dto.notes || null,
          createdBy: username,
          items: {
            create: preparedItems.map((pi) => ({
              productId: pi.productId,
              variantId: pi.variantId,
              kitchenStationId: pi.kitchenStationId,
              itemCode: pi.itemCode,
              itemName: pi.itemName,
              variantName: pi.variantName,
              quantity: pi.quantity,
              unitPrice: pi.unitPrice,
              costPrice: pi.costPrice,
              taxPercent: pi.taxPercent,
              taxAmount: pi.taxAmount,
              modifiersAmount: pi.modifiersAmount,
              subtotal: pi.subtotal,
              totalAmount: pi.totalAmount,
              notes: pi.notes,
              createdBy: username,
              modifiers: {
                create: pi.modifiers,
              },
            })),
          },
        },
      });

      // Simpan pembayaran jika ada
      if (paymentsList.length > 0) {
        for (const pay of paymentsList) {
          const pm = await this.resolvePaymentMethod(tx, pay);
          await tx.posOrderPayment.create({
            data: {
              orderId: createdOrder.orderId,
              paymentMethodId: pm.paymentMethodId,
              paymentMethodCode: pm.methodCode,
              paymentMethodName: pm.methodName,
              paymentType: pm.methodType,
              amount: new Prisma.Decimal(pay.amount),
              tenderedAmount: new Prisma.Decimal(pay.tenderedAmount || pay.amount),
              changeAmount: new Prisma.Decimal(
                pay.tenderedAmount && Number(pay.tenderedAmount) > Number(pay.amount)
                  ? Number(pay.tenderedAmount) - Number(pay.amount)
                  : 0,
              ),
              referenceNumber: pay.referenceNumber || null,
              cardLastFour: pay.cardLastFour || null,
              cardHolderName: pay.cardHolderName || null,
              paymentStatus: 'SUCCESS',
              createdBy: username,
            },
          });
        }
      }

      // Update status meja restoran jika dine-in
      if (dto.tableId) {
        await tx.posDiningTable.update({
          where: { tableId: dto.tableId },
          data: { status: isFullyPaid ? 'AVAILABLE' : 'OCCUPIED' },
        });
      }

      // Update akumulasi poin loyalty pelanggan
      if (dto.customerId && loyaltyPointsEarned > 0) {
        await tx.posCustomer.update({
          where: { customerId: dto.customerId },
          data: {
            loyaltyPoints: { increment: loyaltyPointsEarned },
          },
        });
      }

      // Potong stok real-time jika order langsung lunas
      if (isFullyPaid) {
        await this.inventoryService.deductOrderStock(createdOrder.orderId, username, tx);
      }

      return tx.posOrder.findUnique({
        where: { orderId: createdOrder.orderId },
        include: {
          items: true,
          payments: { where: { isActive: 'Y' } },
        },
      });
    });
  }

  async addPayment(orderId: string, dto: AddPaymentDto, username: string) {
    const order = await this.prisma.posOrder.findUnique({
      where: { orderId },
      include: {
        outlet: true,
        payments: { where: { isActive: 'Y' } },
      },
    });

    if (!order || order.isActive !== 'Y') {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }
    if (order.orderStatus === 'VOIDED' || order.orderStatus === 'CANCELLED') {
      throw new BadRequestException('Tidak dapat memproses pembayaran pesanan yang dibatalkan / void');
    }
    if (order.paymentStatus === 'PAID') {
      throw new BadRequestException('Pesanan ini sudah lunas');
    }

    const existingPaid = order.payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const grandTotal = Number(order.totalAmount);
    const remainingToPay = Math.max(0, grandTotal - existingPaid);

    // Normalize incoming payments (support both payments array and direct payload)
    const paymentsList: CreateOrderPaymentDto[] = [];
    if (dto.payments && Array.isArray(dto.payments) && dto.payments.length > 0) {
      paymentsList.push(...dto.payments);
    } else if (dto.amount != null || dto.paymentMethod || dto.paymentMethodCode || dto.paymentMethodId) {
      const payAmount = dto.amount != null ? Number(dto.amount) : remainingToPay;
      paymentsList.push({
        paymentMethodId: dto.paymentMethodId,
        paymentMethodCode: dto.paymentMethodCode,
        paymentMethod: dto.paymentMethod,
        amount: Math.min(payAmount, remainingToPay > 0 ? remainingToPay : payAmount),
        tenderedAmount: dto.tenderedAmount != null ? Number(dto.tenderedAmount) : payAmount,
      });
    }

    if (paymentsList.length === 0) {
      throw new BadRequestException('Minimal harus ada 1 rincian pembayaran');
    }

    let newPaid = 0;
    let newChange = 0;

    for (const p of paymentsList) {
      newPaid += Number(p.amount);
      if (p.tenderedAmount && Number(p.tenderedAmount) > Number(p.amount)) {
        newChange += Number(p.tenderedAmount) - Number(p.amount);
      }
    }

    const totalPaidCombined = existingPaid + newPaid;
    const isNowFullyPaid = totalPaidCombined >= grandTotal;

    const invoiceNumber =
      order.invoiceNumber || (isNowFullyPaid ? await this.generateInvoiceNumber(order.outlet.outletCode) : null);

    return this.prisma.$transaction(async (tx) => {
      // Simpan pembayaran baru
      for (const pay of paymentsList) {
        const pm = await this.resolvePaymentMethod(tx, pay);
        await tx.posOrderPayment.create({
          data: {
            orderId,
            paymentMethodId: pm.paymentMethodId,
            paymentMethodCode: pm.methodCode,
            paymentMethodName: pm.methodName,
            paymentType: pm.methodType,
            amount: new Prisma.Decimal(pay.amount),
            tenderedAmount: new Prisma.Decimal(pay.tenderedAmount || pay.amount),
            changeAmount: new Prisma.Decimal(
              pay.tenderedAmount && Number(pay.tenderedAmount) > Number(pay.amount)
                ? Number(pay.tenderedAmount) - Number(pay.amount)
                : 0,
            ),
            referenceNumber: pay.referenceNumber || null,
            cardLastFour: pay.cardLastFour || null,
            cardHolderName: pay.cardHolderName || null,
            paymentStatus: 'SUCCESS',
            createdBy: username,
          },
        });
      }

      // Update Order Header
      const updatedOrder = await tx.posOrder.update({
        where: { orderId },
        data: {
          paidAmount: new Prisma.Decimal(totalPaidCombined),
          changeAmount: new Prisma.Decimal(newChange),
          paymentStatus: isNowFullyPaid ? 'PAID' : 'PARTIAL',
          orderStatus: isNowFullyPaid ? 'COMPLETED' : order.orderStatus,
          invoiceNumber,
          paidAt: isNowFullyPaid ? new Date() : order.paidAt,
          updatedBy: username,
        },
        include: {
          items: true,
          payments: { where: { isActive: 'Y' } },
        },
      });

      // Jika meja diisi dan sudah lunas, bebaskan meja
      if (order.tableId && isNowFullyPaid) {
        await tx.posDiningTable.update({
          where: { tableId: order.tableId },
          data: { status: 'AVAILABLE' },
        });
      }

      // Potong stok real-time saat pelunasan tagihan
      if (isNowFullyPaid) {
        await this.inventoryService.deductOrderStock(orderId, username, tx);
      }

      return updatedOrder;
    });
  }

  async voidOrder(orderId: string, dto: VoidOrderDto, username: string) {
    const order = await this.prisma.posOrder.findUnique({
      where: { orderId },
    });
    if (!order || order.isActive !== 'Y') {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }
    if (order.orderStatus === 'VOIDED') {
      throw new BadRequestException('Pesanan ini sudah berstatus VOID');
    }

    return this.prisma.$transaction(async (tx) => {
      const voided = await tx.posOrder.update({
        where: { orderId },
        data: {
          orderStatus: 'VOIDED',
          voidReason: dto.reason,
          voidBy: username,
          voidedAt: new Date(),
          updatedBy: username,
        },
      });

      // Update status items
      await tx.posOrderItem.updateMany({
        where: { orderId },
        data: {
          itemStatus: 'VOIDED',
          voidReason: dto.reason,
          voidBy: username,
          voidAt: new Date(),
          updatedBy: username,
        },
      });

      // Lepaskan meja jika sebelumnya occupied
      if (order.tableId) {
        await tx.posDiningTable.update({
          where: { tableId: order.tableId },
          data: { status: 'AVAILABLE' },
        });
      }

      // Kembalikan stok bahan / produk (Restock) jika order sempat lunas
      if (order.paymentStatus === 'PAID') {
        await this.inventoryService.restockOrder(orderId, username, tx);
      }

      return voided;
    });
  }

  async findAll(query: QueryOrderDto) {
    const {
      page = 1,
      limit = 10,
      search,
      outletId,
      registerId,
      shiftId,
      tableId,
      customerId,
      orderStatus,
      paymentStatus,
      orderType,
      startDate,
      endDate,
    } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Prisma.PosOrderWhereInput = {
      isActive: 'Y',
    };

    if (outletId) where.outletId = outletId;
    if (registerId) where.registerId = registerId;
    if (shiftId) where.shiftId = shiftId;
    if (tableId) where.tableId = tableId;
    if (customerId) where.customerId = customerId;
    if (orderStatus) where.orderStatus = orderStatus;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (orderType) where.orderType = orderType;

    if (startDate || endDate) {
      where.orderedAt = {};
      if (startDate) where.orderedAt.gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        where.orderedAt.lte = eDate;
      }
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { guestName: { contains: search, mode: 'insensitive' } },
        { customer: { customerName: { contains: search, mode: 'insensitive' } } },
        { table: { tableName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.posOrder.count({ where }),
      this.prisma.posOrder.findMany({
        where,
        skip,
        take,
        orderBy: { orderedAt: 'desc' },
        include: {
          outlet: { select: { outletId: true, outletCode: true, outletName: true } },
          register: { select: { registerId: true, registerCode: true, registerName: true } },
          table: { select: { tableId: true, tableCode: true, tableName: true } },
          customer: { select: { customerId: true, customerCode: true, customerName: true } },
          channel: { select: { channelId: true, channelName: true } },
          payments: {
            where: { isActive: 'Y' },
            select: { paymentMethodName: true, amount: true, paymentType: true },
          },
          _count: { select: { items: true } },
        },
      }),
    ]);

    return {
      data,
      meta: {
        page: Number(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  async findOne(orderId: string) {
    const order = await this.prisma.posOrder.findUnique({
      where: { orderId },
      include: {
        outlet: true,
        register: true,
        shift: {
          select: {
            shiftCode: true,
            cashierUser: { select: { fullname: true, username: true } },
          },
        },
        table: true,
        customer: {
          include: { customerGroup: true },
        },
        channel: true,
        discount: true,
        items: {
          where: { isActive: 'Y' },
          include: {
            modifiers: { where: { isActive: 'Y' } },
            kitchenStation: true,
          },
        },
        payments: {
          where: { isActive: 'Y' },
          include: { paymentMethod: true },
        },
      },
    });

    if (!order || order.isActive !== 'Y') {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }
    return order;
  }
}
