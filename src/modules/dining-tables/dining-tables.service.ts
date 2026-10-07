import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateDiningTableDto } from './dto/create-dining-table.dto';
import { UpdateDiningTableDto } from './dto/update-dining-table.dto';
import { QueryDiningTableDto } from './dto/query-dining-table.dto';

@Injectable()
export class DiningTablesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDiningTableDto, username?: string) {
    const outlet = await this.prisma.posOutlet.findUnique({
      where: { outletId: dto.outletId },
    });
    if (!outlet) {
      throw new BadRequestException(`Outlet dengan ID "${dto.outletId}" tidak ditemukan`);
    }

    const existing = await this.prisma.posDiningTable.findUnique({
      where: {
        outletId_tableCode: {
          outletId: dto.outletId,
          tableCode: dto.tableCode,
        },
      },
    });
    if (existing) {
      throw new BadRequestException(`Meja dengan kode "${dto.tableCode}" sudah ada di outlet ini`);
    }

    return this.prisma.posDiningTable.create({
      data: {
        ...dto,
        objectCode: 'DINING_TABLE',
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

  async findAll(query: QueryDiningTableDto) {
    const { page = 1, limit = 10, search, outletId, section, status, isActive, sortBy = 'tableCode', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PosDiningTableWhereInput = {
      ...(outletId && { outletId }),
      ...(section && { section }),
      ...(status && { status }),
      ...(isActive && { isActive }),
      ...(search && {
        OR: [
          { tableCode: { contains: search, mode: 'insensitive' } },
          { tableName: { contains: search, mode: 'insensitive' } },
          { section: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.posDiningTable.count({ where }),
      this.prisma.posDiningTable.findMany({
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
    const table = await this.prisma.posDiningTable.findUnique({
      where: { tableId: id },
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
    if (!table) {
      throw new NotFoundException(`Meja dengan ID "${id}" tidak ditemukan`);
    }
    return table;
  }

  async update(id: string, dto: UpdateDiningTableDto, username?: string) {
    const current = await this.findOne(id);
    const targetOutletId = dto.outletId || current.outletId;
    const targetCode = dto.tableCode || current.tableCode;

    if (dto.outletId || dto.tableCode) {
      const existing = await this.prisma.posDiningTable.findUnique({
        where: {
          outletId_tableCode: {
            outletId: targetOutletId,
            tableCode: targetCode,
          },
        },
      });
      if (existing && existing.tableId !== id) {
        throw new BadRequestException(`Meja dengan kode "${targetCode}" sudah ada di outlet tersebut`);
      }
    }

    return this.prisma.posDiningTable.update({
      where: { tableId: id },
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
    return this.prisma.posDiningTable.delete({
      where: { tableId: id },
    });
  }
}
