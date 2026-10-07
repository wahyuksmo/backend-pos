import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateRegisterDto } from './dto/create-register.dto';
import { UpdateRegisterDto } from './dto/update-register.dto';
import { QueryRegisterDto } from './dto/query-register.dto';

@Injectable()
export class RegistersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRegisterDto, username?: string) {
    const outlet = await this.prisma.posOutlet.findUnique({
      where: { outletId: dto.outletId },
    });
    if (!outlet) {
      throw new BadRequestException(`Outlet dengan ID "${dto.outletId}" tidak ditemukan`);
    }

    const existing = await this.prisma.posRegister.findUnique({
      where: { registerCode: dto.registerCode },
    });
    if (existing) {
      throw new BadRequestException(`Kode register "${dto.registerCode}" sudah digunakan`);
    }

    return this.prisma.posRegister.create({
      data: {
        ...dto,
        objectCode: 'REGISTER',
        createdBy: username || 'SYSTEM',
        updatedBy: username || 'SYSTEM',
      },
      include: {
        outlet: {
          select: {
            outletId: true,
            outletCode: true,
            outletName: true,
          },
        },
      },
    });
  }

  async findAll(query: QueryRegisterDto) {
    const { page = 1, limit = 10, search, outletId, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PosRegisterWhereInput = {
      ...(outletId && { outletId }),
      ...(isActive && { isActive }),
      ...(search && {
        OR: [
          { registerCode: { contains: search, mode: 'insensitive' } },
          { registerName: { contains: search, mode: 'insensitive' } },
          { ipAddress: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.posRegister.count({ where }),
      this.prisma.posRegister.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          outlet: {
            select: {
              outletId: true,
              outletCode: true,
              outletName: true,
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
    const register = await this.prisma.posRegister.findUnique({
      where: { registerId: id },
      include: {
        outlet: {
          select: {
            outletId: true,
            outletCode: true,
            outletName: true,
          },
        },
      },
    });
    if (!register) {
      throw new NotFoundException(`Register dengan ID "${id}" tidak ditemukan`);
    }
    return register;
  }

  async update(id: string, dto: UpdateRegisterDto, username?: string) {
    await this.findOne(id);

    if (dto.outletId) {
      const outlet = await this.prisma.posOutlet.findUnique({
        where: { outletId: dto.outletId },
      });
      if (!outlet) {
        throw new BadRequestException(`Outlet dengan ID "${dto.outletId}" tidak ditemukan`);
      }
    }

    if (dto.registerCode) {
      const existing = await this.prisma.posRegister.findUnique({
        where: { registerCode: dto.registerCode },
      });
      if (existing && existing.registerId !== id) {
        throw new BadRequestException(`Kode register "${dto.registerCode}" sudah digunakan register lain`);
      }
    }

    return this.prisma.posRegister.update({
      where: { registerId: id },
      data: {
        ...dto,
        updatedBy: username || 'SYSTEM',
      },
      include: {
        outlet: {
          select: {
            outletId: true,
            outletCode: true,
            outletName: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.posRegister.delete({
      where: { registerId: id },
    });
  }
}
