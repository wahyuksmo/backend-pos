import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { QueryStockDto } from './dto/query-stock.dto';
import { QueryMovementDto } from './dto/query-movement.dto';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { QueryAdjustmentDto } from './dto/query-adjustment.dto';
import { CreateTransferDto, UpdateTransferStatusDto } from './dto/create-transfer.dto';
import { QueryTransferDto } from './dto/query-transfer.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateAdjustmentNumber(): Promise<string> {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const countToday = await this.prisma.posStockAdjustment.count({
      where: { createdAt: { gte: startOfDay, lte: endOfDay } },
    });

    return `ADJ/${dateStr}/${String(countToday + 1).padStart(4, '0')}`;
  }

  private async generateTransferNumber(): Promise<string> {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const countToday = await this.prisma.posStockTransfer.count({
      where: { createdAt: { gte: startOfDay, lte: endOfDay } },
    });

    return `TRF/${dateStr}/${String(countToday + 1).padStart(4, '0')}`;
  }

  // --- 1. SALDO STOK (STOCKS) ---
  async getStocks(query: QueryStockDto) {
    const { warehouseId, search, isLowStock, page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Prisma.PosStockWhereInput = {
      isActive: 'Y',
    };

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (search) {
      where.product = {
        OR: [
          { productName: { contains: search, mode: 'insensitive' } },
          { productCode: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [total, items] = await Promise.all([
      this.prisma.posStock.count({ where }),
      this.prisma.posStock.findMany({
        where,
        skip,
        take,
        include: {
          warehouse: { select: { warehouseId: true, warehouseCode: true, warehouseName: true } },
          product: {
            select: {
              productId: true,
              productCode: true,
              productName: true,
              sku: true,
              barcode: true,
              costPrice: true,
              sellingPrice: true,
              unit: { select: { unitCode: true, unitName: true } },
            },
          },
          variant: { select: { variantId: true, variantCode: true, variantName: true } },
        },
        orderBy: [{ warehouse: { warehouseName: 'asc' } }, { product: { productName: 'asc' } }],
      }),
    ]);

    const filteredItems = isLowStock === 'Y' 
      ? items.filter((i) => Number(i.quantity) <= Number(i.minStock))
      : items;

    return {
      data: filteredItems,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: isLowStock === 'Y' ? filteredItems.length : total,
        totalPages: Math.ceil((isLowStock === 'Y' ? filteredItems.length : total) / take),
      },
    };
  }

  // --- 2. KARTU STOK & MUTASI (MOVEMENTS) ---
  async getMovements(query: QueryMovementDto) {
    const { warehouseId, productId, movementType, referenceType, startDate, endDate, search, page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Prisma.PosStockMovementWhereInput = {
      isActive: 'Y',
    };

    if (warehouseId) where.warehouseId = warehouseId;
    if (productId) where.productId = productId;
    if (movementType) where.movementType = movementType;
    if (referenceType) where.referenceType = referenceType;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) where.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`);
    }

    if (search) {
      where.OR = [
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { product: { productName: { contains: search, mode: 'insensitive' } } },
        { product: { productCode: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.posStockMovement.count({ where }),
      this.prisma.posStockMovement.findMany({
        where,
        skip,
        take,
        include: {
          warehouse: { select: { warehouseId: true, warehouseCode: true, warehouseName: true } },
          product: {
            select: {
              productId: true,
              productCode: true,
              productName: true,
              unit: { select: { unitCode: true, unitName: true } },
            },
          },
          variant: { select: { variantId: true, variantCode: true, variantName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: items,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  // --- 3. STOCK ADJUSTMENT / OPNAME ---
  async createAdjustment(dto: CreateAdjustmentDto, username: string) {
    const warehouse = await this.prisma.posWarehouse.findUnique({
      where: { warehouseId: dto.warehouseId },
    });
    if (!warehouse || warehouse.isActive !== 'Y') {
      throw new BadRequestException('Gudang tidak valid atau tidak aktif');
    }

    const adjustmentNumber = await this.generateAdjustmentNumber();

    return this.prisma.$transaction(async (tx) => {
      const adjustment = await tx.posStockAdjustment.create({
        data: {
          adjustmentNumber,
          warehouseId: dto.warehouseId,
          reason: dto.reason || 'OPNAME',
          status: 'APPROVED',
          notes: dto.notes,
          createdBy: username,
          updatedBy: username,
        },
      });

      for (const item of dto.items) {
        // Ambil stok saat ini
        const currentStock = await tx.posStock.findFirst({
          where: {
            warehouseId: dto.warehouseId,
            productId: item.productId,
            variantId: item.variantId || null,
          },
        });

        const systemQty = currentStock ? Number(currentStock.quantity) : 0;
        const actualQty = Number(item.actualQuantity);
        const diffQty = actualQty - systemQty;

        // Simpan baris adjustment item
        await tx.posStockAdjustmentItem.create({
          data: {
            adjustmentId: adjustment.adjustmentId,
            productId: item.productId,
            variantId: item.variantId || null,
            systemQuantity: new Prisma.Decimal(systemQty),
            actualQuantity: new Prisma.Decimal(actualQty),
            differenceQuantity: new Prisma.Decimal(diffQty),
            notes: item.notes,
            createdBy: username,
          },
        });

        // Update saldo stok di gudang
        if (currentStock) {
          await tx.posStock.update({
            where: { stockId: currentStock.stockId },
            data: {
              quantity: new Prisma.Decimal(actualQty),
              updatedBy: username,
            },
          });
        } else {
          await tx.posStock.create({
            data: {
              warehouseId: dto.warehouseId,
              productId: item.productId,
              variantId: item.variantId || null,
              quantity: new Prisma.Decimal(actualQty),
              createdBy: username,
            },
          });
        }

        // Catat Kartu Stok (Movement)
        await tx.posStockMovement.create({
          data: {
            warehouseId: dto.warehouseId,
            productId: item.productId,
            variantId: item.variantId || null,
            movementType: 'ADJUSTMENT',
            referenceType: 'ADJUSTMENT',
            referenceId: adjustment.adjustmentId,
            referenceNumber: adjustmentNumber,
            quantity: new Prisma.Decimal(diffQty),
            balanceBefore: new Prisma.Decimal(systemQty),
            balanceAfter: new Prisma.Decimal(actualQty),
            notes: item.notes || `Penyesuaian stok Opname (${dto.reason || 'OPNAME'})`,
            createdBy: username,
          },
        });
      }

      return adjustment;
    });
  }

  async getAdjustments(query: QueryAdjustmentDto) {
    const { warehouseId, status, reason, search, page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Prisma.PosStockAdjustmentWhereInput = {
      isActive: 'Y',
    };

    if (warehouseId) where.warehouseId = warehouseId;
    if (status) where.status = status;
    if (reason) where.reason = reason;
    if (search) {
      where.adjustmentNumber = { contains: search, mode: 'insensitive' };
    }

    const [total, items] = await Promise.all([
      this.prisma.posStockAdjustment.count({ where }),
      this.prisma.posStockAdjustment.findMany({
        where,
        skip,
        take,
        include: {
          warehouse: { select: { warehouseId: true, warehouseCode: true, warehouseName: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: items,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async getAdjustmentById(adjustmentId: string) {
    const adj = await this.prisma.posStockAdjustment.findUnique({
      where: { adjustmentId },
      include: {
        warehouse: true,
        items: {
          include: {
            product: {
              select: {
                productId: true,
                productCode: true,
                productName: true,
                unit: { select: { unitCode: true, unitName: true } },
              },
            },
            variant: { select: { variantId: true, variantName: true } },
          },
        },
      },
    });

    if (!adj) {
      throw new NotFoundException('Data penyesuaian stok tidak ditemukan');
    }
    return adj;
  }

  // --- 4. STOCK TRANSFER (ANTAR GUDANG) ---
  async createTransfer(dto: CreateTransferDto, username: string) {
    if (dto.fromWarehouseId === dto.toWarehouseId) {
      throw new BadRequestException('Gudang asal dan tujuan tidak boleh sama');
    }

    const [fromW, toW] = await Promise.all([
      this.prisma.posWarehouse.findUnique({ where: { warehouseId: dto.fromWarehouseId } }),
      this.prisma.posWarehouse.findUnique({ where: { warehouseId: dto.toWarehouseId } }),
    ]);

    if (!fromW || fromW.isActive !== 'Y' || !toW || toW.isActive !== 'Y') {
      throw new BadRequestException('Gudang asal atau tujuan tidak valid');
    }

    const transferNumber = await this.generateTransferNumber();

    return this.prisma.posStockTransfer.create({
      data: {
        transferNumber,
        fromWarehouseId: dto.fromWarehouseId,
        toWarehouseId: dto.toWarehouseId,
        status: 'PENDING',
        notes: dto.notes,
        createdBy: username,
        items: {
          create: dto.items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId || null,
            quantity: new Prisma.Decimal(i.quantity),
            notes: i.notes,
            createdBy: username,
          })),
        },
      },
      include: { items: true },
    });
  }

  async getTransfers(query: QueryTransferDto) {
    const { fromWarehouseId, toWarehouseId, status, search, page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Prisma.PosStockTransferWhereInput = {
      isActive: 'Y',
    };

    if (fromWarehouseId) where.fromWarehouseId = fromWarehouseId;
    if (toWarehouseId) where.toWarehouseId = toWarehouseId;
    if (status) where.status = status;
    if (search) {
      where.transferNumber = { contains: search, mode: 'insensitive' };
    }

    const [total, items] = await Promise.all([
      this.prisma.posStockTransfer.count({ where }),
      this.prisma.posStockTransfer.findMany({
        where,
        skip,
        take,
        include: {
          fromWarehouse: { select: { warehouseCode: true, warehouseName: true } },
          toWarehouse: { select: { warehouseCode: true, warehouseName: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: items,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async getTransferById(transferId: string) {
    const transfer = await this.prisma.posStockTransfer.findUnique({
      where: { transferId },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: {
          include: {
            product: {
              select: {
                productId: true,
                productCode: true,
                productName: true,
                unit: { select: { unitCode: true, unitName: true } },
              },
            },
            variant: { select: { variantId: true, variantName: true } },
          },
        },
      },
    });

    if (!transfer) {
      throw new NotFoundException('Data transfer stok tidak ditemukan');
    }
    return transfer;
  }

  async updateTransferStatus(transferId: string, dto: UpdateTransferStatusDto, username: string) {
    const transfer = await this.getTransferById(transferId);

    if (transfer.status === 'RECEIVED' || transfer.status === 'CANCELLED') {
      throw new BadRequestException('Transfer yang sudah selesai atau dibatalkan tidak dapat diubah lagi');
    }

    if (dto.status === 'RECEIVED') {
      // Eksekusi mutasi perpindahan stok dalam transaksi
      return this.prisma.$transaction(async (tx) => {
        for (const item of transfer.items) {
          const qty = Number(item.quantity);

          // 1. Kurangi dari Gudang Asal
          const fromStock = await tx.posStock.findFirst({
            where: {
              warehouseId: transfer.fromWarehouseId,
              productId: item.productId,
              variantId: item.variantId || null,
            },
          });
          const fromBefore = fromStock ? Number(fromStock.quantity) : 0;
          const fromAfter = fromBefore - qty;

          if (fromStock) {
            await tx.posStock.update({
              where: { stockId: fromStock.stockId },
              data: { quantity: new Prisma.Decimal(fromAfter), updatedBy: username },
            });
          } else {
            await tx.posStock.create({
              data: {
                warehouseId: transfer.fromWarehouseId,
                productId: item.productId,
                variantId: item.variantId || null,
                quantity: new Prisma.Decimal(fromAfter),
                createdBy: username,
              },
            });
          }

          await tx.posStockMovement.create({
            data: {
              warehouseId: transfer.fromWarehouseId,
              productId: item.productId,
              variantId: item.variantId || null,
              movementType: 'TRANSFER_OUT',
              referenceType: 'TRANSFER',
              referenceId: transfer.transferId,
              referenceNumber: transfer.transferNumber,
              quantity: new Prisma.Decimal(-qty),
              balanceBefore: new Prisma.Decimal(fromBefore),
              balanceAfter: new Prisma.Decimal(fromAfter),
              notes: `Kirim transfer ke ${transfer.toWarehouse.warehouseName}`,
              createdBy: username,
            },
          });

          // 2. Tambahkan ke Gudang Tujuan
          const toStock = await tx.posStock.findFirst({
            where: {
              warehouseId: transfer.toWarehouseId,
              productId: item.productId,
              variantId: item.variantId || null,
            },
          });
          const toBefore = toStock ? Number(toStock.quantity) : 0;
          const toAfter = toBefore + qty;

          if (toStock) {
            await tx.posStock.update({
              where: { stockId: toStock.stockId },
              data: { quantity: new Prisma.Decimal(toAfter), updatedBy: username },
            });
          } else {
            await tx.posStock.create({
              data: {
                warehouseId: transfer.toWarehouseId,
                productId: item.productId,
                variantId: item.variantId || null,
                quantity: new Prisma.Decimal(toAfter),
                createdBy: username,
              },
            });
          }

          await tx.posStockMovement.create({
            data: {
              warehouseId: transfer.toWarehouseId,
              productId: item.productId,
              variantId: item.variantId || null,
              movementType: 'TRANSFER_IN',
              referenceType: 'TRANSFER',
              referenceId: transfer.transferId,
              referenceNumber: transfer.transferNumber,
              quantity: new Prisma.Decimal(qty),
              balanceBefore: new Prisma.Decimal(toBefore),
              balanceAfter: new Prisma.Decimal(toAfter),
              notes: `Terima transfer dari ${transfer.fromWarehouse.warehouseName}`,
              createdBy: username,
            },
          });
        }

        return tx.posStockTransfer.update({
          where: { transferId },
          data: {
            status: 'RECEIVED',
            notes: dto.notes ? `${transfer.notes || ''} | ${dto.notes}` : transfer.notes,
            updatedBy: username,
          },
        });
      });
    }

    return this.prisma.posStockTransfer.update({
      where: { transferId },
      data: {
        status: dto.status,
        notes: dto.notes ? `${transfer.notes || ''} | ${dto.notes}` : transfer.notes,
        updatedBy: username,
      },
    });
  }

  // --- 5. ENGINE PEMOTONGAN STOK REAL-TIME SAAT ORDER LUNAS ---
  private async getConversionMultiplier(
    tx: Prisma.TransactionClient,
    fromUnitId: string,
    toUnitId: string,
  ): Promise<number> {
    if (fromUnitId === toUnitId) return 1;

    const direct = await tx.posUnitConversion.findFirst({
      where: { fromUnitId, toUnitId, isActive: 'Y' },
    });
    if (direct) return Number(direct.multiplier);

    const reverse = await tx.posUnitConversion.findFirst({
      where: { fromUnitId: toUnitId, toUnitId: fromUnitId, isActive: 'Y' },
    });
    if (reverse && Number(reverse.multiplier) !== 0) {
      return 1 / Number(reverse.multiplier);
    }

    return 1;
  }

  async deductOrderStock(orderId: string, username: string, txClient?: Prisma.TransactionClient) {
    const tx = txClient || this.prisma;

    const order = await tx.posOrder.findUnique({
      where: { orderId },
      include: {
        items: {
          where: { isActive: 'Y', itemStatus: { not: 'VOIDED' } },
          include: {
            modifiers: { where: { isActive: 'Y' } },
          },
        },
        outlet: { include: { warehouses: { where: { isActive: 'Y' } } } },
      },
    });

    if (!order || !order.outlet) return;

    // Tentukan gudang outlet (prioritas default atau gudang pertama terkait outlet)
    let warehouse = order.outlet.warehouses.find((w) => w.isDefault === 'Y') || order.outlet.warehouses[0];
    if (!warehouse) {
      // Jika outlet belum memiliki gudang, cari gudang default manapun
      const anyDefault = await tx.posWarehouse.findFirst({ where: { isActive: 'Y' } });
      if (!anyDefault) return; // Tidak ada gudang di sistem
      warehouse = anyDefault;
    }

    const warehouseId = warehouse.warehouseId;

    for (const item of order.items) {
      const itemQty = Number(item.quantity);

      const product = await tx.posProduct.findUnique({
        where: { productId: item.productId },
      });
      if (!product) continue;

      // Cek stok Finish Good yang tersedia di gudang outlet
      let availableFgQty = 0;
      if (product.isInventoryTracked === 'Y') {
        const fgStock = await tx.posStock.findFirst({
          where: {
            warehouseId,
            productId: item.productId,
            variantId: item.variantId || null,
          },
        });
        if (fgStock && Number(fgStock.quantity) > 0) {
          availableFgQty = Number(fgStock.quantity);
        }
      }

      // Cek apakah produk memiliki resep olahan (BOM)
      const recipes = await tx.posProductRecipe.findMany({
        where: {
          productId: item.productId,
          variantId: item.variantId || null,
          isActive: 'Y',
        },
        include: {
          ingredientProduct: { select: { unitId: true, isInventoryTracked: true } },
        },
      });
      const hasRecipes = recipes && recipes.length > 0;

      // 1. Potong stok Finish Good yang tersedia (MTS)
      let fgDeductQty = 0;
      let remainingQty = itemQty;

      if (availableFgQty > 0) {
        fgDeductQty = Math.min(itemQty, availableFgQty);
        remainingQty = itemQty - fgDeductQty;

        await this.executeDeduction(
          tx,
          warehouseId,
          item.productId,
          item.variantId || null,
          fgDeductQty,
          order.orderId,
          order.orderNumber,
          username,
          `Penjualan POS (Finish Good): ${item.itemName} (${fgDeductQty})`,
        );
      }

      // 2. Sisa kebutuhan yang belum tercover Finish Good
      if (remainingQty > 0) {
        if (hasRecipes) {
          // Potong bahan baku sesuai sisa qty (MTO)
          for (const recipe of recipes) {
            const wastageFactor = 1 + Number(recipe.wastagePercent || 0) / 100;
            let multiplier = 1;
            if (recipe.ingredientProduct?.unitId && recipe.unitId !== recipe.ingredientProduct.unitId) {
              multiplier = await this.getConversionMultiplier(
                tx,
                recipe.unitId,
                recipe.ingredientProduct.unitId,
              );
            }

            const neededQty = Number(recipe.quantity) * remainingQty * multiplier * wastageFactor;
            await this.executeDeduction(
              tx,
              warehouseId,
              recipe.ingredientProductId,
              null,
              neededQty,
              order.orderId,
              order.orderNumber,
              username,
              `BOM Resep: ${item.itemName} (${neededQty})`,
            );
          }
        } else if (product.isInventoryTracked === 'Y') {
          // Produk reguler non-resep: potong langsung stok produk
          await this.executeDeduction(
            tx,
            warehouseId,
            item.productId,
            item.variantId || null,
            remainingQty,
            order.orderId,
            order.orderNumber,
            username,
            `Penjualan POS: ${item.itemName} (${remainingQty})`,
          );
        }
      }

      // Potong stok tambahan dari Modifier / Topping jika relevan
      if (item.modifiers && item.modifiers.length > 0) {
        for (const mod of item.modifiers) {
          const modQty = Number(mod.quantity || 1) * itemQty;
          const modProduct = await tx.posProduct.findFirst({
            where: {
              productName: { equals: mod.modifierItemName, mode: 'insensitive' },
              isInventoryTracked: 'Y',
              isActive: 'Y',
            },
          });
          if (modProduct) {
            await this.executeDeduction(
              tx,
              warehouseId,
              modProduct.productId,
              null,
              modQty,
              order.orderId,
              order.orderNumber,
              username,
              `Modifier Penjualan: ${mod.modifierItemName} (${modQty})`,
            );
          }
        }
      }
    }
  }

  private async executeDeduction(
    tx: Prisma.TransactionClient,
    warehouseId: string,
    productId: string,
    variantId: string | null,
    quantity: number,
    orderId: string,
    orderNumber: string,
    username: string,
    notes: string,
  ) {
    const stock = await tx.posStock.findFirst({
      where: { warehouseId, productId, variantId },
    });

    const before = stock ? Number(stock.quantity) : 0;
    const after = before - quantity; // Boleh minus (negative stock allowed dengan flag alert)

    if (stock) {
      await tx.posStock.update({
        where: { stockId: stock.stockId },
        data: {
          quantity: new Prisma.Decimal(after),
          updatedBy: username,
        },
      });
    } else {
      await tx.posStock.create({
        data: {
          warehouseId,
          productId,
          variantId,
          quantity: new Prisma.Decimal(after),
          createdBy: username,
        },
      });
    }

    await tx.posStockMovement.create({
      data: {
        warehouseId,
        productId,
        variantId,
        movementType: 'SALE_DEDUCT',
        referenceType: 'ORDER',
        referenceId: orderId,
        referenceNumber: orderNumber,
        quantity: new Prisma.Decimal(-quantity),
        balanceBefore: new Prisma.Decimal(before),
        balanceAfter: new Prisma.Decimal(after),
        notes,
        createdBy: username,
      },
    });
  }

  // --- 6. AUTO RESTOCK SAAT ORDER DI-VOID ---
  async restockOrder(orderId: string, username: string, txClient?: Prisma.TransactionClient) {
    const tx = txClient || this.prisma;

    // Cari seluruh mutasi SALE_DEDUCT dari order ini
    const movements = await tx.posStockMovement.findMany({
      where: {
        referenceType: 'ORDER',
        referenceId: orderId,
        movementType: 'SALE_DEDUCT',
        isActive: 'Y',
      },
    });

    for (const mov of movements) {
      const restoreQty = Math.abs(Number(mov.quantity));

      const stock = await tx.posStock.findFirst({
        where: {
          warehouseId: mov.warehouseId,
          productId: mov.productId,
          variantId: mov.variantId || null,
        },
      });

      const before = stock ? Number(stock.quantity) : 0;
      const after = before + restoreQty;

      if (stock) {
        await tx.posStock.update({
          where: { stockId: stock.stockId },
          data: {
            quantity: new Prisma.Decimal(after),
            updatedBy: username,
          },
        });
      } else {
        await tx.posStock.create({
          data: {
            warehouseId: mov.warehouseId,
            productId: mov.productId,
            variantId: mov.variantId || null,
            quantity: new Prisma.Decimal(after),
            createdBy: username,
          },
        });
      }

      await tx.posStockMovement.create({
        data: {
          warehouseId: mov.warehouseId,
          productId: mov.productId,
          variantId: mov.variantId || null,
          movementType: 'VOID_RESTOCK',
          referenceType: 'ORDER',
          referenceId: orderId,
          referenceNumber: mov.referenceNumber,
          quantity: new Prisma.Decimal(restoreQty),
          balanceBefore: new Prisma.Decimal(before),
          balanceAfter: new Prisma.Decimal(after),
          notes: `Pengembalian stok void order ${mov.referenceNumber}`,
          createdBy: username,
        },
      });
    }
  }
}
