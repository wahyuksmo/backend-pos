import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { QueryRecipeDto } from './dto/query-recipe.dto';
import { BulkSaveRecipeDto } from './dto/bulk-save-recipe.dto';

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRecipeDto, username?: string) {
    if (dto.productId === dto.ingredientProductId) {
      throw new BadRequestException('Produk menu dan bahan baku tidak boleh produk yang sama');
    }

    return this.prisma.posProductRecipe.create({
      data: {
        ...dto,
        quantity: new Prisma.Decimal(dto.quantity),
        ...(dto.wastagePercent !== undefined && { wastagePercent: new Prisma.Decimal(dto.wastagePercent) }),
        ...(dto.costPrice !== undefined && { costPrice: new Prisma.Decimal(dto.costPrice) }),
        objectCode: 'RECIPE',
        createdBy: username || 'SYSTEM',
        updatedBy: username || 'SYSTEM',
      },
      include: {
        product: { select: { productId: true, productCode: true, productName: true } },
        variant: { select: { variantId: true, variantCode: true, variantName: true } },
        ingredientProduct: { select: { productId: true, productCode: true, productName: true } },
        unit: { select: { unitId: true, unitCode: true, unitName: true } },
      },
    });
  }

  async saveBulk(dto: BulkSaveRecipeDto, username?: string) {
    const invalidItem = dto.items.find((item) => item.ingredientProductId === dto.productId);
    if (invalidItem) {
      throw new BadRequestException('Produk menu dan bahan baku tidak boleh produk yang sama');
    }

    const targetVariantId = dto.variantId ? dto.variantId : null;

    return this.prisma.$transaction(async (tx) => {
      // Hapus bahan baku eksisting untuk produk & varian ini
      await tx.posProductRecipe.deleteMany({
        where: {
          productId: dto.productId,
          variantId: targetVariantId,
        },
      });

      // Insert seluruh bahan baku baru
      await tx.posProductRecipe.createMany({
        data: dto.items.map((item) => ({
          productId: dto.productId,
          variantId: targetVariantId,
          ingredientProductId: item.ingredientProductId,
          unitId: item.unitId,
          quantity: new Prisma.Decimal(item.quantity),
          wastagePercent: new Prisma.Decimal(item.wastagePercent || 0),
          costPrice: new Prisma.Decimal(item.costPrice || 0),
          isActive: item.isActive || 'Y',
          objectCode: 'RECIPE',
          createdBy: username || 'SYSTEM',
          updatedBy: username || 'SYSTEM',
        })),
      });

      // Kembalikan data lengkap setelah disimpan
      return tx.posProductRecipe.findMany({
        where: {
          productId: dto.productId,
          variantId: targetVariantId,
        },
        include: {
          product: { select: { productId: true, productCode: true, productName: true } },
          variant: { select: { variantId: true, variantCode: true, variantName: true } },
          ingredientProduct: { select: { productId: true, productCode: true, productName: true } },
          unit: { select: { unitId: true, unitCode: true, unitName: true } },
        },
        orderBy: { createdAt: 'asc' },
      });
    });
  }

  async findAll(query: QueryRecipeDto) {
    const { page = 1, limit = 10, productId, ingredientProductId, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PosProductRecipeWhereInput = {
      ...(isActive && { isActive }),
      ...(productId && { productId }),
      ...(ingredientProductId && { ingredientProductId }),
    };

    const [total, data] = await Promise.all([
      this.prisma.posProductRecipe.count({ where }),
      this.prisma.posProductRecipe.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          product: { select: { productId: true, productCode: true, productName: true } },
          variant: { select: { variantId: true, variantCode: true, variantName: true } },
          ingredientProduct: { select: { productId: true, productCode: true, productName: true } },
          unit: { select: { unitId: true, unitCode: true, unitName: true } },
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

  async findGrouped(query: QueryRecipeDto) {
    const { page = 1, limit = 10, productId, ingredientProductId, isActive } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PosProductRecipeWhereInput = {
      ...(isActive && { isActive }),
      ...(productId && { productId }),
      ...(ingredientProductId && { ingredientProductId }),
    };

    const recipes = await this.prisma.posProductRecipe.findMany({
      where,
      include: {
        product: { select: { productId: true, productCode: true, productName: true, sellingPrice: true, costPrice: true, categoryId: true, imageUrl: true } },
        variant: { select: { variantId: true, variantCode: true, variantName: true, sellingPrice: true } },
        ingredientProduct: { select: { productId: true, productCode: true, productName: true, costPrice: true, unitId: true } },
        unit: { select: { unitId: true, unitCode: true, unitName: true } },
      },
      orderBy: [{ productId: 'asc' }, { variantId: 'asc' }, { createdAt: 'asc' }],
    });

    const map = new Map<string, any>();
    for (const r of recipes) {
      const key = `${r.productId}_${r.variantId || 'global'}`;
      if (!map.has(key)) {
        map.set(key, {
          groupKey: key,
          productId: r.productId,
          product: r.product,
          variantId: r.variantId,
          variant: r.variant,
          isActive: r.isActive,
          items: [],
          totalItems: 0,
          totalEstimatedCost: 0,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        });
      }
      const group = map.get(key);
      group.items.push(r);
      group.totalItems += 1;
      const wastage = Number(r.wastagePercent || 0);
      const wastageFactor = 1 + wastage / 100;
      const itemCost = Number(r.costPrice || 0) * Number(r.quantity || 0) * wastageFactor;
      group.totalEstimatedCost += itemCost;
      if (new Date(r.updatedAt) > new Date(group.updatedAt)) {
        group.updatedAt = r.updatedAt;
      }
    }

    const allGroups = Array.from(map.values());
    const total = allGroups.length;
    const paginated = allGroups.slice(skip, skip + limit);

    return {
      data: paginated,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByProduct(productId: string, variantId?: string) {
    return this.prisma.posProductRecipe.findMany({
      where: {
        productId,
        variantId: variantId ? variantId : null,
      },
      include: {
        product: { select: { productId: true, productCode: true, productName: true } },
        variant: { select: { variantId: true, variantCode: true, variantName: true } },
        ingredientProduct: { select: { productId: true, productCode: true, productName: true, costPrice: true, unitId: true } },
        unit: { select: { unitId: true, unitCode: true, unitName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async deleteByProduct(productId: string, variantId?: string) {
    return this.prisma.posProductRecipe.deleteMany({
      where: {
        productId,
        variantId: variantId ? variantId : null,
      },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.posProductRecipe.findUnique({
      where: { recipeId: id },
      include: {
        product: { select: { productId: true, productCode: true, productName: true } },
        variant: { select: { variantId: true, variantCode: true, variantName: true } },
        ingredientProduct: { select: { productId: true, productCode: true, productName: true } },
        unit: { select: { unitId: true, unitCode: true, unitName: true } },
      },
    });
    if (!item) {
      throw new NotFoundException(`Resep dengan ID "${id}" tidak ditemukan`);
    }
    return item;
  }

  async update(id: string, dto: UpdateRecipeDto, username?: string) {
    await this.findOne(id);

    return this.prisma.posProductRecipe.update({
      where: { recipeId: id },
      data: {
        ...dto,
        ...(dto.quantity !== undefined && { quantity: new Prisma.Decimal(dto.quantity) }),
        ...(dto.wastagePercent !== undefined && { wastagePercent: new Prisma.Decimal(dto.wastagePercent) }),
        ...(dto.costPrice !== undefined && { costPrice: new Prisma.Decimal(dto.costPrice) }),
        updatedBy: username || 'SYSTEM',
      },
      include: {
        product: { select: { productId: true, productCode: true, productName: true } },
        variant: { select: { variantId: true, variantCode: true, variantName: true } },
        ingredientProduct: { select: { productId: true, productCode: true, productName: true } },
        unit: { select: { unitId: true, unitCode: true, unitName: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.posProductRecipe.delete({
      where: { recipeId: id },
    });
  }
}
