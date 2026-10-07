import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductionsService } from './productions.service';
import { CreateProductionDto } from './dto/create-production.dto';
import { QueryProductionDto } from './dto/query-production.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Inventory & Production (Work Order)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory/productions')
export class ProductionsController {
  constructor(private readonly productionsService: ProductionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('STOCK', 'createPerm')
  @ApiOperation({ summary: 'Buat & selesaikan dokumen produksi (eksekusi BOM)' })
  @ApiResponse({ status: 201, description: 'Produksi berhasil dieksekusi' })
  async create(@Body() dto: CreateProductionDto, @CurrentUser() user: CurrentUserPayload) {
    return this.productionsService.create(dto, user?.username);
  }

  @Get('calculate')
  @RequirePermissions('STOCK', 'readPerm')
  @ApiOperation({ summary: 'Kalkulasi kebutuhan bahan baku otomatis berdasarkan BOM & Target Qty' })
  async calculateFromBom(
    @Query('productId') productId: string,
    @Query('quantity') quantity?: string,
    @Query('variantId') variantId?: string,
  ) {
    const qty = quantity ? parseFloat(quantity) : 1;
    return this.productionsService.calculateFromBom(productId, isNaN(qty) ? 1 : qty, variantId);
  }

  @Get()
  @RequirePermissions('STOCK', 'readPerm')
  @ApiOperation({ summary: 'Daftar riwayat dokumen produksi (paginasi)' })
  async findAll(@Query() query: QueryProductionDto) {
    return this.productionsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('STOCK', 'readPerm')
  @ApiOperation({ summary: 'Detail dokumen produksi beserta bahan yang dipakai' })
  async findOne(@Param('id') id: string) {
    return this.productionsService.findOne(id);
  }
}
