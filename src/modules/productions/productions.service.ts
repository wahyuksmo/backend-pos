import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateProductionDto } from './dto/create-production.dto';
import { QueryProductionDto } from './dto/query-production.dto';

@Injectable()
export class ProductionsService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateProductionNumber(tx: Prisma.TransactionClient): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `PRD-${dateStr}-`;

    const lastProd = await tx.posProduction.findFirst({
      where: {
        productionNumber: { startsWith: prefix },
      },
      orderBy: { productionNumber: 'desc' },
      select: { productionNumber: true },
    });

    let nextSeq = 1;
    if (lastProd?.productionNumber) {
      const parts = lastProd.productionNumber.split('-');
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }

    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  async calculateFromBom(productId: string, quantity: number = 1, variantId?: string) {
    const product = await this.prisma.posProduct.findUnique({
      where: { productId },
      include: { unit: true },
    });

    if (!product) {
      throw new NotFoundException(`Produk dengan ID "${productId}" tidak ditemukan`);
    }

    const targetVariantId = variantId ? variantId : null;

    // Cari resep spesifik varian atau resep global
    let recipes = await this.prisma.posProductRecipe.findMany({
      where: {
        productId,
        variantId: targetVariantId,
        isActive: 'Y',
      },
      include: {
        ingredientProduct: { select: { productId: true, productCode: true, productName: true, costPrice: true, unitId: true } },
        unit: { select: { unitId: true, unitCode: true, unitName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Jika varian dicari tapi tidak ada resep spesifik varian, fallback ke resep global (variantId: null)
    if (recipes.length === 0 && targetVariantId !== null) {
      recipes = await this.prisma.posProductRecipe.findMany({
        where: {
          productId,
          variantId: null,
          isActive: 'Y',
        },
        include: {
          ingredientProduct: { select: { productId: true, productCode: true, productName: true, costPrice: true, unitId: true } },
          unit: { select: { unitId: true, unitCode: true, unitName: true } },
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    let totalEstimatedCost = 0;
    const materials = recipes.map((r) => {
      const wastageFactor = 1 + Number(r.wastagePercent || 0) / 100;
      const bomQty = Number(r.quantity) * quantity * wastageFactor;
      const unitCost = Number(r.costPrice) > 0 ? Number(r.costPrice) : Number(r.ingredientProduct.costPrice || 0);
      const subtotal = bomQty * unitCost;
      totalEstimatedCost += subtotal;

      return {
        productId: r.ingredientProductId,
        productCode: r.ingredientProduct.productCode,
        productName: r.ingredientProduct.productName,
        variantId: null,
        unitId: r.unitId,
        unitCode: r.unit?.unitCode || '',
        unitName: r.unit?.unitName || '',
        bomQuantity: Math.round(bomQty * 10000) / 10000,
        actualQuantity: Math.round(bomQty * 10000) / 10000,
        costPrice: unitCost,
        subtotalCost: Math.round(subtotal),
      };
    });

    return {
      product: {
        productId: product.productId,
        productCode: product.productCode,
        productName: product.productName,
        unitId: product.unitId,
        unitCode: product.unit?.unitCode,
      },
      targetQuantity: quantity,
      materials,
      totalEstimatedCost: Math.round(totalEstimatedCost),
      costPerUnit: quantity > 0 ? Math.round(totalEstimatedCost / quantity) : 0,
    };
  }

  async create(dto: CreateProductionDto, username?: string) {
    const operator = username || 'SYSTEM';

    const targetProduct = await this.prisma.posProduct.findUnique({
      where: { productId: dto.productId },
      include: { unit: true },
    });
    if (!targetProduct) {
      throw new NotFoundException(`Produk hasil jadi dengan ID "${dto.productId}" tidak ditemukan`);
    }

    const warehouse = await this.prisma.posWarehouse.findUnique({
      where: { warehouseId: dto.warehouseId },
    });
    if (!warehouse) {
      throw new NotFoundException(`Gudang dengan ID "${dto.warehouseId}" tidak ditemukan`);
    }

    return this.prisma.$transaction(async (tx) => {
      const productionNumber = await this.generateProductionNumber(tx);

      // Hitung total biaya material
      let totalMaterialCost = 0;
      const materialRows = dto.materials.map((m) => {
        const cost = Number(m.costPrice || 0);
        const subtotal = Number(m.actualQuantity) * cost;
        totalMaterialCost += subtotal;

        return {
          productId: m.productId,
          variantId: m.variantId || null,
          unitId: m.unitId || null,
          bomQuantity: new Prisma.Decimal(m.bomQuantity || m.actualQuantity),
          actualQuantity: new Prisma.Decimal(m.actualQuantity),
          costPrice: new Prisma.Decimal(cost),
          subtotalCost: new Prisma.Decimal(subtotal),
          notes: m.notes || null,
          objectCode: 'PRODUCTION_MATERIAL',
          createdBy: operator,
          updatedBy: operator,
        };
      });

      const actualQty = Number(dto.actualQuantity);
      const costPerUnit = actualQty > 0 ? totalMaterialCost / actualQty : 0;

      // 1. Buat record Dokumen Produksi
      const production = await tx.posProduction.create({
        data: {
          productionNumber,
          warehouseId: dto.warehouseId,
          productId: dto.productId,
          variantId: dto.variantId || null,
          unitId: dto.unitId || targetProduct.unitId || null,
          productionDate: dto.productionDate ? new Date(dto.productionDate) : new Date(),
          targetQuantity: new Prisma.Decimal(dto.targetQuantity),
          actualQuantity: new Prisma.Decimal(actualQty),
          status: 'COMPLETED',
          totalMaterialCost: new Prisma.Decimal(totalMaterialCost),
          costPerUnit: new Prisma.Decimal(costPerUnit),
          notes: dto.notes || null,
          objectCode: 'PRODUCTION',
          createdBy: operator,
          updatedBy: operator,
          materials: {
            create: materialRows,
          },
        },
      });

      // 2. Potong stok bahan baku (Stock Movement OUT)
      for (const m of dto.materials) {
        const matQty = Number(m.actualQuantity);
        const stock = await tx.posStock.findFirst({
          where: {
            warehouseId: dto.warehouseId,
            productId: m.productId,
            variantId: m.variantId || null,
          },
        });

        const before = stock ? Number(stock.quantity) : 0;
        const after = before - matQty;

        if (stock) {
          await tx.posStock.update({
            where: { stockId: stock.stockId },
            data: { quantity: new Prisma.Decimal(after), updatedBy: operator },
          });
        } else {
          await tx.posStock.create({
            data: {
              warehouseId: dto.warehouseId,
              productId: m.productId,
              variantId: m.variantId || null,
              quantity: new Prisma.Decimal(after),
              createdBy: operator,
              updatedBy: operator,
            },
          });
        }

        await tx.posStockMovement.create({
          data: {
            warehouseId: dto.warehouseId,
            productId: m.productId,
            variantId: m.variantId || null,
            movementType: 'OUT',
            referenceType: 'PRODUCTION',
            referenceId: production.productionId,
            referenceNumber: production.productionNumber,
            quantity: new Prisma.Decimal(matQty),
            balanceBefore: new Prisma.Decimal(before),
            balanceAfter: new Prisma.Decimal(after),
            notes: `Konsumsi Produksi: ${production.productionNumber} (${targetProduct.productName})`,
            createdBy: operator,
            updatedBy: operator,
          },
        });
      }

      // 3. Tambah stok produk jadi (Stock Movement IN)
      const fgStock = await tx.posStock.findFirst({
        where: {
          warehouseId: dto.warehouseId,
          productId: dto.productId,
          variantId: dto.variantId || null,
        },
      });

      const fgBefore = fgStock ? Number(fgStock.quantity) : 0;
      const fgAfter = fgBefore + actualQty;

      if (fgStock) {
        await tx.posStock.update({
          where: { stockId: fgStock.stockId },
          data: { quantity: new Prisma.Decimal(fgAfter), updatedBy: operator },
        });
      } else {
        await tx.posStock.create({
          data: {
            warehouseId: dto.warehouseId,
            productId: dto.productId,
            variantId: dto.variantId || null,
            quantity: new Prisma.Decimal(fgAfter),
            createdBy: operator,
            updatedBy: operator,
          },
        });
      }

      await tx.posStockMovement.create({
        data: {
          warehouseId: dto.warehouseId,
          productId: dto.productId,
          variantId: dto.variantId || null,
          movementType: 'IN',
          referenceType: 'PRODUCTION',
          referenceId: production.productionId,
          referenceNumber: production.productionNumber,
          quantity: new Prisma.Decimal(actualQty),
          balanceBefore: new Prisma.Decimal(fgBefore),
          balanceAfter: new Prisma.Decimal(fgAfter),
          notes: `Hasil Produksi Jadi: ${production.productionNumber}`,
          createdBy: operator,
          updatedBy: operator,
        },
      });

      // Kembalikan objek lengkap
      return tx.posProduction.findUnique({
        where: { productionId: production.productionId },
        include: {
          warehouse: { select: { warehouseId: true, warehouseCode: true, warehouseName: true } },
          product: { select: { productId: true, productCode: true, productName: true, costPrice: true } },
          variant: { select: { variantId: true, variantCode: true, variantName: true } },
          unit: { select: { unitId: true, unitCode: true, unitName: true } },
          materials: {
            include: {
              product: { select: { productId: true, productCode: true, productName: true } },
              variant: { select: { variantId: true, variantCode: true, variantName: true } },
              unit: { select: { unitId: true, unitCode: true, unitName: true } },
            },
          },
        },
      });
    });
  }

  async findAll(query: QueryProductionDto) {
    const {
      page = 1,
      limit = 10,
      warehouseId,
      productId,
      status,
      startDate,
      endDate,
      search,
      sortBy = 'productionDate',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.PosProductionWhereInput = {
      ...(warehouseId && { warehouseId }),
      ...(productId && { productId }),
      ...(status && { status }),
      ...(startDate &&
        endDate && {
          productionDate: {
            gte: new Date(`${startDate}T00:00:00.000Z`),
            lte: new Date(`${endDate}T23:59:59.999Z`),
          },
        }),
      ...(search && {
        OR: [
          { productionNumber: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
          { product: { productName: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.posProduction.count({ where }),
      this.prisma.posProduction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          warehouse: { select: { warehouseId: true, warehouseCode: true, warehouseName: true } },
          product: { select: { productId: true, productCode: true, productName: true, costPrice: true } },
          variant: { select: { variantId: true, variantCode: true, variantName: true } },
          unit: { select: { unitId: true, unitCode: true, unitName: true } },
          materials: {
            include: {
              product: { select: { productId: true, productCode: true, productName: true } },
              unit: { select: { unitId: true, unitCode: true, unitName: true } },
            },
          },
        },
      }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.posProduction.findUnique({
      where: { productionId: id },
      include: {
        warehouse: { select: { warehouseId: true, warehouseCode: true, warehouseName: true } },
        product: { select: { productId: true, productCode: true, productName: true, costPrice: true } },
        variant: { select: { variantId: true, variantCode: true, variantName: true } },
        unit: { select: { unitId: true, unitCode: true, unitName: true } },
        materials: {
          include: {
            product: { select: { productId: true, productCode: true, productName: true } },
            variant: { select: { variantId: true, variantCode: true, variantName: true } },
            unit: { select: { unitId: true, unitCode: true, unitName: true } },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Dokumen Produksi dengan ID "${id}" tidak ditemukan`);
    }

    return item;
  }
}
