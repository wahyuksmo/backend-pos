import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateUnitConversionDto } from './dto/create-unit-conversion.dto';
import { UpdateUnitConversionDto } from './dto/update-unit-conversion.dto';
import { QueryUnitConversionDto } from './dto/query-unit-conversion.dto';

@Injectable()
export class UnitConversionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUnitConversionDto, username?: string) {
    if (dto.fromUnitId === dto.toUnitId) {
      throw new BadRequestException('Satuan asal dan satuan tujuan tidak boleh sama');
    }

    const existing = await this.prisma.posUnitConversion.findUnique({
      where: {
        fromUnitId_toUnitId: {
          fromUnitId: dto.fromUnitId,
          toUnitId: dto.toUnitId,
        },
      },
    });
    if (existing) {
      throw new BadRequestException('Konversi antar kedua satuan ini sudah terdaftar');
    }

    return this.prisma.posUnitConversion.create({
      data: {
        ...dto,
        multiplier: new Prisma.Decimal(dto.multiplier),
        objectCode: 'UNIT_CONVERSION',
        createdBy: username || 'SYSTEM',
        updatedBy: username || 'SYSTEM',
      },
      include: {
        fromUnit: { select: { unitId: true, unitCode: true, unitName: true } },
        toUnit: { select: { unitId: true, unitCode: true, unitName: true } },
      },
    });
  }

  async findAll(query: QueryUnitConversionDto) {
    const { page = 1, limit = 10, fromUnitId, toUnitId, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PosUnitConversionWhereInput = {
      ...(isActive && { isActive }),
      ...(fromUnitId && { fromUnitId }),
      ...(toUnitId && { toUnitId }),
    };

    const [total, data] = await Promise.all([
      this.prisma.posUnitConversion.count({ where }),
      this.prisma.posUnitConversion.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          fromUnit: { select: { unitId: true, unitCode: true, unitName: true } },
          toUnit: { select: { unitId: true, unitCode: true, unitName: true } },
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
    const item = await this.prisma.posUnitConversion.findUnique({
      where: { conversionId: id },
      include: {
        fromUnit: { select: { unitId: true, unitCode: true, unitName: true } },
        toUnit: { select: { unitId: true, unitCode: true, unitName: true } },
      },
    });
    if (!item) {
      throw new NotFoundException(`Konversi satuan dengan ID "${id}" tidak ditemukan`);
    }
    return item;
  }

  async update(id: string, dto: UpdateUnitConversionDto, username?: string) {
    await this.findOne(id);

    return this.prisma.posUnitConversion.update({
      where: { conversionId: id },
      data: {
        ...dto,
        ...(dto.multiplier !== undefined && { multiplier: new Prisma.Decimal(dto.multiplier) }),
        updatedBy: username || 'SYSTEM',
      },
      include: {
        fromUnit: { select: { unitId: true, unitCode: true, unitName: true } },
        toUnit: { select: { unitId: true, unitCode: true, unitName: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.posUnitConversion.delete({
      where: { conversionId: id },
    });
  }
}
