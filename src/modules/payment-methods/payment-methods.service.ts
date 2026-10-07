import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { QueryPaymentMethodDto } from './dto/query-payment-method.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePaymentMethodDto, username?: string) {
    const existing = await this.prisma.posPaymentMethod.findUnique({
      where: { methodCode: dto.methodCode },
    });
    if (existing) {
      throw new BadRequestException(`Kode metode bayar "${dto.methodCode}" sudah digunakan`);
    }

    return this.prisma.posPaymentMethod.create({
      data: {
        ...dto,
        feeValue: new Prisma.Decimal(dto.feeValue ?? 0),
        objectCode: 'PAYMENT_METHOD',
        createdBy: username || 'SYSTEM',
        updatedBy: username || 'SYSTEM',
      },
    });
  }

  async findAll(query: QueryPaymentMethodDto) {
    const { page = 1, limit = 10, search, methodType, isActive, sortBy = 'displayOrder', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PosPaymentMethodWhereInput = {
      ...(methodType && { methodType }),
      ...(isActive && { isActive }),
      ...(search && {
        OR: [
          { methodCode: { contains: search, mode: 'insensitive' } },
          { methodName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.posPaymentMethod.count({ where }),
      this.prisma.posPaymentMethod.findMany({
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
    const method = await this.prisma.posPaymentMethod.findUnique({
      where: { paymentMethodId: id },
    });
    if (!method) {
      throw new NotFoundException(`Metode pembayaran dengan ID "${id}" tidak ditemukan`);
    }
    return method;
  }

  async update(id: string, dto: UpdatePaymentMethodDto, username?: string) {
    await this.findOne(id);

    if (dto.methodCode) {
      const existing = await this.prisma.posPaymentMethod.findUnique({
        where: { methodCode: dto.methodCode },
      });
      if (existing && existing.paymentMethodId !== id) {
        throw new BadRequestException(`Kode metode bayar "${dto.methodCode}" sudah digunakan metode lain`);
      }
    }

    return this.prisma.posPaymentMethod.update({
      where: { paymentMethodId: id },
      data: {
        ...dto,
        ...(dto.feeValue !== undefined && { feeValue: new Prisma.Decimal(dto.feeValue) }),
        updatedBy: username || 'SYSTEM',
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.posPaymentMethod.update({
      where: { paymentMethodId: id },
      data: { isActive: 'N' },
    });
  }
}
