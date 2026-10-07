import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';
import { QueryOutletDto } from './dto/query-outlet.dto';

@Injectable()
export class OutletsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOutletDto, username?: string) {
    const existing = await this.prisma.posOutlet.findUnique({
      where: { outletCode: dto.outletCode },
    });
    if (existing) {
      throw new BadRequestException(`Kode outlet "${dto.outletCode}" sudah digunakan`);
    }

    return this.prisma.posOutlet.create({
      data: {
        ...dto,
        objectCode: 'OUTLET',
        createdBy: username || 'SYSTEM',
        updatedBy: username || 'SYSTEM',
      },
    });
  }

  async findAll(query: QueryOutletDto) {
    const { page = 1, limit = 10, search, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PosOutletWhereInput = {
      ...(isActive && { isActive }),
      ...(search && {
        OR: [
          { outletCode: { contains: search, mode: 'insensitive' } },
          { outletName: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.posOutlet.count({ where }),
      this.prisma.posOutlet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              registers: true,
              warehouses: true,
              diningTables: true,
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
    const outlet = await this.prisma.posOutlet.findUnique({
      where: { outletId: id },
      include: {
        registers: true,
        warehouses: true,
        diningTables: true,
      },
    });
    if (!outlet) {
      throw new NotFoundException(`Outlet dengan ID "${id}" tidak ditemukan`);
    }
    return outlet;
  }

  async update(id: string, dto: UpdateOutletDto, username?: string) {
    await this.findOne(id);

    if (dto.outletCode) {
      const existing = await this.prisma.posOutlet.findUnique({
        where: { outletCode: dto.outletCode },
      });
      if (existing && existing.outletId !== id) {
        throw new BadRequestException(`Kode outlet "${dto.outletCode}" sudah digunakan oleh outlet lain`);
      }
    }

    return this.prisma.posOutlet.update({
      where: { outletId: id },
      data: {
        ...dto,
        updatedBy: username || 'SYSTEM',
      },
    });
  }

  async remove(id: string) {
    const outlet = await this.findOne(id);
    const hasRelations =
      (outlet.registers && outlet.registers.length > 0) ||
      (outlet.warehouses && outlet.warehouses.length > 0) ||
      (outlet.diningTables && outlet.diningTables.length > 0);

    if (hasRelations) {
      return this.prisma.posOutlet.update({
        where: { outletId: id },
        data: { isActive: 'N' },
      });
    }

    return this.prisma.posOutlet.delete({
      where: { outletId: id },
    });
  }
}
