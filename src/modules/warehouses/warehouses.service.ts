import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { QueryWarehouseDto } from './dto/query-warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWarehouseDto, username?: string) {
    if (dto.outletId) {
      const outlet = await this.prisma.posOutlet.findUnique({
        where: { outletId: dto.outletId },
      });
      if (!outlet) {
        throw new BadRequestException(`Outlet dengan ID "${dto.outletId}" tidak ditemukan`);
      }
    }

    const existing = await this.prisma.posWarehouse.findUnique({
      where: { warehouseCode: dto.warehouseCode },
    });
    if (existing) {
      throw new BadRequestException(`Kode gudang "${dto.warehouseCode}" sudah digunakan`);
    }

    return this.prisma.posWarehouse.create({
      data: {
        ...dto,
        objectCode: 'WAREHOUSE',
        createdBy: username || 'SYSTEM',
        updatedBy: username || 'SYSTEM',
      },
      include: {
        outlet: {
          select: {
            outletId: true,
            outletCode: true,
            outletName: true,
          },
        },
      },
    });
  }

  async findAll(query: QueryWarehouseDto) {
    const { page = 1, limit = 10, search, outletId, warehouseType, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PosWarehouseWhereInput = {
      ...(outletId && { outletId }),
      ...(warehouseType && { warehouseType }),
      ...(isActive && { isActive }),
      ...(search && {
        OR: [
          { warehouseCode: { contains: search, mode: 'insensitive' } },
          { warehouseName: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.posWarehouse.count({ where }),
      this.prisma.posWarehouse.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          outlet: {
            select: {
              outletId: true,
              outletCode: true,
              outletName: true,
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
    const warehouse = await this.prisma.posWarehouse.findUnique({
      where: { warehouseId: id },
      include: {
        outlet: {
          select: {
            outletId: true,
            outletCode: true,
            outletName: true,
          },
        },
      },
    });
    if (!warehouse) {
      throw new NotFoundException(`Gudang dengan ID "${id}" tidak ditemukan`);
    }
    return warehouse;
  }

  async update(id: string, dto: UpdateWarehouseDto, username?: string) {
    await this.findOne(id);

    if (dto.outletId) {
      const outlet = await this.prisma.posOutlet.findUnique({
        where: { outletId: dto.outletId },
      });
      if (!outlet) {
        throw new BadRequestException(`Outlet dengan ID "${dto.outletId}" tidak ditemukan`);
      }
    }

    if (dto.warehouseCode) {
      const existing = await this.prisma.posWarehouse.findUnique({
        where: { warehouseCode: dto.warehouseCode },
      });
      if (existing && existing.warehouseId !== id) {
        throw new BadRequestException(`Kode gudang "${dto.warehouseCode}" sudah digunakan gudang lain`);
      }
    }

    return this.prisma.posWarehouse.update({
      where: { warehouseId: id },
      data: {
        ...dto,
        updatedBy: username || 'SYSTEM',
      },
      include: {
        outlet: {
          select: {
            outletId: true,
            outletCode: true,
            outletName: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.posWarehouse.delete({
      where: { warehouseId: id },
    });
  }
}
