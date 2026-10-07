import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface InitiateApprovalParams {
  objectCode: string;
  objectId: string;
  amount?: number;
  requestedByUserId?: string;
  requestedByEmployeeId?: string;
  initiatedBy?: string;
}

export interface ApprovalActionParams {
  approvalId: string;
  userId: string;
  notes?: string;
}

@Injectable()
export class ApprovalsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find matching template based on objectCode and optional nominal amount condition
   */
  async findMatchingTemplate(objectCode: string, amount?: number) {
    const templates = await this.prisma.approvalTemplateHeader.findMany({
      where: {
        objectCode: objectCode.toUpperCase(),
        isActive: 'Y',
      },
      include: {
        details: {
          orderBy: { stepOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!templates.length) {
      throw new NotFoundException(
        `No active approval template found for objectCode "${objectCode}"`,
      );
    }

    if (amount != null) {
      const matched = templates.find((t) => {
        const min = t.minAmount ? Number(t.minAmount) : 0;
        const max = t.maxAmount ? Number(t.maxAmount) : Infinity;
        return amount >= min && amount <= max;
      });

      if (matched) return matched;
    }

    const defaultTemplate =
      templates.find((t) => t.minAmount == null && t.maxAmount == null) || templates[0];

    return defaultTemplate;
  }

  /**
   * Initiate approval transaction from target business object
   */
  async initiateApproval(params: InitiateApprovalParams) {
    const { objectCode, objectId, amount, requestedByEmployeeId, initiatedBy } = params;

    const template = await this.findMatchingTemplate(objectCode, amount);

    if (!template.details.length) {
      throw new BadRequestException(
        `Approval template "${template.templateName}" has no configured steps`,
      );
    }

    let directManagerUserId: string | null = null;
    // ponytail: manager/supervisor hierarchy lookup when organization tree exists

    const transaction = await this.prisma.$transaction(async (tx) => {
      const header = await tx.approvalTransactionHeader.create({
        data: {
          templateId: template.templateId,
          objectCode: objectCode.toUpperCase(),
          objectId,
          totalSteps: template.details.length,
          currentStep: 1,
          status: 'PENDING',
          createdBy: initiatedBy || 'SYSTEM',
        },
      });

      await tx.approvalTransactionDetail.createMany({
        data: template.details.map((step) => {
          let assignedUserId = step.userId;
          if (step.approverType === 'DIRECT_MANAGER') {
            assignedUserId = directManagerUserId;
          }

          return {
            approvalId: header.approvalId,
            stepOrder: step.stepOrder,
            stepName: step.stepName,
            approverType: step.approverType,
            usergroupId: step.usergroupId,
            assignedUserId,
            action: 'PENDING',
            createdBy: initiatedBy || 'SYSTEM',
          };
        }),
      });

      return tx.approvalTransactionHeader.findUnique({
        where: { approvalId: header.approvalId },
        include: {
          template: { select: { templateCode: true, templateName: true } },
          details: {
            orderBy: { stepOrder: 'asc' },
            include: {
              actionByUser: { select: { userId: true, fullname: true, username: true } },
            },
          },
        },
      });
    });

    return transaction;
  }

  private async validateApprover(
    stepDetail: {
      approverType: string;
      usergroupId: string | null;
      assignedUserId: string | null;
    },
    userId: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        usergroupId: true,
        usergroup: { select: { usergroupCode: true } },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    if (user.usergroup?.usergroupCode === 'SUPERADMIN') {
      return true;
    }

    if (stepDetail.approverType === 'SPECIFIC_USER' || stepDetail.approverType === 'DIRECT_MANAGER') {
      if (stepDetail.assignedUserId && stepDetail.assignedUserId !== userId) {
        throw new ForbiddenException('You are not the designated approver for this step');
      }
      return true;
    }

    if (stepDetail.approverType === 'ROLE') {
      if (stepDetail.usergroupId && user.usergroupId !== stepDetail.usergroupId) {
        throw new ForbiddenException('Your role does not have authorization to approve this step');
      }
      return true;
    }

    return true;
  }

  async approve(params: ApprovalActionParams) {
    const { approvalId, userId, notes } = params;

    const approval = await this.prisma.approvalTransactionHeader.findUnique({
      where: { approvalId },
      include: {
        details: { orderBy: { stepOrder: 'asc' } },
      },
    });

    if (!approval) {
      throw new NotFoundException(`Approval transaction with ID "${approvalId}" not found`);
    }

    if (approval.status !== 'PENDING') {
      throw new BadRequestException(`Cannot approve transaction with status "${approval.status}"`);
    }

    const currentDetail = approval.details.find(
      (d) => d.stepOrder === approval.currentStep,
    );

    if (!currentDetail) {
      throw new BadRequestException(`No active step found for step ${approval.currentStep}`);
    }

    await this.validateApprover(currentDetail, userId);

    const isLastStep = approval.currentStep >= approval.totalSteps;
    const nextStep = isLastStep ? approval.currentStep : approval.currentStep + 1;
    const newHeaderStatus = isLastStep ? 'APPROVED' : 'PENDING';

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.approvalTransactionDetail.update({
        where: { approvalDetailId: currentDetail.approvalDetailId },
        data: {
          action: 'APPROVED',
          notes: notes || null,
          actionAt: new Date(),
          actionByUserId: userId,
          updatedBy: userId,
        },
      });

      const updatedHeader = await tx.approvalTransactionHeader.update({
        where: { approvalId },
        data: {
          currentStep: nextStep,
          status: newHeaderStatus,
          updatedBy: userId,
        },
        include: {
          details: {
            orderBy: { stepOrder: 'asc' },
            include: {
              actionByUser: { select: { userId: true, fullname: true, username: true } },
            },
          },
        },
      });

      await this.syncBusinessObjectStatus(
        tx,
        approval.objectCode,
        approval.objectId,
        newHeaderStatus,
        nextStep,
        userId,
      );

      return updatedHeader;
    });

    return {
      message: isLastStep ? 'Approval fully completed' : `Step ${approval.currentStep} approved`,
      data: result,
    };
  }

  async reject(params: ApprovalActionParams) {
    const { approvalId, userId, notes } = params;

    const approval = await this.prisma.approvalTransactionHeader.findUnique({
      where: { approvalId },
      include: {
        details: { orderBy: { stepOrder: 'asc' } },
      },
    });

    if (!approval) {
      throw new NotFoundException(`Approval transaction with ID "${approvalId}" not found`);
    }

    if (approval.status !== 'PENDING') {
      throw new BadRequestException(`Cannot reject transaction with status "${approval.status}"`);
    }

    const currentDetail = approval.details.find(
      (d) => d.stepOrder === approval.currentStep,
    );

    if (!currentDetail) {
      throw new BadRequestException(`No active step found for step ${approval.currentStep}`);
    }

    await this.validateApprover(currentDetail, userId);

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.approvalTransactionDetail.update({
        where: { approvalDetailId: currentDetail.approvalDetailId },
        data: {
          action: 'REJECTED',
          notes: notes || 'Rejected',
          actionAt: new Date(),
          actionByUserId: userId,
          updatedBy: userId,
        },
      });

      const updatedHeader = await tx.approvalTransactionHeader.update({
        where: { approvalId },
        data: {
          status: 'REJECTED',
          updatedBy: userId,
        },
        include: {
          details: {
            orderBy: { stepOrder: 'asc' },
            include: {
              actionByUser: { select: { userId: true, fullname: true, username: true } },
            },
          },
        },
      });

      await this.syncBusinessObjectStatus(
        tx,
        approval.objectCode,
        approval.objectId,
        'REJECTED',
        approval.currentStep,
        userId,
      );

      return updatedHeader;
    });

    return {
      message: 'Approval transaction rejected',
      data: result,
    };
  }

  async revise(params: ApprovalActionParams) {
    const { approvalId, userId, notes } = params;

    const approval = await this.prisma.approvalTransactionHeader.findUnique({
      where: { approvalId },
      include: {
        details: { orderBy: { stepOrder: 'asc' } },
      },
    });

    if (!approval) {
      throw new NotFoundException(`Approval transaction with ID "${approvalId}" not found`);
    }

    if (approval.status !== 'PENDING') {
      throw new BadRequestException(`Cannot revise transaction with status "${approval.status}"`);
    }

    const currentDetail = approval.details.find(
      (d) => d.stepOrder === approval.currentStep,
    );

    if (!currentDetail) {
      throw new BadRequestException(`No active step found for step ${approval.currentStep}`);
    }

    await this.validateApprover(currentDetail, userId);

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.approvalTransactionDetail.update({
        where: { approvalDetailId: currentDetail.approvalDetailId },
        data: {
          action: 'REVISED',
          notes: notes || 'Revision required',
          actionAt: new Date(),
          actionByUserId: userId,
          updatedBy: userId,
        },
      });

      const updatedHeader = await tx.approvalTransactionHeader.update({
        where: { approvalId },
        data: {
          status: 'REVISED',
          updatedBy: userId,
        },
        include: {
          details: {
            orderBy: { stepOrder: 'asc' },
            include: {
              actionByUser: { select: { userId: true, fullname: true, username: true } },
            },
          },
        },
      });

      await this.syncBusinessObjectStatus(
        tx,
        approval.objectCode,
        approval.objectId,
        'REVISED',
        approval.currentStep,
        userId,
      );

      return updatedHeader;
    });

    return {
      message: 'Revision requested successfully',
      data: result,
    };
  }

  async resubmit(approvalId: string, userId: string, notes?: string) {
    const approval = await this.prisma.approvalTransactionHeader.findUnique({
      where: { approvalId },
      include: { details: true },
    });

    if (!approval) {
      throw new NotFoundException(`Approval transaction with ID "${approvalId}" not found`);
    }

    if (approval.status !== 'REVISED') {
      throw new BadRequestException(`Only transactions with status REVISED can be resubmitted`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.approvalTransactionDetail.updateMany({
        where: { approvalId },
        data: {
          action: 'PENDING',
          notes: null,
          actionAt: null,
          actionByUserId: null,
          updatedBy: userId,
        },
      });

      const updatedHeader = await tx.approvalTransactionHeader.update({
        where: { approvalId },
        data: {
          currentStep: 1,
          status: 'PENDING',
          updatedBy: userId,
        },
        include: {
          details: {
            orderBy: { stepOrder: 'asc' },
            include: {
              actionByUser: { select: { userId: true, fullname: true, username: true } },
            },
          },
        },
      });

      await this.syncBusinessObjectStatus(
        tx,
        approval.objectCode,
        approval.objectId,
        'PENDING',
        1,
        userId,
      );

      return updatedHeader;
    });

    return {
      message: 'Transaction resubmitted for approval',
      data: result,
    };
  }

  async getStatus(approvalId: string) {
    const approval = await this.prisma.approvalTransactionHeader.findUnique({
      where: { approvalId },
      include: {
        template: { select: { templateCode: true, templateName: true, objectCode: true } },
        details: {
          orderBy: { stepOrder: 'asc' },
          include: {
            actionByUser: { select: { userId: true, fullname: true, username: true } },
          },
        },
      },
    });

    if (!approval) {
      throw new NotFoundException(`Approval transaction with ID "${approvalId}" not found`);
    }

    return {
      message: 'Approval status retrieved successfully',
      data: approval,
    };
  }

  async getHistoryByObject(objectCode: string, objectId: string) {
    const approvals = await this.prisma.approvalTransactionHeader.findMany({
      where: {
        objectCode: objectCode.toUpperCase(),
        objectId,
      },
      include: {
        template: { select: { templateCode: true, templateName: true } },
        details: {
          orderBy: { stepOrder: 'asc' },
          include: {
            actionByUser: { select: { userId: true, fullname: true, username: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      message: 'Approval history retrieved successfully',
      data: approvals,
    };
  }

  private async syncBusinessObjectStatus(
    tx: any,
    objectCode: string,
    objectId: string,
    status: string,
    currentStep: number,
    userId: string,
  ) {
    const code = objectCode.toUpperCase();
    try {
      // Generic business status handler for POS domain objects (e.g. PURCHASE_ORDER, CASH_EXPENSE, VOID_TRANSACTION)
      // When specific POS operational tables are registered, update status here.
      // ponytail: dispatch domain event or execute dynamic table update when target module is plugged in
    } catch (err) {
      // Gracefully handle if target table doesn't have the row
    }
  }
}

