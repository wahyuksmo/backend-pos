import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateApprovalTemplateDto } from './dto/create-approval-template.dto';
import { UpdateApprovalTemplateDto } from './dto/update-approval-template.dto';
import { QueryApprovalTemplateDto } from './dto/query-approval-template.dto';

@Injectable()
export class ApprovalTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async getLookups() {
    const [systemObjects, usergroups, users] = await Promise.all([
      this.prisma.systemObject.findMany({
        where: { isApprovable: 'Y', isActive: 'Y' },
        select: { objectCode: true, description: true },
        orderBy: { objectCode: 'asc' },
      }),
      this.prisma.userGroup.findMany({
        select: { usergroupId: true, usergroupName: true, usergroupCode: true },
        orderBy: { usergroupName: 'asc' },
      }),
      this.prisma.user.findMany({
        where: { isActive: 'Y' },
        select: { userId: true, fullname: true, username: true },
        orderBy: { fullname: 'asc' },
      }),
    ]);

    let modules = systemObjects.map((s) => ({
      value: s.objectCode,
      label: s.description || s.objectCode,
    }));

    if (modules.length === 0) {
      const defaultApprovables = [
        { objectCode: 'PURCHASE_ORDER', tableName: 'pos_purchase_orders', description: 'Pengajuan Purchase Order (PO)' },
        { objectCode: 'SALES_DISCOUNT', tableName: 'pos_sales_discounts', description: 'Persetujuan Diskon Penjualan Khusus' },
        { objectCode: 'VOID_TRANSACTION', tableName: 'pos_void_transactions', description: 'Persetujuan Void / Batal Transaksi Kasir' },
        { objectCode: 'CASH_EXPENSE', tableName: 'pos_cash_expenses', description: 'Pengeluaran Kas Operasional Toko' },
        { objectCode: 'PRICE_CHANGE', tableName: 'pos_price_changes', description: 'Perubahan Harga Jual Barang' },
      ];

      for (const item of defaultApprovables) {
        await this.prisma.systemObject.upsert({
          where: { objectCode: item.objectCode },
          update: { isApprovable: 'Y', description: item.description },
          create: {
            objectCode: item.objectCode,
            tableName: item.tableName,
            description: item.description,
            isApprovable: 'Y',
            isActive: 'Y',
            createdBy: 'SYSTEM',
          },
        });
      }

      modules = defaultApprovables.map((d) => ({
        value: d.objectCode,
        label: d.description,
      }));
    }

    const approverTypes = [
      { value: 'DIRECT_MANAGER', label: 'Atasan Langsung (Dinamis)' },
      { value: 'ROLE', label: 'Role / User Group' },
      { value: 'SPECIFIC_USER', label: 'User Tertentu' },
    ];

    return {
      message: 'Approval lookups retrieved successfully',
      data: {
        modules,
        approverTypes,
        usergroups: usergroups.map((g) => ({
          value: g.usergroupId,
          label: `${g.usergroupName} (${g.usergroupCode})`,
        })),
        users: users.map((u) => ({
          value: u.userId,
          label: `${u.fullname} (@${u.username})`,
        })),
      },
    };
  }

  async create(dto: CreateApprovalTemplateDto, createdBy?: string) {
    const existing = await this.prisma.approvalTemplateHeader.findUnique({
      where: { templateCode: dto.templateCode },
    });

    if (existing) {
      throw new ConflictException(
        `Approval template with code "${dto.templateCode}" already exists`,
      );
    }

    if (!dto.details || dto.details.length === 0) {
      throw new BadRequestException('Approval template must have at least one workflow step');
    }

    const sortedSteps = [...dto.details].sort((a, b) => a.stepOrder - b.stepOrder);

    const template = await this.prisma.$transaction(async (tx) => {
      const header = await tx.approvalTemplateHeader.create({
        data: {
          templateCode: dto.templateCode.toUpperCase(),
          templateName: dto.templateName,
          objectCode: dto.objectCode.toUpperCase(),
          minAmount: dto.minAmount != null ? dto.minAmount : null,
          maxAmount: dto.maxAmount != null ? dto.maxAmount : null,
          description: dto.description,
          createdBy: createdBy || 'SYSTEM',
        },
      });

      await tx.approvalTemplateDetail.createMany({
        data: sortedSteps.map((step, idx) => ({
          templateId: header.templateId,
          stepOrder: idx + 1,
          stepName: step.stepName,
          approverType: step.approverType,
          usergroupId: step.approverType === 'ROLE' ? step.usergroupId : null,
          userId: step.approverType === 'SPECIFIC_USER' ? step.userId : null,
          canRevise: step.canRevise || 'Y',
          createdBy: createdBy || 'SYSTEM',
        })),
      });

      return tx.approvalTemplateHeader.findUnique({
        where: { templateId: header.templateId },
        include: {
          details: {
            orderBy: { stepOrder: 'asc' },
            include: {
              usergroup: { select: { usergroupId: true, usergroupName: true, usergroupCode: true } },
              user: { select: { userId: true, fullname: true, username: true } },
            },
          },
        },
      });
    });

    return {
      message: 'Approval template created successfully',
      data: template,
    };
  }

  async findAll(query: QueryApprovalTemplateDto) {
    const {
      page = 1,
      limit = 10,
      search,
      objectCode,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;
    const skip = ((page || 1) - 1) * (limit || 10);
    const take = limit || 10;

    const where: Prisma.ApprovalTemplateHeaderWhereInput = {
      ...(objectCode && { objectCode: { equals: objectCode, mode: 'insensitive' } }),
      ...(search && {
        OR: [
          { templateCode: { contains: search, mode: 'insensitive' } },
          { templateName: { contains: search, mode: 'insensitive' } },
          { objectCode: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, templates] = await Promise.all([
      this.prisma.approvalTemplateHeader.count({ where }),
      this.prisma.approvalTemplateHeader.findMany({
        where,
        skip,
        take,
        include: {
          details: {
            orderBy: { stepOrder: 'asc' },
            include: {
              usergroup: { select: { usergroupId: true, usergroupName: true, usergroupCode: true } },
              user: { select: { userId: true, fullname: true, username: true } },
            },
          },
          _count: {
            select: { transactions: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    const totalPages = Math.ceil(total / take);

    return {
      message: 'Approval templates retrieved successfully',
      data: templates,
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

  async findOne(templateId: string) {
    const template = await this.prisma.approvalTemplateHeader.findUnique({
      where: { templateId },
      include: {
        details: {
          orderBy: { stepOrder: 'asc' },
          include: {
            usergroup: { select: { usergroupId: true, usergroupName: true, usergroupCode: true } },
            user: { select: { userId: true, fullname: true, username: true } },
          },
        },
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`Approval template with ID "${templateId}" not found`);
    }

    return {
      message: 'Approval template retrieved successfully',
      data: template,
    };
  }

  async update(templateId: string, dto: UpdateApprovalTemplateDto, updatedBy?: string) {
    const existing = await this.prisma.approvalTemplateHeader.findUnique({
      where: { templateId },
    });

    if (!existing) {
      throw new NotFoundException(`Approval template with ID "${templateId}" not found`);
    }

    if (dto.templateCode && dto.templateCode !== existing.templateCode) {
      const codeTaken = await this.prisma.approvalTemplateHeader.findUnique({
        where: { templateCode: dto.templateCode },
      });
      if (codeTaken) {
        throw new ConflictException(`Template code "${dto.templateCode}" is already in use`);
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.approvalTemplateHeader.update({
        where: { templateId },
        data: {
          ...(dto.templateCode && { templateCode: dto.templateCode.toUpperCase() }),
          ...(dto.templateName && { templateName: dto.templateName }),
          ...(dto.objectCode && { objectCode: dto.objectCode.toUpperCase() }),
          ...(dto.minAmount !== undefined && { minAmount: dto.minAmount }),
          ...(dto.maxAmount !== undefined && { maxAmount: dto.maxAmount }),
          ...(dto.description !== undefined && { description: dto.description }),
          updatedBy: updatedBy || 'SYSTEM',
        },
      });

      if (dto.details && dto.details.length > 0) {
        await tx.approvalTemplateDetail.deleteMany({
          where: { templateId },
        });

        const sortedSteps = [...dto.details].sort((a, b) => a.stepOrder - b.stepOrder);
        await tx.approvalTemplateDetail.createMany({
          data: sortedSteps.map((step, idx) => ({
            templateId,
            stepOrder: idx + 1,
            stepName: step.stepName,
            approverType: step.approverType,
            usergroupId: step.approverType === 'ROLE' ? step.usergroupId : null,
            userId: step.approverType === 'SPECIFIC_USER' ? step.userId : null,
            canRevise: step.canRevise || 'Y',
            createdBy: updatedBy || 'SYSTEM',
          })),
        });
      }

      return tx.approvalTemplateHeader.findUnique({
        where: { templateId },
        include: {
          details: {
            orderBy: { stepOrder: 'asc' },
            include: {
              usergroup: { select: { usergroupId: true, usergroupName: true, usergroupCode: true } },
              user: { select: { userId: true, fullname: true, username: true } },
            },
          },
        },
      });
    });

    return {
      message: 'Approval template updated successfully',
      data: updated,
    };
  }

  async remove(templateId: string) {
    const existing = await this.prisma.approvalTemplateHeader.findUnique({
      where: { templateId },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Approval template with ID "${templateId}" not found`);
    }

    if (existing._count.transactions > 0) {
      throw new BadRequestException(
        `Cannot delete template because it is currently used by ${existing._count.transactions} approval transaction(s)`,
      );
    }

    await this.prisma.approvalTemplateHeader.delete({
      where: { templateId },
    });

    return {
      message: 'Approval template deleted successfully',
      data: null,
    };
  }
}
