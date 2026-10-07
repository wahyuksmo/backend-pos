import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateSalesChannelDto } from './dto/create-sales-channel.dto';
import { UpdateSalesChannelDto } from './dto/update-sales-channel.dto';
import { QuerySalesChannelDto } from './dto/query-sales-channel.dto';

@Injectable()
export class SalesChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSalesChannelDto, username?: string) {
    const existing = await this.prisma.posSalesChannel.findUnique({
      where: { channelCode: dto.channelCode },
    });
    if (existing) {
      throw new BadRequestException(`Kode channel "${dto.channelCode}" sudah digunakan`);
    }

    return this.prisma.posSalesChannel.create({
      data: {
        ...dto,
        ...(dto.priceMarkupPercent !== undefined && { priceMarkupPercent: new Prisma.Decimal(dto.priceMarkupPercent) }),
        ...(dto.platformCommissionPercent !== undefined && { platformCommissionPercent: new Prisma.Decimal(dto.platformCommissionPercent) }),
        objectCode: 'SALES_CHANNEL',
        createdBy: username || 'SYSTEM',
        updatedBy: username || 'SYSTEM',
      },
    });
  }

  async findAll(query: QuerySalesChannelDto) {
    const { page = 1, limit = 10, search, orderType, isActive, sortBy = 'channelCode', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PosSalesChannelWhereInput = {
      ...(isActive && { isActive }),
      ...(orderType && { orderType }),
      ...(search && {
        OR: [
          { channelCode: { contains: search, mode: 'insensitive' } },
          { channelName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.posSalesChannel.count({ where }),
      this.prisma.posSalesChannel.findMany({
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
    const item = await this.prisma.posSalesChannel.findUnique({
      where: { channelId: id },
    });
    if (!item) {
      throw new NotFoundException(`Sales channel dengan ID "${id}" tidak ditemukan`);
    }
    return item;
  }

  async update(id: string, dto: UpdateSalesChannelDto, username?: string) {
    await this.findOne(id);

    return this.prisma.posSalesChannel.update({
      where: { channelId: id },
      data: {
        ...dto,
        ...(dto.priceMarkupPercent !== undefined && { priceMarkupPercent: new Prisma.Decimal(dto.priceMarkupPercent) }),
        ...(dto.platformCommissionPercent !== undefined && { platformCommissionPercent: new Prisma.Decimal(dto.platformCommissionPercent) }),
        updatedBy: username || 'SYSTEM',
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.posSalesChannel.delete({
      where: { channelId: id },
    });
  }
}
