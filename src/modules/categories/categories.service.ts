import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto, username?: string) {
    if (dto.parentCategoryId) {
      const parent = await this.prisma.posCategory.findUnique({
        where: { categoryId: dto.parentCategoryId },
      });
      if (!parent) {
        throw new BadRequestException(`Kategori induk dengan ID "${dto.parentCategoryId}" tidak ditemukan`);
      }
    }

    const existing = await this.prisma.posCategory.findUnique({
      where: { categoryCode: dto.categoryCode },
    });
    if (existing) {
      throw new BadRequestException(`Kode kategori "${dto.categoryCode}" sudah digunakan`);
    }

    return this.prisma.posCategory.create({
      data: {
        ...dto,
        objectCode: 'CATEGORY',
        createdBy: username || 'SYSTEM',
        updatedBy: username || 'SYSTEM',
      },
      include: {
        parentCategory: {
          select: {
            categoryId: true,
            categoryCode: true,
            categoryName: true,
          },
        },
      },
    });
  }

  async findAll(query: QueryCategoryDto) {
    const { page = 1, limit = 10, search, parentCategoryId, isActive, sortBy = 'displayOrder', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PosCategoryWhereInput = {
      ...(parentCategoryId && { parentCategoryId }),
      ...(isActive && { isActive }),
      ...(search && {
        OR: [
          { categoryCode: { contains: search, mode: 'insensitive' } },
          { categoryName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.posCategory.count({ where }),
      this.prisma.posCategory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          parentCategory: {
            select: {
              categoryId: true,
              categoryCode: true,
              categoryName: true,
            },
          },
          _count: {
            select: {
              products: true,
              childCategories: true,
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
    const category = await this.prisma.posCategory.findUnique({
      where: { categoryId: id },
      include: {
        parentCategory: true,
        childCategories: true,
        _count: {
          select: { products: true },
        },
      },
    });
    if (!category) {
      throw new NotFoundException(`Kategori dengan ID "${id}" tidak ditemukan`);
    }
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto, username?: string) {
    await this.findOne(id);

    if (dto.parentCategoryId) {
      if (dto.parentCategoryId === id) {
        throw new BadRequestException('Kategori tidak dapat menjadi induk untuk dirinya sendiri');
      }
      const parent = await this.prisma.posCategory.findUnique({
        where: { categoryId: dto.parentCategoryId },
      });
      if (!parent) {
        throw new BadRequestException(`Kategori induk dengan ID "${dto.parentCategoryId}" tidak ditemukan`);
      }
    }

    if (dto.categoryCode) {
      const existing = await this.prisma.posCategory.findUnique({
        where: { categoryCode: dto.categoryCode },
      });
      if (existing && existing.categoryId !== id) {
        throw new BadRequestException(`Kode kategori "${dto.categoryCode}" sudah digunakan kategori lain`);
      }
    }

    return this.prisma.posCategory.update({
      where: { categoryId: id },
      data: {
        ...dto,
        updatedBy: username || 'SYSTEM',
      },
      include: {
        parentCategory: {
          select: {
            categoryId: true,
            categoryCode: true,
            categoryName: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const category = await this.findOne(id);
    const hasChildren = category.childCategories && category.childCategories.length > 0;
    const hasProducts = category._count && category._count.products > 0;

    if (hasChildren || hasProducts) {
      return this.prisma.posCategory.update({
        where: { categoryId: id },
        data: { isActive: 'N' },
      });
    }

    return this.prisma.posCategory.delete({
      where: { categoryId: id },
    });
  }
}
