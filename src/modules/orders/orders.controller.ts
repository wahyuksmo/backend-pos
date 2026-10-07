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
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { VoidOrderDto } from './dto/void-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('POS Orders & Sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('ORDER', 'createPerm')
  @ApiOperation({ summary: 'Buat pesanan baru (Fast Checkout atau Open Tab)' })
  @ApiResponse({ status: 201, description: 'Pesanan berhasil dibuat' })
  async create(@Body() dto: CreateOrderDto, @CurrentUser() user: CurrentUserPayload) {
    return this.ordersService.create(dto, user?.username || 'SYSTEM');
  }

  @Post(':id/payments')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('ORDER', 'createPerm')
  @ApiOperation({ summary: 'Bayar / Split Payment pesanan yang masih open' })
  @ApiResponse({ status: 201, description: 'Pembayaran berhasil diproses' })
  async addPayment(
    @Param('id') id: string,
    @Body() dto: AddPaymentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.ordersService.addPayment(id, dto, user?.username || 'SYSTEM');
  }

  @Patch(':id/void')
  @RequirePermissions('ORDER', 'deletePerm')
  @ApiOperation({ summary: 'Void / Batalkan pesanan POS dengan alasan' })
  @ApiResponse({ status: 200, description: 'Pesanan berhasil dibatalkan (void)' })
  async voidOrder(
    @Param('id') id: string,
    @Body() dto: VoidOrderDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.ordersService.voidOrder(id, dto, user?.username || 'SYSTEM');
  }

  @Get()
  @RequirePermissions('ORDER', 'readPerm')
  @ApiOperation({ summary: 'Daftar riwayat transaksi pesanan POS' })
  @ApiResponse({ status: 200, description: 'Paginated orders list' })
  async findAll(@Query() query: QueryOrderDto) {
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('ORDER', 'readPerm')
  @ApiOperation({ summary: 'Detail struk & invoice pesanan POS' })
  @ApiResponse({ status: 200, description: 'Detail lengkap pesanan' })
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }
}
