import {
  Body,
  Controller,
  Delete,
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
import { SalesChannelsService } from './sales-channels.service';
import { CreateSalesChannelDto } from './dto/create-sales-channel.dto';
import { UpdateSalesChannelDto } from './dto/update-sales-channel.dto';
import { QuerySalesChannelDto } from './dto/query-sales-channel.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Master Sales Channels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('sales-channels')
export class SalesChannelsController {
  constructor(private readonly salesChannelsService: SalesChannelsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('SALES_CHANNEL', 'createPerm')
  @ApiOperation({ summary: 'Buat saluran penjualan baru' })
  @ApiResponse({ status: 201, description: 'Saluran penjualan berhasil dibuat' })
  async create(@Body() dto: CreateSalesChannelDto, @CurrentUser() user: CurrentUserPayload) {
    return this.salesChannelsService.create(dto, user?.username);
  }

  @Get()
  @RequirePermissions('SALES_CHANNEL', 'readPerm')
  @ApiOperation({ summary: 'Daftar saluran penjualan (paginasi)' })
  @ApiResponse({ status: 200, description: 'Daftar saluran penjualan' })
  async findAll(@Query() query: QuerySalesChannelDto) {
    return this.salesChannelsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('SALES_CHANNEL', 'readPerm')
  @ApiOperation({ summary: 'Detail saluran penjualan berdasarkan ID' })
  @ApiResponse({ status: 200, description: 'Detail saluran penjualan' })
  async findOne(@Param('id') id: string) {
    return this.salesChannelsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('SALES_CHANNEL', 'updatePerm')
  @ApiOperation({ summary: 'Update saluran penjualan' })
  @ApiResponse({ status: 200, description: 'Saluran penjualan berhasil diupdate' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSalesChannelDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.salesChannelsService.update(id, dto, user?.username);
  }

  @Delete(':id')
  @RequirePermissions('SALES_CHANNEL', 'deletePerm')
  @ApiOperation({ summary: 'Hapus saluran penjualan' })
  @ApiResponse({ status: 200, description: 'Saluran penjualan berhasil dihapus' })
  async remove(@Param('id') id: string) {
    return this.salesChannelsService.remove(id);
  }
}
