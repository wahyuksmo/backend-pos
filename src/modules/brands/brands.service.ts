import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { QueryBrandDto } from './dto/query-brand.dto';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBrandDto, username?: string) {
    const existing = await this.prisma.posBrand.findUnique({
      where: { brandCode: dto.brandCode },
    });
    if (existing) {
      throw new BadRequestException(`Kode merek "${dto.brandCode}" sudah digunakan`);
    }

    return this.prisma.posBrand.create({
      data: {
        ...dto,
        objectCode: 'BRAND',
        createdBy: username || 'SYSTEM',
        updatedBy: username || 'SYSTEM',
      },
    });
  }

  async findAll(query: QueryBrandDto) {
    const { page = 1, limit = 10, search, isActive, sortBy = 'brandName', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PosBrandWhereInput = {
      ...(isActive && { isActive }),
      ...(search && {
        OR: [
          { brandCode: { contains: search, mode: 'insensitive' } },
          { brandName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.posBrand.count({ where }),
      this.prisma.posBrand.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { products: true },
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
    const brand = await this.prisma.posBrand.findUnique({
      where: { brandId: id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    if (!brand) {
      throw new NotFoundException(`Merek dengan ID "${id}" tidak ditemukan`);
    }
    return brand;
  }

  async update(id: string, dto: UpdateBrandDto, username?: string) {
    await this.findOne(id);

    if (dto.brandCode) {
      const existing = await this.prisma.posBrand.findUnique({
        where: { brandCode: dto.brandCode },
      });
      if (existing && existing.brandId !== id) {
        throw new BadRequestException(`Kode merek "${dto.brandCode}" sudah digunakan merek lain`);
      }
    }

    return this.prisma.posBrand.update({
      where: { brandId: id },
      data: {
        ...dto,
        updatedBy: username || 'SYSTEM',
      },
    });
  }

  async remove(id: string) {
    const brand = await this.findOne(id);
    if (brand._count && brand._count.products > 0) {
      return this.prisma.posBrand.update({
        where: { brandId: id },
        data: { isActive: 'N' },
      });
    }

    return this.prisma.posBrand.delete({
      where: { brandId: id },
    });
  }
}
