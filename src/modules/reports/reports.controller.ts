import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { QueryReportDto } from './dto/query-report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('POS Reports & Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Ringkasan KPI Dashboard POS (Revenue, HPP, Laba, Trend, Top Produk)' })
  @ApiResponse({ status: 200, description: 'Metrik dashboard berhasil dimuat' })
  async getDashboard(@Query() query: QueryReportDto) {
    return this.reportsService.getDashboardMetrics(query);
  }

  @Get('sales')
  @ApiOperation({ summary: 'Laporan Penjualan Detail & HPP / Margin Laba Kotor' })
  @ApiResponse({ status: 200, description: 'Laporan penjualan berhasil dimuat' })
  async getSales(@Query() query: QueryReportDto) {
    return this.reportsService.getSalesReport(query);
  }

  @Get('products')
  @ApiOperation({ summary: 'Laporan Kinerja Penjualan Produk & Kontribusi Margin' })
  @ApiResponse({ status: 200, description: 'Laporan produk berhasil dimuat' })
  async getProducts(@Query() query: QueryReportDto) {
    return this.reportsService.getProductPerformanceReport(query);
  }

  @Get('shifts')
  @ApiOperation({ summary: 'Laporan Rekap & Audit Selisih Kasir (Shift Discrepancy)' })
  @ApiResponse({ status: 200, description: 'Laporan shift kasir berhasil dimuat' })
  async getShifts(@Query() query: QueryReportDto) {
    return this.reportsService.getShiftAuditReport(query);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Laporan Rekapitulasi Metode Pembayaran' })
  @ApiResponse({ status: 200, description: 'Laporan metode pembayaran berhasil dimuat' })
  async getPayments(@Query() query: QueryReportDto) {
    return this.reportsService.getPaymentMethodReport(query);
  }
}
