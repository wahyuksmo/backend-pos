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
import { UnitConversionsService } from './unit-conversions.service';
import { CreateUnitConversionDto } from './dto/create-unit-conversion.dto';
import { UpdateUnitConversionDto } from './dto/update-unit-conversion.dto';
import { QueryUnitConversionDto } from './dto/query-unit-conversion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Master Unit Conversions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('unit-conversions')
export class UnitConversionsController {
  constructor(private readonly unitConversionsService: UnitConversionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('UNIT_CONVERSION', 'createPerm')
  @ApiOperation({ summary: 'Buat konversi satuan baru' })
  @ApiResponse({ status: 201, description: 'Konversi satuan berhasil dibuat' })
  async create(@Body() dto: CreateUnitConversionDto, @CurrentUser() user: CurrentUserPayload) {
    return this.unitConversionsService.create(dto, user?.username);
  }

  @Get()
  @RequirePermissions('UNIT_CONVERSION', 'readPerm')
  @ApiOperation({ summary: 'Daftar konversi satuan (paginasi)' })
  @ApiResponse({ status: 200, description: 'Daftar konversi satuan' })
  async findAll(@Query() query: QueryUnitConversionDto) {
    return this.unitConversionsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('UNIT_CONVERSION', 'readPerm')
  @ApiOperation({ summary: 'Detail konversi satuan berdasarkan ID' })
  @ApiResponse({ status: 200, description: 'Detail konversi satuan' })
  async findOne(@Param('id') id: string) {
    return this.unitConversionsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('UNIT_CONVERSION', 'updatePerm')
  @ApiOperation({ summary: 'Update konversi satuan' })
  @ApiResponse({ status: 200, description: 'Konversi satuan berhasil diupdate' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUnitConversionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.unitConversionsService.update(id, dto, user?.username);
  }

  @Delete(':id')
  @RequirePermissions('UNIT_CONVERSION', 'deletePerm')
  @ApiOperation({ summary: 'Hapus konversi satuan' })
  @ApiResponse({ status: 200, description: 'Konversi satuan berhasil dihapus' })
  async remove(@Param('id') id: string) {
    return this.unitConversionsService.remove(id);
  }
}
