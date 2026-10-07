import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { QuerySettingDto } from './dto/query-setting.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSettingDto, createdBy?: string) {
    const existing = await this.prisma.setting.findUnique({
      where: { settingKey: dto.settingKey },
    });

    if (existing) {
      throw new ConflictException(`Setting with key "${dto.settingKey}" already exists`);
    }

    const setting = await this.prisma.setting.create({
      data: {
        settingKey: dto.settingKey,
        settingValue: dto.settingValue,
        valueType: dto.valueType || 'string',
        description: dto.description,
        objectCode: dto.objectCode || 'SETTING',
        createdBy: createdBy || 'SYSTEM',
      },
    });

    return {
      message: 'Setting created successfully',
      data: setting,
    };
  }

  async findAll(query: QuerySettingDto) {
    const {
      page = 1,
      limit = 10,
      search,
      settingKey,
      sortBy = 'createdAt',
      sortOrder = 'asc',
    } = query;
    const skip = ((page || 1) - 1) * (limit || 10);
    const take = limit || 10;

    const where: Prisma.SettingWhereInput = {
      ...(settingKey && { settingKey: { contains: settingKey, mode: 'insensitive' } }),
      ...(search && {
        OR: [
          { settingKey: { contains: search, mode: 'insensitive' } },
          { settingValue: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, settings] = await Promise.all([
      this.prisma.setting.count({ where }),
      this.prisma.setting.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    const totalPages = Math.ceil(total / take);

    return {
      message: 'Settings retrieved successfully',
      data: settings,
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
    const setting = await this.prisma.setting.findFirst({
      where: {
        OR: [{ settingId: id }, { settingKey: id }],
      },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with ID or Key "${id}" not found`);
    }

    return {
      message: 'Setting retrieved successfully',
      data: setting,
    };
  }

  async update(id: string, dto: UpdateSettingDto, updatedBy?: string) {
    const existing = await this.prisma.setting.findFirst({
      where: {
        OR: [{ settingId: id }, { settingKey: id }],
      },
    });

    if (!existing) {
      throw new NotFoundException(`Setting with ID or Key "${id}" not found`);
    }

    if (dto.settingKey && dto.settingKey !== existing.settingKey) {
      const keyConflict = await this.prisma.setting.findUnique({
        where: { settingKey: dto.settingKey },
      });
      if (keyConflict) {
        throw new ConflictException(`Setting with key "${dto.settingKey}" already exists`);
      }
    }

    const updated = await this.prisma.setting.update({
      where: { settingId: existing.settingId },
      data: {
        ...(dto.settingKey && { settingKey: dto.settingKey }),
        ...(dto.settingValue !== undefined && { settingValue: dto.settingValue }),
        ...(dto.valueType && { valueType: dto.valueType }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.objectCode && { objectCode: dto.objectCode }),
        updatedBy: updatedBy || 'SYSTEM',
      },
    });

    return {
      message: `Setting "${existing.settingKey}" updated successfully`,
      data: updated,
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.setting.findFirst({
      where: {
        OR: [{ settingId: id }, { settingKey: id }],
      },
    });

    if (!existing) {
      throw new NotFoundException(`Setting with ID or Key "${id}" not found`);
    }

    await this.prisma.setting.delete({
      where: { settingId: existing.settingId },
    });

    return {
      message: `Setting "${existing.settingKey}" deleted successfully`,
    };
  }
}
