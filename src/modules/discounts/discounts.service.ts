import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { QueryDiscountDto } from './dto/query-discount.dto';

@Injectable()
export class DiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDiscountDto, username?: string) {
    const existing = await this.prisma.posDiscount.findUnique({
      where: { discountCode: dto.discountCode },
    });
    if (existing) {
      throw new BadRequestException(`Kode diskon "${dto.discountCode}" sudah digunakan`);
    }

    return this.prisma.posDiscount.create({
      data: {
        ...dto,
        discountValue: new Prisma.Decimal(dto.discountValue),
        minPurchase: new Prisma.Decimal(dto.minPurchase ?? 0),
        maxDiscount: dto.maxDiscount !== undefined ? new Prisma.Decimal(dto.maxDiscount) : null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        objectCode: 'DISCOUNT',
        createdBy: username || 'SYSTEM',
        updatedBy: username || 'SYSTEM',
      },
    });
  }

  async findAll(query: QueryDiscountDto) {
    const { page = 1, limit = 10, search, discountType, requiresApproval, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PosDiscountWhereInput = {
      ...(discountType && { discountType }),
      ...(requiresApproval && { requiresApproval }),
      ...(isActive && { isActive }),
      ...(search && {
        OR: [
          { discountCode: { contains: search, mode: 'insensitive' } },
          { discountName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.posDiscount.count({ where }),
      this.prisma.posDiscount.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
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
    const discount = await this.prisma.posDiscount.findUnique({
      where: { discountId: id },
    });
    if (!discount) {
      throw new NotFoundException(`Diskon dengan ID "${id}" tidak ditemukan`);
    }
    return discount;
  }

  async update(id: string, dto: UpdateDiscountDto, username?: string) {
    await this.findOne(id);

    if (dto.discountCode) {
      const existing = await this.prisma.posDiscount.findUnique({
        where: { discountCode: dto.discountCode },
      });
      if (existing && existing.discountId !== id) {
        throw new BadRequestException(`Kode diskon "${dto.discountCode}" sudah digunakan promo lain`);
      }
    }

    return this.prisma.posDiscount.update({
      where: { discountId: id },
      data: {
        ...dto,
        ...(dto.discountValue !== undefined && { discountValue: new Prisma.Decimal(dto.discountValue) }),
        ...(dto.minPurchase !== undefined && { minPurchase: new Prisma.Decimal(dto.minPurchase) }),
        ...(dto.maxDiscount !== undefined && { maxDiscount: dto.maxDiscount !== null ? new Prisma.Decimal(dto.maxDiscount) : null }),
        ...(dto.startDate !== undefined && { startDate: dto.startDate ? new Date(dto.startDate) : null }),
        ...(dto.endDate !== undefined && { endDate: dto.endDate ? new Date(dto.endDate) : null }),
        updatedBy: username || 'SYSTEM',
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.posDiscount.update({
      where: { discountId: id },
      data: { isActive: 'N' },
    });
  }
}
