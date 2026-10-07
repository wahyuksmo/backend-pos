import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateKitchenStationDto } from './dto/create-kitchen-station.dto';
import { UpdateKitchenStationDto } from './dto/update-kitchen-station.dto';
import { QueryKitchenStationDto } from './dto/query-kitchen-station.dto';

@Injectable()
export class KitchenStationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateKitchenStationDto, username?: string) {
    const existing = await this.prisma.posKitchenStation.findUnique({
      where: {
        outletId_stationCode: {
          outletId: dto.outletId,
          stationCode: dto.stationCode,
        },
      },
    });
    if (existing) {
      throw new BadRequestException(`Kode station "${dto.stationCode}" sudah digunakan di outlet ini`);
    }

    return this.prisma.posKitchenStation.create({
      data: {
        ...dto,
        objectCode: 'KITCHEN_STATION',
        createdBy: username || 'SYSTEM',
        updatedBy: username || 'SYSTEM',
      },
      include: {
        outlet: {
          select: { outletId: true, outletCode: true, outletName: true },
        },
      },
    });
  }

  async findAll(query: QueryKitchenStationDto) {
    const { page = 1, limit = 10, search, outletId, isActive, sortBy = 'stationCode', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PosKitchenStationWhereInput = {
      ...(isActive && { isActive }),
      ...(outletId && { outletId }),
      ...(search && {
        OR: [
          { stationCode: { contains: search, mode: 'insensitive' } },
          { stationName: { contains: search, mode: 'insensitive' } },
          { printerIp: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.posKitchenStation.count({ where }),
      this.prisma.posKitchenStation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          outlet: {
            select: { outletId: true, outletCode: true, outletName: true },
          },
          _count: {
            select: { products: true, categories: true },
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
    const item = await this.prisma.posKitchenStation.findUnique({
      where: { stationId: id },
      include: {
        outlet: {
          select: { outletId: true, outletCode: true, outletName: true },
        },
      },
    });
    if (!item) {
      throw new NotFoundException(`Kitchen station dengan ID "${id}" tidak ditemukan`);
    }
    return item;
  }

  async update(id: string, dto: UpdateKitchenStationDto, username?: string) {
    await this.findOne(id);

    return this.prisma.posKitchenStation.update({
      where: { stationId: id },
      data: {
        ...dto,
        updatedBy: username || 'SYSTEM',
      },
      include: {
        outlet: {
          select: { outletId: true, outletCode: true, outletName: true },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.posKitchenStation.delete({
      where: { stationId: id },
    });
  }
}
