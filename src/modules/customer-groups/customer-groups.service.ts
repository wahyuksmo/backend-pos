import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateCustomerGroupDto } from './dto/create-customer-group.dto';
import { UpdateCustomerGroupDto } from './dto/update-customer-group.dto';
import { QueryCustomerGroupDto } from './dto/query-customer-group.dto';

@Injectable()
export class CustomerGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustomerGroupDto, username?: string) {
    const existing = await this.prisma.posCustomerGroup.findUnique({
      where: { groupCode: dto.groupCode },
    });
    if (existing) {
      throw new BadRequestException(`Kode grup pelanggan "${dto.groupCode}" sudah digunakan`);
    }

    return this.prisma.posCustomerGroup.create({
      data: {
        ...dto,
        discountPercent: new Prisma.Decimal(dto.discountPercent ?? 0),
        objectCode: 'CUSTOMER_GROUP',
        createdBy: username || 'SYSTEM',
        updatedBy: username || 'SYSTEM',
      },
    });
  }

  async findAll(query: QueryCustomerGroupDto) {
    const { page = 1, limit = 10, search, isActive, sortBy = 'groupCode', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PosCustomerGroupWhereInput = {
      ...(isActive && { isActive }),
      ...(search && {
        OR: [
          { groupCode: { contains: search, mode: 'insensitive' } },
          { groupName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.posCustomerGroup.count({ where }),
      this.prisma.posCustomerGroup.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { customers: true },
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
    const group = await this.prisma.posCustomerGroup.findUnique({
      where: { customerGroupId: id },
      include: {
        _count: {
          select: { customers: true },
        },
      },
    });
    if (!group) {
      throw new NotFoundException(`Grup pelanggan dengan ID "${id}" tidak ditemukan`);
    }
    return group;
  }

  async update(id: string, dto: UpdateCustomerGroupDto, username?: string) {
    await this.findOne(id);

    if (dto.groupCode) {
      const existing = await this.prisma.posCustomerGroup.findUnique({
        where: { groupCode: dto.groupCode },
      });
      if (existing && existing.customerGroupId !== id) {
        throw new BadRequestException(`Kode grup pelanggan "${dto.groupCode}" sudah digunakan grup lain`);
      }
    }

    return this.prisma.posCustomerGroup.update({
      where: { customerGroupId: id },
      data: {
        ...dto,
        ...(dto.discountPercent !== undefined && { discountPercent: new Prisma.Decimal(dto.discountPercent) }),
        updatedBy: username || 'SYSTEM',
      },
    });
  }

  async remove(id: string) {
    const group = await this.findOne(id);
    if (group._count && group._count.customers > 0) {
      return this.prisma.posCustomerGroup.update({
        where: { customerGroupId: id },
        data: { isActive: 'N' },
      });
    }

    return this.prisma.posCustomerGroup.delete({
      where: { customerGroupId: id },
    });
  }
}
