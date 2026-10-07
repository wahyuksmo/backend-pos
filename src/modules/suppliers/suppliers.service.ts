import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { QuerySupplierDto } from './dto/query-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSupplierDto, username?: string) {
    const existing = await this.prisma.posSupplier.findUnique({
      where: { supplierCode: dto.supplierCode },
    });
    if (existing) {
      throw new BadRequestException(`Kode supplier "${dto.supplierCode}" sudah digunakan`);
    }

    return this.prisma.posSupplier.create({
      data: {
        ...dto,
        objectCode: 'SUPPLIER',
        createdBy: username || 'SYSTEM',
        updatedBy: username || 'SYSTEM',
      },
    });
  }

  async findAll(query: QuerySupplierDto) {
    const { page = 1, limit = 10, search, isActive, sortBy = 'supplierName', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PosSupplierWhereInput = {
      ...(isActive && { isActive }),
      ...(search && {
        OR: [
          { supplierCode: { contains: search, mode: 'insensitive' } },
          { supplierName: { contains: search, mode: 'insensitive' } },
          { contactPerson: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.posSupplier.count({ where }),
      this.prisma.posSupplier.findMany({
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
    const supplier = await this.prisma.posSupplier.findUnique({
      where: { supplierId: id },
    });
    if (!supplier) {
      throw new NotFoundException(`Supplier dengan ID "${id}" tidak ditemukan`);
    }
    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto, username?: string) {
    await this.findOne(id);

    if (dto.supplierCode) {
      const existing = await this.prisma.posSupplier.findUnique({
        where: { supplierCode: dto.supplierCode },
      });
      if (existing && existing.supplierId !== id) {
        throw new BadRequestException(`Kode supplier "${dto.supplierCode}" sudah digunakan supplier lain`);
      }
    }

    return this.prisma.posSupplier.update({
      where: { supplierId: id },
      data: {
        ...dto,
        updatedBy: username || 'SYSTEM',
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.posSupplier.update({
      where: { supplierId: id },
      data: { isActive: 'N' },
    });
  }
}
