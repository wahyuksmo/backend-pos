import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { QueryStockDto } from './dto/query-stock.dto';
import { QueryMovementDto } from './dto/query-movement.dto';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { QueryAdjustmentDto } from './dto/query-adjustment.dto';
import { CreateTransferDto, UpdateTransferStatusDto } from './dto/create-transfer.dto';
import { QueryTransferDto } from './dto/query-transfer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Inventory & Stock Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // 1. Saldo Stok
  @Get('stocks')
  @RequirePermissions('STOCK', 'readPerm')
  @ApiOperation({ summary: 'Daftar saldo stok per gudang & produk' })
  async getStocks(@Query() query: QueryStockDto) {
    return this.inventoryService.getStocks(query);
  }

  // 2. Kartu Stok & Mutasi
  @Get('movements')
  @RequirePermissions('STOCK_MOVEMENT', 'readPerm')
  @ApiOperation({ summary: 'Kartu stok mutasi ledger' })
  async getMovements(@Query() query: QueryMovementDto) {
    return this.inventoryService.getMovements(query);
  }

  // 3. Penyesuaian & Opname Stok
  @Post('adjustments')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('STOCK_ADJUSTMENT', 'createPerm')
  @ApiOperation({ summary: 'Input penyesuaian / opname stok' })
  async createAdjustment(
    @Body() dto: CreateAdjustmentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.inventoryService.createAdjustment(dto, user?.username || 'SYSTEM');
  }

  @Get('adjustments')
  @RequirePermissions('STOCK_ADJUSTMENT', 'readPerm')
  @ApiOperation({ summary: 'Daftar riwayat penyesuaian stok' })
  async getAdjustments(@Query() query: QueryAdjustmentDto) {
    return this.inventoryService.getAdjustments(query);
  }

  @Get('adjustments/:id')
  @RequirePermissions('STOCK_ADJUSTMENT', 'readPerm')
  @ApiOperation({ summary: 'Detail penyesuaian stok' })
  async getAdjustmentById(@Param('id') id: string) {
    return this.inventoryService.getAdjustmentById(id);
  }

  // 4. Transfer Stok Antar Gudang
  @Post('transfers')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('STOCK_TRANSFER', 'createPerm')
  @ApiOperation({ summary: 'Buat permohonan transfer stok' })
  async createTransfer(
    @Body() dto: CreateTransferDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.inventoryService.createTransfer(dto, user?.username || 'SYSTEM');
  }

  @Get('transfers')
  @RequirePermissions('STOCK_TRANSFER', 'readPerm')
  @ApiOperation({ summary: 'Daftar riwayat transfer stok' })
  async getTransfers(@Query() query: QueryTransferDto) {
    return this.inventoryService.getTransfers(query);
  }

  @Get('transfers/:id')
  @RequirePermissions('STOCK_TRANSFER', 'readPerm')
  @ApiOperation({ summary: 'Detail dokumen transfer stok' })
  async getTransferById(@Param('id') id: string) {
    return this.inventoryService.getTransferById(id);
  }

  @Patch('transfers/:id/status')
  @RequirePermissions('STOCK_TRANSFER', 'updatePerm')
  @ApiOperation({ summary: 'Update status transfer (e.g. RECEIVED, CANCELLED)' })
  async updateTransferStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTransferStatusDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.inventoryService.updateTransferStatus(id, dto, user?.username || 'SYSTEM');
  }
}
