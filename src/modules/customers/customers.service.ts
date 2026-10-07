import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustomerDto, username?: string) {
    if (dto.customerGroupId) {
      const group = await this.prisma.posCustomerGroup.findUnique({
        where: { customerGroupId: dto.customerGroupId },
      });
      if (!group) {
        throw new BadRequestException(`Grup pelanggan dengan ID "${dto.customerGroupId}" tidak ditemukan`);
      }
    }

    const existing = await this.prisma.posCustomer.findUnique({
      where: { customerCode: dto.customerCode },
    });
    if (existing) {
      throw new BadRequestException(`Kode pelanggan "${dto.customerCode}" sudah digunakan`);
    }

    return this.prisma.posCustomer.create({
      data: {
        ...dto,
        loyaltyPoints: new Prisma.Decimal(dto.loyaltyPoints ?? 0),
        creditLimit: new Prisma.Decimal(dto.creditLimit ?? 0),
        objectCode: 'CUSTOMER',
        createdBy: username || 'SYSTEM',
        updatedBy: username || 'SYSTEM',
      },
      include: {
        customerGroup: {
          select: {
            customerGroupId: true,
            groupCode: true,
            groupName: true,
            discountPercent: true,
          },
        },
      },
    });
  }

  async findAll(query: QueryCustomerDto) {
    const { page = 1, limit = 10, search, customerGroupId, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PosCustomerWhereInput = {
      ...(customerGroupId && { customerGroupId }),
      ...(isActive && { isActive }),
      ...(search && {
        OR: [
          { customerCode: { contains: search, mode: 'insensitive' } },
          { customerName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.posCustomer.count({ where }),
      this.prisma.posCustomer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customerGroup: {
            select: {
              customerGroupId: true,
              groupCode: true,
              groupName: true,
              discountPercent: true,
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
    const customer = await this.prisma.posCustomer.findUnique({
      where: { customerId: id },
      include: {
        customerGroup: true,
      },
    });
    if (!customer) {
      throw new NotFoundException(`Pelanggan dengan ID "${id}" tidak ditemukan`);
    }
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto, username?: string) {
    await this.findOne(id);

    if (dto.customerGroupId) {
      const group = await this.prisma.posCustomerGroup.findUnique({
        where: { customerGroupId: dto.customerGroupId },
      });
      if (!group) {
        throw new BadRequestException(`Grup pelanggan dengan ID "${dto.customerGroupId}" tidak ditemukan`);
      }
    }

    if (dto.customerCode) {
      const existing = await this.prisma.posCustomer.findUnique({
        where: { customerCode: dto.customerCode },
      });
      if (existing && existing.customerId !== id) {
        throw new BadRequestException(`Kode pelanggan "${dto.customerCode}" sudah digunakan pelanggan lain`);
      }
    }

    return this.prisma.posCustomer.update({
      where: { customerId: id },
      data: {
        ...dto,
        ...(dto.loyaltyPoints !== undefined && { loyaltyPoints: new Prisma.Decimal(dto.loyaltyPoints) }),
        ...(dto.creditLimit !== undefined && { creditLimit: new Prisma.Decimal(dto.creditLimit) }),
        updatedBy: username || 'SYSTEM',
      },
      include: {
        customerGroup: {
          select: {
            customerGroupId: true,
            groupCode: true,
            groupName: true,
            discountPercent: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.posCustomer.update({
      where: { customerId: id },
      data: { isActive: 'N' },
    });
  }
}
