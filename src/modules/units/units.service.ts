import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { QueryUnitDto } from './dto/query-unit.dto';

@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUnitDto, username?: string) {
    const existing = await this.prisma.posUnit.findUnique({
      where: { unitCode: dto.unitCode },
    });
    if (existing) {
      throw new BadRequestException(`Kode satuan "${dto.unitCode}" sudah digunakan`);
    }

    return this.prisma.posUnit.create({
      data: {
        ...dto,
        objectCode: 'UNIT',
        createdBy: username || 'SYSTEM',
        updatedBy: username || 'SYSTEM',
      },
    });
  }

  async findAll(query: QueryUnitDto) {
    const { page = 1, limit = 10, search, isActive, sortBy = 'unitCode', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PosUnitWhereInput = {
      ...(isActive && { isActive }),
      ...(search && {
        OR: [
          { unitCode: { contains: search, mode: 'insensitive' } },
          { unitName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.posUnit.count({ where }),
      this.prisma.posUnit.findMany({
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
    const unit = await this.prisma.posUnit.findUnique({
      where: { unitId: id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    if (!unit) {
      throw new NotFoundException(`Satuan dengan ID "${id}" tidak ditemukan`);
    }
    return unit;
  }

  async update(id: string, dto: UpdateUnitDto, username?: string) {
    await this.findOne(id);

    if (dto.unitCode) {
      const existing = await this.prisma.posUnit.findUnique({
        where: { unitCode: dto.unitCode },
      });
      if (existing && existing.unitId !== id) {
        throw new BadRequestException(`Kode satuan "${dto.unitCode}" sudah digunakan satuan lain`);
      }
    }

    return this.prisma.posUnit.update({
      where: { unitId: id },
      data: {
        ...dto,
        updatedBy: username || 'SYSTEM',
      },
    });
  }

  async remove(id: string) {
    const unit = await this.findOne(id);
    if (unit._count && unit._count.products > 0) {
      return this.prisma.posUnit.update({
        where: { unitId: id },
        data: { isActive: 'N' },
      });
    }

    return this.prisma.posUnit.delete({
      where: { unitId: id },
    });
  }
}
