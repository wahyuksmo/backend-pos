import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { QueryTaxDto } from './dto/query-tax.dto';

@Injectable()
export class TaxesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTaxDto, username?: string) {
    const existing = await this.prisma.posTax.findUnique({
      where: { taxCode: dto.taxCode },
    });
    if (existing) {
      throw new BadRequestException(`Kode pajak "${dto.taxCode}" sudah digunakan`);
    }

    return this.prisma.posTax.create({
      data: {
        ...dto,
        rate: new Prisma.Decimal(dto.rate),
        objectCode: 'TAX',
        createdBy: username || 'SYSTEM',
        updatedBy: username || 'SYSTEM',
      },
    });
  }

  async findAll(query: QueryTaxDto) {
    const { page = 1, limit = 10, search, isActive, sortBy = 'taxCode', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PosTaxWhereInput = {
      ...(isActive && { isActive }),
      ...(search && {
        OR: [
          { taxCode: { contains: search, mode: 'insensitive' } },
          { taxName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.posTax.count({ where }),
      this.prisma.posTax.findMany({
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
    const tax = await this.prisma.posTax.findUnique({
      where: { taxId: id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    if (!tax) {
      throw new NotFoundException(`Pajak dengan ID "${id}" tidak ditemukan`);
    }
    return tax;
  }

  async update(id: string, dto: UpdateTaxDto, username?: string) {
    await this.findOne(id);

    if (dto.taxCode) {
      const existing = await this.prisma.posTax.findUnique({
        where: { taxCode: dto.taxCode },
      });
      if (existing && existing.taxId !== id) {
        throw new BadRequestException(`Kode pajak "${dto.taxCode}" sudah digunakan pajak lain`);
      }
    }

    return this.prisma.posTax.update({
      where: { taxId: id },
      data: {
        ...dto,
        ...(dto.rate !== undefined && { rate: new Prisma.Decimal(dto.rate) }),
        updatedBy: username || 'SYSTEM',
      },
    });
  }

  async remove(id: string) {
    const tax = await this.findOne(id);
    if (tax._count && tax._count.products > 0) {
      return this.prisma.posTax.update({
        where: { taxId: id },
        data: { isActive: 'N' },
      });
    }

    return this.prisma.posTax.delete({
      where: { taxId: id },
    });
  }
}
