import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { OpenShiftDto } from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';
import { CashMovementDto } from './dto/cash-movement.dto';
import { QueryShiftDto } from './dto/query-shift.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  async openShift(dto: OpenShiftDto, userId: string, username: string) {
    // 1. Validasi outlet & register
    const outlet = await this.prisma.posOutlet.findUnique({
      where: { outletId: dto.outletId },
    });
    if (!outlet || outlet.isActive !== 'Y') {
      throw new BadRequestException('Outlet tidak ditemukan atau nonaktif');
    }

    const register = await this.prisma.posRegister.findUnique({
      where: { registerId: dto.registerId },
    });
    if (!register || register.isActive !== 'Y') {
      throw new BadRequestException('Register kasir tidak ditemukan atau nonaktif');
    }

    // 2. Cek apakah register masih punya shift OPEN
    const existingOpenShift = await this.prisma.posRegisterShift.findFirst({
      where: {
        registerId: dto.registerId,
        status: 'OPEN',
        isActive: 'Y',
      },
    });
    if (existingOpenShift) {
      throw new BadRequestException('Register kasir ini masih dalam sesi shift aktif yang belum ditutup');
    }

    // 3. Generate shiftCode unik: SFT/OUTLET/YYYYMMDD/SEQ
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const todayCount = await this.prisma.posRegisterShift.count({
      where: {
        outletId: dto.outletId,
        openedAt: { gte: startOfDay, lte: endOfDay },
      },
    });
    const shiftCode = `SFT/${outlet.outletCode}/${dateStr}/${String(todayCount + 1).padStart(3, '0')}`;

    return this.prisma.posRegisterShift.create({
      data: {
        shiftCode,
        outletId: dto.outletId,
        registerId: dto.registerId,
        cashierUserId: userId,
        openingCash: new Prisma.Decimal(dto.openingCash),
        expectedCash: new Prisma.Decimal(dto.openingCash),
        status: 'OPEN',
        createdBy: username,
      },
      include: {
        outlet: { select: { outletId: true, outletCode: true, outletName: true } },
        register: { select: { registerId: true, registerCode: true, registerName: true } },
        cashierUser: { select: { userId: true, username: true, fullname: true } },
      },
    });
  }

  async closeShift(shiftId: string, dto: CloseShiftDto, username: string) {
    const shift = await this.prisma.posRegisterShift.findUnique({
      where: { shiftId },
      include: {
        cashMovements: { where: { isActive: 'Y' } },
      },
    });
    if (!shift || shift.isActive !== 'Y') {
      throw new NotFoundException('Sesi shift tidak ditemukan');
    }
    if (shift.status !== 'OPEN') {
      throw new BadRequestException('Sesi shift ini sudah ditutup');
    }

    // Hitung total uang tunai yang masuk dari pembayaran POS di shift ini
    const cashPayments = await this.prisma.posOrderPayment.aggregate({
      where: {
        order: { shiftId },
        paymentType: 'CASH',
        paymentStatus: 'SUCCESS',
        isActive: 'Y',
      },
      _sum: { amount: true },
    });
    const totalCashSales = Number(cashPayments._sum.amount || 0);

    // Hitung arus kas kasir (cash in / cash out)
    const cashIn = shift.cashMovements
      .filter((m) => m.movementType === 'CASH_IN')
      .reduce((acc, m) => acc + Number(m.amount), 0);
    const cashOut = shift.cashMovements
      .filter((m) => m.movementType === 'CASH_OUT')
      .reduce((acc, m) => acc + Number(m.amount), 0);

    // Hitung total sales pesanan & jumlah order
    const orderAgg = await this.prisma.posOrder.aggregate({
      where: {
        shiftId,
        paymentStatus: 'PAID',
        isActive: 'Y',
      },
      _sum: { totalAmount: true },
      _count: { orderId: true },
    });

    const openingCash = Number(shift.openingCash);
    const expectedCash = openingCash + totalCashSales + cashIn - cashOut;
    const actualCash = Number(dto.actualCash);
    const cashDifference = actualCash - expectedCash;

    return this.prisma.posRegisterShift.update({
      where: { shiftId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        expectedCash: new Prisma.Decimal(expectedCash),
        actualCash: new Prisma.Decimal(actualCash),
        cashDifference: new Prisma.Decimal(cashDifference),
        totalSalesAmount: orderAgg._sum.totalAmount || new Prisma.Decimal(0),
        totalOrdersCount: orderAgg._count.orderId || 0,
        closingNotes: dto.closingNotes || null,
        updatedBy: username,
      },
      include: {
        outlet: { select: { outletId: true, outletCode: true, outletName: true } },
        register: { select: { registerId: true, registerCode: true, registerName: true } },
        cashierUser: { select: { userId: true, username: true, fullname: true } },
        cashMovements: true,
      },
    });
  }

  async getShiftSummary(shiftId: string) {
    const shift = await this.prisma.posRegisterShift.findUnique({
      where: { shiftId },
      include: {
        cashMovements: { where: { isActive: 'Y' } },
        outlet: { select: { outletId: true, outletCode: true, outletName: true } },
        register: { select: { registerId: true, registerCode: true, registerName: true } },
        cashierUser: { select: { userId: true, username: true, fullname: true } },
      },
    });
    if (!shift || shift.isActive !== 'Y') {
      throw new NotFoundException('Sesi shift tidak ditemukan');
    }

    const cashPayments = await this.prisma.posOrderPayment.aggregate({
      where: {
        order: { shiftId },
        paymentType: 'CASH',
        paymentStatus: 'SUCCESS',
        isActive: 'Y',
      },
      _sum: { amount: true },
    });
    const totalCashSales = Number(cashPayments._sum.amount || 0);

    const nonCashPayments = await this.prisma.posOrderPayment.aggregate({
      where: {
        order: { shiftId },
        paymentType: { not: 'CASH' },
        paymentStatus: 'SUCCESS',
        isActive: 'Y',
      },
      _sum: { amount: true },
    });
    const totalNonCashSales = Number(nonCashPayments._sum.amount || 0);

    const cashIn = shift.cashMovements
      .filter((m) => m.movementType === 'CASH_IN')
      .reduce((acc, m) => acc + Number(m.amount), 0);
    const cashOut = shift.cashMovements
      .filter((m) => m.movementType === 'CASH_OUT')
      .reduce((acc, m) => acc + Number(m.amount), 0);

    const orderAgg = await this.prisma.posOrder.aggregate({
      where: {
        shiftId,
        paymentStatus: 'PAID',
        isActive: 'Y',
      },
      _sum: { totalAmount: true },
      _count: { orderId: true },
    });

    const openingCash = Number(shift.openingCash);
    const expectedCash = openingCash + totalCashSales + cashIn - cashOut;

    return {
      shiftId: shift.shiftId,
      shiftCode: shift.shiftCode,
      status: shift.status,
      openedAt: shift.openedAt,
      closedAt: shift.closedAt,
      openingCash,
      totalCashSales,
      totalNonCashSales,
      cashIn,
      cashOut,
      expectedCash,
      actualCash: shift.actualCash ? Number(shift.actualCash) : null,
      cashDifference: shift.cashDifference ? Number(shift.cashDifference) : null,
      totalSalesAmount: Number(orderAgg._sum.totalAmount || 0),
      totalOrdersCount: orderAgg._count.orderId || 0,
      outlet: shift.outlet,
      register: shift.register,
      cashierUser: shift.cashierUser,
    };
  }

  async addCashMovement(shiftId: string, dto: CashMovementDto, username: string) {
    const shift = await this.prisma.posRegisterShift.findUnique({
      where: { shiftId },
    });
    if (!shift || shift.isActive !== 'Y') {
      throw new NotFoundException('Sesi shift tidak ditemukan');
    }
    if (shift.status !== 'OPEN') {
      throw new BadRequestException('Tidak dapat menambah mutasi kas pada shift yang sudah ditutup');
    }

    return this.prisma.posCashMovement.create({
      data: {
        shiftId,
        movementType: dto.movementType,
        amount: new Prisma.Decimal(dto.amount),
        reason: dto.reason,
        recipient: dto.recipient || null,
        authorizedBy: dto.authorizedBy || null,
        createdBy: username,
      },
    });
  }

  async getActiveShift(registerId?: string, cashierUserId?: string) {
    const where: Prisma.PosRegisterShiftWhereInput = {
      status: 'OPEN',
      isActive: 'Y',
    };
    if (registerId) where.registerId = registerId;
    if (cashierUserId) where.cashierUserId = cashierUserId;

    const shift = await this.prisma.posRegisterShift.findFirst({
      where,
      orderBy: { openedAt: 'desc' },
      include: {
        outlet: { select: { outletId: true, outletCode: true, outletName: true } },
        register: { select: { registerId: true, registerCode: true, registerName: true } },
        cashierUser: { select: { userId: true, username: true, fullname: true } },
        cashMovements: { where: { isActive: 'Y' }, orderBy: { createdAt: 'desc' } },
      },
    });

    return shift || null;
  }

  async findAll(query: QueryShiftDto) {
    const {
      page = 1,
      limit = 10,
      search,
      outletId,
      registerId,
      cashierUserId,
      status,
      startDate,
      endDate,
    } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Prisma.PosRegisterShiftWhereInput = {
      isActive: 'Y',
    };

    if (outletId) where.outletId = outletId;
    if (registerId) where.registerId = registerId;
    if (cashierUserId) where.cashierUserId = cashierUserId;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.openedAt = {};
      if (startDate) where.openedAt.gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        where.openedAt.lte = eDate;
      }
    }

    if (search) {
      where.OR = [
        { shiftCode: { contains: search, mode: 'insensitive' } },
        { register: { registerName: { contains: search, mode: 'insensitive' } } },
        { cashierUser: { fullname: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.posRegisterShift.count({ where }),
      this.prisma.posRegisterShift.findMany({
        where,
        skip,
        take,
        orderBy: { openedAt: 'desc' },
        include: {
          outlet: { select: { outletId: true, outletCode: true, outletName: true } },
          register: { select: { registerId: true, registerCode: true, registerName: true } },
          cashierUser: { select: { userId: true, username: true, fullname: true } },
          _count: { select: { orders: true, cashMovements: true } },
        },
      }),
    ]);

    return {
      data,
      meta: {
        page: Number(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  async findOne(shiftId: string) {
    const shift = await this.prisma.posRegisterShift.findUnique({
      where: { shiftId },
      include: {
        outlet: true,
        register: true,
        cashierUser: { select: { userId: true, username: true, fullname: true, email: true } },
        cashMovements: { where: { isActive: 'Y' }, orderBy: { createdAt: 'desc' } },
        orders: {
          take: 50,
          orderBy: { orderedAt: 'desc' },
          include: {
            table: { select: { tableCode: true, tableName: true } },
            customer: { select: { customerCode: true, customerName: true } },
            payments: { where: { isActive: 'Y' } },
          },
        },
      },
    });

    if (!shift || shift.isActive !== 'Y') {
      throw new NotFoundException('Sesi shift tidak ditemukan');
    }
    return shift;
  }
}
