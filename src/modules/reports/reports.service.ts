import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { QueryReportDto } from './dto/query-report.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private parseDateFilter(dto: QueryReportDto) {
    let gte: Date | undefined;
    let lte: Date | undefined;

    if (dto.startDate) {
      gte = new Date(`${dto.startDate}T00:00:00.000Z`);
    }
    if (dto.endDate) {
      lte = new Date(`${dto.endDate}T23:59:59.999Z`);
    }

    return { gte, lte };
  }

  async getDashboardMetrics(dto: QueryReportDto) {
    const { gte, lte } = this.parseDateFilter(dto);
    const dateWhere: Prisma.PosOrderWhereInput = {
      isActive: 'Y',
      orderStatus: { notIn: ['CANCELLED', 'VOIDED'] },
      ...(gte || lte ? { orderedAt: { ...(gte ? { gte } : {}), ...(lte ? { lte } : {}) } } : {}),
      ...(dto.outletId ? { outletId: dto.outletId } : {}),
    };

    // 1. Orders and Items
    const orders = await this.prisma.posOrder.findMany({
      where: dateWhere,
      include: {
        items: {
          where: { isActive: 'Y', itemStatus: { notIn: ['CANCELLED', 'VOIDED'] } },
        },
        payments: {
          where: { isActive: 'Y', paymentStatus: 'SUCCESS' },
        },
      },
      orderBy: { orderedAt: 'desc' },
    });

    let totalRevenue = 0;
    let totalCogs = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    const totalOrdersCount = orders.length;
    let totalItemsCount = 0;

    const paymentMap: Record<string, { name: string; amount: number; count: number }> = {};
    const productMap: Record<string, { code: string; name: string; qty: number; revenue: number; cost: number }> = {};

    for (const order of orders) {
      const rev = Number(order.totalAmount || 0);
      totalRevenue += rev;
      totalDiscount += Number(order.discountAmount || 0);
      totalTax += Number(order.taxAmount || 0);

      for (const item of order.items) {
        const qty = Number(item.quantity || 0);
        const cost = Number(item.costPrice || 0) * qty;
        const itemRev = Number(item.totalAmount || 0);
        totalItemsCount += qty;
        totalCogs += cost;

        if (!productMap[item.productId]) {
          productMap[item.productId] = {
            code: item.itemCode,
            name: item.itemName,
            qty: 0,
            revenue: 0,
            cost: 0,
          };
        }
        productMap[item.productId].qty += qty;
        productMap[item.productId].revenue += itemRev;
        productMap[item.productId].cost += cost;
      }

      for (const pay of order.payments) {
        const methodKey = pay.paymentMethodName || 'Lainnya';
        if (!paymentMap[methodKey]) {
          paymentMap[methodKey] = { name: methodKey, amount: 0, count: 0 };
        }
        paymentMap[methodKey].amount += Number(pay.amount || 0);
        paymentMap[methodKey].count += 1;
      }
    }

    const grossProfit = totalRevenue - totalCogs;
    const profitMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const averageOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

    // Top products
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, dto.limit || 5)
      .map((p) => ({
        ...p,
        profit: p.revenue - p.cost,
        marginPercent: p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue) * 100 : 0,
      }));

    // Daily trend (group by date)
    const trendMap: Record<string, { date: string; revenue: number; cogs: number; ordersCount: number }> = {};
    for (const order of orders) {
      const dateKey = order.orderedAt.toISOString().slice(0, 10);
      if (!trendMap[dateKey]) {
        trendMap[dateKey] = { date: dateKey, revenue: 0, cogs: 0, ordersCount: 0 };
      }
      trendMap[dateKey].revenue += Number(order.totalAmount || 0);
      trendMap[dateKey].ordersCount += 1;
      for (const item of order.items) {
        trendMap[dateKey].cogs += Number(item.costPrice || 0) * Number(item.quantity || 0);
      }
    }

    const salesTrend = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

    return {
      summary: {
        totalRevenue,
        totalCogs,
        grossProfit,
        profitMarginPercent: Math.round(profitMarginPercent * 100) / 100,
        totalOrdersCount,
        totalItemsCount,
        averageOrderValue: Math.round(averageOrderValue),
        totalDiscount,
        totalTax,
      },
      salesTrend,
      paymentBreakdown: Object.values(paymentMap),
      topProducts,
      recentOrders: orders.slice(0, 10).map((o) => ({
        orderId: o.orderId,
        orderNumber: o.orderNumber,
        invoiceNumber: o.invoiceNumber,
        orderedAt: o.orderedAt,
        orderType: o.orderType,
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        totalAmount: Number(o.totalAmount),
        guestName: o.guestName,
      })),
    };
  }

  async getSalesReport(dto: QueryReportDto) {
    const { gte, lte } = this.parseDateFilter(dto);
    const where: Prisma.PosOrderWhereInput = {
      isActive: 'Y',
      orderStatus: { notIn: ['CANCELLED', 'VOIDED'] },
      ...(gte || lte ? { orderedAt: { ...(gte ? { gte } : {}), ...(lte ? { lte } : {}) } } : {}),
      ...(dto.outletId ? { outletId: dto.outletId } : {}),
      ...(dto.channelId ? { channelId: dto.channelId } : {}),
      ...(dto.paymentStatus && dto.paymentStatus !== 'ALL' ? { paymentStatus: dto.paymentStatus } : {}),
    };

    const orders = await this.prisma.posOrder.findMany({
      where,
      include: {
        outlet: { select: { outletName: true, outletCode: true } },
        channel: { select: { channelName: true } },
        shift: { select: { shiftCode: true, cashierUser: { select: { fullname: true } } } },
        items: {
          where: { isActive: 'Y', itemStatus: { notIn: ['CANCELLED', 'VOIDED'] } },
        },
        payments: {
          where: { isActive: 'Y', paymentStatus: 'SUCCESS' },
        },
      },
      orderBy: { orderedAt: 'desc' },
    });

    let totalSubtotal = 0;
    let totalDiscount = 0;
    let totalSurcharge = 0;
    let totalTax = 0;
    let totalRevenue = 0;
    let totalCogs = 0;

    const rows = orders.map((o) => {
      let orderCost = 0;
      for (const it of o.items) {
        orderCost += Number(it.costPrice || 0) * Number(it.quantity || 0);
      }
      const gross = Number(o.subtotal || 0);
      const disc = Number(o.discountAmount || 0);
      const sur = Number(o.surchargeAmount || 0);
      const tax = Number(o.taxAmount || 0);
      const tot = Number(o.totalAmount || 0);
      const profit = tot - orderCost;
      const margin = tot > 0 ? (profit / tot) * 100 : 0;

      totalSubtotal += gross;
      totalDiscount += disc;
      totalSurcharge += sur;
      totalTax += tax;
      totalRevenue += tot;
      totalCogs += orderCost;

      const methods = o.payments.map((p) => p.paymentMethodName).filter(Boolean).join(', ') || 'Unpaid';

      return {
        orderId: o.orderId,
        orderNumber: o.orderNumber,
        invoiceNumber: o.invoiceNumber,
        date: o.orderedAt.toISOString().slice(0, 10),
        time: o.orderedAt.toISOString().slice(11, 19),
        orderedAt: o.orderedAt,
        outletName: o.outlet?.outletName || '-',
        channelName: o.channel?.channelName || '-',
        cashierName: o.shift?.cashierUser?.fullname || '-',
        orderType: o.orderType,
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        subtotal: gross,
        discountAmount: disc,
        surchargeAmount: sur,
        taxAmount: tax,
        totalAmount: tot,
        totalCost: orderCost,
        grossProfit: profit,
        profitMarginPercent: Math.round(margin * 100) / 100,
        paymentMethods: methods,
        itemsCount: o.items.length,
      };
    });

    const netProfit = totalRevenue - totalCogs;
    const overallMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      summary: {
        totalOrdersCount: orders.length,
        totalSubtotal,
        totalDiscount,
        totalSurcharge,
        totalTax,
        totalRevenue,
        totalCogs,
        grossProfit: netProfit,
        profitMarginPercent: Math.round(overallMargin * 100) / 100,
      },
      orders: rows,
    };
  }

  async getProductPerformanceReport(dto: QueryReportDto) {
    const { gte, lte } = this.parseDateFilter(dto);
    const orderWhere: Prisma.PosOrderWhereInput = {
      isActive: 'Y',
      orderStatus: { notIn: ['CANCELLED', 'VOIDED'] },
      ...(gte || lte ? { orderedAt: { ...(gte ? { gte } : {}), ...(lte ? { lte } : {}) } } : {}),
      ...(dto.outletId ? { outletId: dto.outletId } : {}),
    };

    const items = await this.prisma.posOrderItem.findMany({
      where: {
        isActive: 'Y',
        itemStatus: { notIn: ['CANCELLED', 'VOIDED'] },
        order: orderWhere,
      },
      include: {
        product: {
          select: {
            productCode: true,
            productName: true,
            category: { select: { categoryName: true } },
            unit: { select: { unitName: true } },
          },
        },
      },
    });

    const grouped: Record<
      string,
      {
        productId: string;
        productCode: string;
        productName: string;
        categoryName: string;
        unitName: string;
        quantitySold: number;
        totalRevenue: number;
        totalCost: number;
      }
    > = {};

    let grandTotalQty = 0;
    let grandTotalRevenue = 0;
    let grandTotalCost = 0;

    for (const item of items) {
      const pid = item.productId;
      const qty = Number(item.quantity || 0);
      const rev = Number(item.totalAmount || 0);
      const cost = Number(item.costPrice || 0) * qty;

      grandTotalQty += qty;
      grandTotalRevenue += rev;
      grandTotalCost += cost;

      if (!grouped[pid]) {
        grouped[pid] = {
          productId: pid,
          productCode: item.product?.productCode || item.itemCode,
          productName: item.product?.productName || item.itemName,
          categoryName: item.product?.category?.categoryName || 'Tanpa Kategori',
          unitName: item.product?.unit?.unitName || 'Pcs',
          quantitySold: 0,
          totalRevenue: 0,
          totalCost: 0,
        };
      }

      grouped[pid].quantitySold += qty;
      grouped[pid].totalRevenue += rev;
      grouped[pid].totalCost += cost;
    }

    const products = Object.values(grouped)
      .map((p) => {
        const profit = p.totalRevenue - p.totalCost;
        const margin = p.totalRevenue > 0 ? (profit / p.totalRevenue) * 100 : 0;
        const revShare = grandTotalRevenue > 0 ? (p.totalRevenue / grandTotalRevenue) * 100 : 0;

        return {
          ...p,
          grossProfit: profit,
          profitMarginPercent: Math.round(margin * 100) / 100,
          revenueSharePercent: Math.round(revShare * 100) / 100,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      summary: {
        totalUniqueProducts: products.length,
        grandTotalQty,
        grandTotalRevenue,
        grandTotalCost,
        grandTotalProfit: grandTotalRevenue - grandTotalCost,
      },
      products,
    };
  }

  async getShiftAuditReport(dto: QueryReportDto) {
    const { gte, lte } = this.parseDateFilter(dto);
    const where: Prisma.PosRegisterShiftWhereInput = {
      isActive: 'Y',
      ...(gte || lte ? { openedAt: { ...(gte ? { gte } : {}), ...(lte ? { lte } : {}) } } : {}),
      ...(dto.outletId ? { outletId: dto.outletId } : {}),
    };

    const shifts = await this.prisma.posRegisterShift.findMany({
      where,
      include: {
        outlet: { select: { outletName: true, outletCode: true } },
        register: { select: { registerCode: true, registerName: true } },
        cashierUser: { select: { fullname: true, username: true } },
        cashMovements: { where: { isActive: 'Y' } },
        orders: {
          where: { isActive: 'Y', orderStatus: { notIn: ['CANCELLED', 'VOIDED'] } },
          select: { totalAmount: true },
        },
      },
      orderBy: { openedAt: 'desc' },
    });

    const shiftRows = shifts.map((s) => {
      let cashIn = 0;
      let cashOut = 0;
      for (const m of s.cashMovements) {
        if (m.movementType === 'CASH_IN') cashIn += Number(m.amount);
        if (m.movementType === 'CASH_OUT') cashOut += Number(m.amount);
      }

      const opening = Number(s.openingCash || 0);
      const sales = Number(s.totalSalesAmount || 0);
      const expected = Number(s.expectedCash || 0);
      const actual = s.actualCash !== null ? Number(s.actualCash) : null;
      const diff = s.cashDifference !== null ? Number(s.cashDifference) : null;

      return {
        shiftId: s.shiftId,
        shiftCode: s.shiftCode,
        outletName: s.outlet?.outletName || '-',
        registerName: s.register?.registerName || '-',
        cashierName: s.cashierUser?.fullname || s.cashierUser?.username || '-',
        openedAt: s.openedAt,
        closedAt: s.closedAt,
        status: s.status,
        openingCash: opening,
        totalCashIn: cashIn,
        totalCashOut: cashOut,
        totalSalesAmount: sales,
        totalOrdersCount: s.totalOrdersCount,
        expectedCash: expected,
        actualCash: actual,
        cashDifference: diff,
        hasDiscrepancy: diff !== null && diff !== 0,
        closingNotes: s.closingNotes,
      };
    });

    return {
      totalShifts: shiftRows.length,
      shifts: shiftRows,
    };
  }

  async getPaymentMethodReport(dto: QueryReportDto) {
    const { gte, lte } = this.parseDateFilter(dto);
    const payments = await this.prisma.posOrderPayment.findMany({
      where: {
        isActive: 'Y',
        paymentStatus: 'SUCCESS',
        ...(gte || lte ? { paidAt: { ...(gte ? { gte } : {}), ...(lte ? { lte } : {}) } } : {}),
        order: {
          isActive: 'Y',
          orderStatus: { notIn: ['CANCELLED', 'VOIDED'] },
          ...(dto.outletId ? { outletId: dto.outletId } : {}),
        },
      },
    });

    const methodMap: Record<
      string,
      {
        methodId: string;
        methodCode: string;
        methodName: string;
        methodType: string;
        transactionCount: number;
        totalAmount: number;
      }
    > = {};

    let grandTotal = 0;
    let grandCount = 0;

    for (const p of payments) {
      const mid = p.paymentMethodId || 'OTHER';
      const amt = Number(p.amount || 0);

      grandTotal += amt;
      grandCount += 1;

      if (!methodMap[mid]) {
        methodMap[mid] = {
          methodId: mid,
          methodCode: p.paymentMethodCode || 'OTHER',
          methodName: p.paymentMethodName || 'Lainnya',
          methodType: p.paymentType || 'CASH',
          transactionCount: 0,
          totalAmount: 0,
        };
      }

      methodMap[mid].transactionCount += 1;
      methodMap[mid].totalAmount += amt;
    }

    const methods = Object.values(methodMap).map((m) => ({
      ...m,
      sharePercent: grandTotal > 0 ? Math.round(((m.totalAmount / grandTotal) * 100) * 100) / 100 : 0,
    })).sort((a, b) => b.totalAmount - a.totalAmount);

    return {
      summary: {
        totalTransactions: grandCount,
        grandTotalAmount: grandTotal,
      },
      paymentMethods: methods,
    };
  }
}
