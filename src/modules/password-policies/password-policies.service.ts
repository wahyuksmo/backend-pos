import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { UpdatePasswordPolicyDto } from './dto/update-password-policy.dto';
import { QueryPasswordPolicyDto } from './dto/query-password-policy.dto';

@Injectable()
export class PasswordPoliciesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryPasswordPolicyDto) {
    const {
      page = 1,
      limit = 10,
      search,
      code,
      sortBy = 'createdAt',
      sortOrder = 'asc',
    } = query;
    const skip = ((page || 1) - 1) * (limit || 10);
    const take = limit || 10;

    const where: Prisma.PasswordPolicyWhereInput = {
      ...(code && { code: { contains: code, mode: 'insensitive' } }),
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { message: { contains: search, mode: 'insensitive' } },
          { value: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, policies] = await Promise.all([
      this.prisma.passwordPolicy.count({ where }),
      this.prisma.passwordPolicy.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    const totalPages = Math.ceil(total / take);

    return {
      message: 'Password policies retrieved successfully',
      data: policies,
      meta: {
        total,
        page,
        limit: take,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const policy = await this.prisma.passwordPolicy.findUnique({
      where: { passwordPolicyId: id },
    });

    if (!policy) {
      throw new NotFoundException(`Password policy with ID "${id}" not found`);
    }

    return {
      message: 'Password policy retrieved successfully',
      data: policy,
    };
  }

  async update(id: string, dto: UpdatePasswordPolicyDto, updatedBy?: string) {
    const existing = await this.prisma.passwordPolicy.findUnique({
      where: { passwordPolicyId: id },
    });

    if (!existing) {
      throw new NotFoundException(`Password policy with ID "${id}" not found`);
    }

    const updated = await this.prisma.passwordPolicy.update({
      where: { passwordPolicyId: id },
      data: {
        value: dto.value,
        ...(dto.message && { message: dto.message }),
        updatedBy: updatedBy || 'SYSTEM',
      },
    });

    return {
      message: `Password policy "${existing.code}" updated successfully`,
      data: updated,
    };
  }
}
