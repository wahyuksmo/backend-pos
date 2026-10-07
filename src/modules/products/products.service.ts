import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import {
  CreateModifierGroupDto,
  CreateModifierItemDto,
  CreateProductDto,
  CreateProductOutletPriceDto,
  CreateProductVariantDto,
} from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto, username?: string) {
    const existing = await this.prisma.posProduct.findUnique({
      where: { productCode: dto.productCode },
    });
    if (existing) {
      throw new BadRequestException(`Kode produk "${dto.productCode}" sudah digunakan`);
    }

    if (dto.sku) {
      const existingSku = await this.prisma.posProduct.findUnique({
        where: { sku: dto.sku },
      });
      if (existingSku) {
        throw new BadRequestException(`SKU "${dto.sku}" sudah digunakan`);
      }
    }

    const { variants, outletPrices, modifierGroups, ...baseData } = dto;

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.posProduct.create({
        data: {
          ...baseData,
          costPrice: new Prisma.Decimal(baseData.costPrice ?? 0),
          sellingPrice: new Prisma.Decimal(baseData.sellingPrice ?? 0),
          minStock: new Prisma.Decimal(baseData.minStock ?? 0),
          maxStock: new Prisma.Decimal(baseData.maxStock ?? 0),
          objectCode: 'PRODUCT',
          createdBy: username || 'SYSTEM',
          updatedBy: username || 'SYSTEM',
        },
      });

      // Handle initial variants
      if (variants && variants.length > 0) {
        for (const v of variants) {
          await tx.posProductVariant.create({
            data: {
              productId: product.productId,
              variantCode: v.variantCode,
              variantName: v.variantName,
              sku: v.sku,
              barcode: v.barcode,
              costPrice: new Prisma.Decimal(v.costPrice ?? 0),
              sellingPrice: new Prisma.Decimal(v.sellingPrice ?? 0),
              isActive: v.isActive || 'Y',
              objectCode: 'PRODUCT_VARIANT',
              createdBy: username || 'SYSTEM',
              updatedBy: username || 'SYSTEM',
            },
          });
        }
      }

      // Handle initial outlet prices
      if (outletPrices && outletPrices.length > 0) {
        for (const op of outletPrices) {
          await tx.posProductOutletPrice.create({
            data: {
              productId: product.productId,
              outletId: op.outletId,
              variantId: op.variantId,
              sellingPrice: new Prisma.Decimal(op.sellingPrice),
              objectCode: 'PRODUCT_PRICE',
              createdBy: username || 'SYSTEM',
              updatedBy: username || 'SYSTEM',
            },
          });
        }
      }

      // Handle initial modifier groups & items
      if (modifierGroups && modifierGroups.length > 0) {
        for (const mg of modifierGroups) {
          const group = await tx.posProductModifierGroup.create({
            data: {
              productId: product.productId,
              groupName: mg.groupName,
              minSelect: mg.minSelect ?? 0,
              maxSelect: mg.maxSelect ?? 1,
              isRequired: mg.isRequired || 'N',
              objectCode: 'MODIFIER_GROUP',
              createdBy: username || 'SYSTEM',
              updatedBy: username || 'SYSTEM',
            },
          });

          if (mg.items && mg.items.length > 0) {
            for (const item of mg.items) {
              await tx.posProductModifierItem.create({
                data: {
                  modifierGroupId: group.modifierGroupId,
                  itemName: item.itemName,
                  extraPrice: new Prisma.Decimal(item.extraPrice ?? 0),
                  objectCode: 'MODIFIER_ITEM',
                  createdBy: username || 'SYSTEM',
                  updatedBy: username || 'SYSTEM',
                },
              });
            }
          }
        }
      }

      return tx.posProduct.findUnique({
        where: { productId: product.productId },
        include: {
          category: true,
          brand: true,
          unit: true,
          tax: true,
          variants: true,
          outletPrices: { include: { outlet: true } },
          modifierGroups: { include: { items: true } },
        },
      });
    });
  }

  async findAll(query: QueryProductDto) {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      brandId,
      unitId,
      productType,
      isForSale,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PosProductWhereInput = {
      ...(categoryId && { categoryId }),
      ...(brandId && { brandId }),
      ...(unitId && { unitId }),
      ...(productType && { productType }),
      ...(isForSale && { isForSale }),
      ...(isActive && { isActive }),
      ...(search && {
        OR: [
          { productCode: { contains: search, mode: 'insensitive' } },
          { productName: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.posProduct.count({ where }),
      this.prisma.posProduct.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: { select: { categoryId: true, categoryCode: true, categoryName: true } },
          brand: { select: { brandId: true, brandCode: true, brandName: true } },
          unit: { select: { unitId: true, unitCode: true, unitName: true } },
          tax: { select: { taxId: true, taxCode: true, taxName: true, rate: true } },
          stocks: {
            select: {
              warehouseId: true,
              quantity: true,
              variantId: true,
              warehouse: {
                select: { outletId: true, isDefault: true },
              },
            },
          },
          variants: {
            where: { isActive: 'Y' },
            select: {
              variantId: true,
              variantCode: true,
              variantName: true,
              sellingPrice: true,
              costPrice: true,
              sku: true,
              barcode: true,
            },
          },
          _count: {
            select: {
              variants: true,
              outletPrices: true,
              modifierGroups: true,
              recipesAsProduct: true,
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
    const product = await this.prisma.posProduct.findUnique({
      where: { productId: id },
      include: {
        category: true,
        brand: true,
        unit: true,
        tax: true,
        variants: true,
        outletPrices: {
          include: {
            outlet: {
              select: { outletId: true, outletCode: true, outletName: true },
            },
            variant: {
              select: { variantId: true, variantCode: true, variantName: true },
            },
          },
        },
        modifierGroups: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Produk dengan ID "${id}" tidak ditemukan`);
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto, username?: string) {
    await this.findOne(id);

    if (dto.productCode) {
      const existing = await this.prisma.posProduct.findUnique({
        where: { productCode: dto.productCode },
      });
      if (existing && existing.productId !== id) {
        throw new BadRequestException(`Kode produk "${dto.productCode}" sudah digunakan produk lain`);
      }
    }

    if (dto.sku) {
      const existingSku = await this.prisma.posProduct.findUnique({
        where: { sku: dto.sku },
      });
      if (existingSku && existingSku.productId !== id) {
        throw new BadRequestException(`SKU "${dto.sku}" sudah digunakan produk lain`);
      }
    }

    const { variants, outletPrices, modifierGroups, ...baseData } = dto;

    return this.prisma.posProduct.update({
      where: { productId: id },
      data: {
        ...baseData,
        ...(baseData.costPrice !== undefined && { costPrice: new Prisma.Decimal(baseData.costPrice) }),
        ...(baseData.sellingPrice !== undefined && { sellingPrice: new Prisma.Decimal(baseData.sellingPrice) }),
        ...(baseData.minStock !== undefined && { minStock: new Prisma.Decimal(baseData.minStock) }),
        ...(baseData.maxStock !== undefined && { maxStock: new Prisma.Decimal(baseData.maxStock) }),
        updatedBy: username || 'SYSTEM',
      },
      include: {
        category: true,
        brand: true,
        unit: true,
        tax: true,
        variants: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.posProduct.update({
      where: { productId: id },
      data: { isActive: 'N' },
    });
  }

  // Variant Management
  async addVariant(productId: string, dto: CreateProductVariantDto, username?: string) {
    await this.findOne(productId);
    const existing = await this.prisma.posProductVariant.findUnique({
      where: { variantCode: dto.variantCode },
    });
    if (existing) {
      throw new BadRequestException(`Kode varian "${dto.variantCode}" sudah digunakan`);
    }

    return this.prisma.posProductVariant.create({
      data: {
        productId,
        variantCode: dto.variantCode,
        variantName: dto.variantName,
        sku: dto.sku,
        barcode: dto.barcode,
        costPrice: new Prisma.Decimal(dto.costPrice ?? 0),
        sellingPrice: new Prisma.Decimal(dto.sellingPrice ?? 0),
        isActive: dto.isActive || 'Y',
        objectCode: 'PRODUCT_VARIANT',
        createdBy: username || 'SYSTEM',
        updatedBy: username || 'SYSTEM',
      },
    });
  }

  async removeVariant(variantId: string) {
    const variant = await this.prisma.posProductVariant.findUnique({
      where: { variantId },
    });
    if (!variant) {
      throw new NotFoundException(`Varian dengan ID "${variantId}" tidak ditemukan`);
    }
    return this.prisma.posProductVariant.delete({
      where: { variantId },
    });
  }

  // Outlet Price Override
  async setOutletPrice(productId: string, dto: CreateProductOutletPriceDto, username?: string) {
    await this.findOne(productId);

    return this.prisma.posProductOutletPrice.upsert({
      where: {
        productId_variantId_outletId: {
          productId,
          variantId: dto.variantId || (null as any),
          outletId: dto.outletId,
        },
      },
      update: {
        sellingPrice: new Prisma.Decimal(dto.sellingPrice),
        updatedBy: username || 'SYSTEM',
      },
      create: {
        productId,
        outletId: dto.outletId,
        variantId: dto.variantId,
        sellingPrice: new Prisma.Decimal(dto.sellingPrice),
        objectCode: 'PRODUCT_PRICE',
        createdBy: username || 'SYSTEM',
        updatedBy: username || 'SYSTEM',
      },
    });
  }

  async removeOutletPrice(priceId: string) {
    return this.prisma.posProductOutletPrice.delete({
      where: { priceId },
    });
  }

  // Modifier Groups & Items
  async addModifierGroup(productId: string, dto: CreateModifierGroupDto, username?: string) {
    await this.findOne(productId);

    return this.prisma.posProductModifierGroup.create({
      data: {
        productId,
        groupName: dto.groupName,
        minSelect: dto.minSelect ?? 0,
        maxSelect: dto.maxSelect ?? 1,
        isRequired: dto.isRequired || 'N',
        objectCode: 'MODIFIER_GROUP',
        createdBy: username || 'SYSTEM',
        updatedBy: username || 'SYSTEM',
        ...(dto.items && {
          items: {
            create: dto.items.map((i) => ({
              itemName: i.itemName,
              extraPrice: new Prisma.Decimal(i.extraPrice ?? 0),
              objectCode: 'MODIFIER_ITEM',
              createdBy: username || 'SYSTEM',
              updatedBy: username || 'SYSTEM',
            })),
          },
        }),
      },
      include: { items: true },
    });
  }

  async removeModifierGroup(groupId: string) {
    return this.prisma.posProductModifierGroup.delete({
      where: { modifierGroupId: groupId },
    });
  }

  async addModifierItem(groupId: string, dto: CreateModifierItemDto, username?: string) {
    const group = await this.prisma.posProductModifierGroup.findUnique({
      where: { modifierGroupId: groupId },
    });
    if (!group) {
      throw new NotFoundException(`Grup modifier dengan ID "${groupId}" tidak ditemukan`);
    }

    return this.prisma.posProductModifierItem.create({
      data: {
        modifierGroupId: groupId,
        itemName: dto.itemName,
        extraPrice: new Prisma.Decimal(dto.extraPrice ?? 0),
        objectCode: 'MODIFIER_ITEM',
        createdBy: username || 'SYSTEM',
        updatedBy: username || 'SYSTEM',
      },
    });
  }

  async removeModifierItem(itemId: string) {
    return this.prisma.posProductModifierItem.delete({
      where: { modifierItemId: itemId },
    });
  }
}
