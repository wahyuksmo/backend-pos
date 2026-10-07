import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateSurchargeDto } from './dto/create-surcharge.dto';
import { UpdateSurchargeDto } from './dto/update-surcharge.dto';
import { QuerySurchargeDto } from './dto/query-surcharge.dto';

@Injectable()
export class SurchargesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSurchargeDto, username?: string) {
    const existing = await this.prisma.posSurcharge.findUnique({
      where: { surchargeCode: dto.surchargeCode },
    });
    if (existing) {
      throw new BadRequestException(`Kode surcharge "${dto.surchargeCode}" sudah digunakan`);
    }

    return this.prisma.posSurcharge.create({
      data: {
        ...dto,
        rateValue: new Prisma.Decimal(dto.rateValue),
        objectCode: 'SURCHARGE',
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

  async findAll(query: QuerySurchargeDto) {
    const { page = 1, limit = 10, search, outletId, applicableOrderType, isActive, sortBy = 'surchargeCode', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PosSurchargeWhereInput = {
      ...(isActive && { isActive }),
      ...(outletId && { outletId }),
      ...(applicableOrderType && { applicableOrderType }),
      ...(search && {
        OR: [
          { surchargeCode: { contains: search, mode: 'insensitive' } },
          { surchargeName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.posSurcharge.count({ where }),
      this.prisma.posSurcharge.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          outlet: {
            select: { outletId: true, outletCode: true, outletName: true },
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
    const item = await this.prisma.posSurcharge.findUnique({
      where: { surchargeId: id },
      include: {
        outlet: {
          select: { outletId: true, outletCode: true, outletName: true },
        },
      },
    });
    if (!item) {
      throw new NotFoundException(`Surcharge dengan ID "${id}" tidak ditemukan`);
    }
    return item;
  }

  async update(id: string, dto: UpdateSurchargeDto, username?: string) {
    await this.findOne(id);

    return this.prisma.posSurcharge.update({
      where: { surchargeId: id },
      data: {
        ...dto,
        ...(dto.rateValue !== undefined && { rateValue: new Prisma.Decimal(dto.rateValue) }),
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
    return this.prisma.posSurcharge.delete({
      where: { surchargeId: id },
    });
  }
}
