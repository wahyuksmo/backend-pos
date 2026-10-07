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
import { SurchargesService } from './surcharges.service';
import { CreateSurchargeDto } from './dto/create-surcharge.dto';
import { UpdateSurchargeDto } from './dto/update-surcharge.dto';
import { QuerySurchargeDto } from './dto/query-surcharge.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Master Surcharges & Fees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('surcharges')
export class SurchargesController {
  constructor(private readonly surchargesService: SurchargesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('SURCHARGE', 'createPerm')
  @ApiOperation({ summary: 'Buat surcharge / biaya baru' })
  @ApiResponse({ status: 201, description: 'Surcharge berhasil dibuat' })
  async create(@Body() dto: CreateSurchargeDto, @CurrentUser() user: CurrentUserPayload) {
    return this.surchargesService.create(dto, user?.username);
  }

  @Get()
  @RequirePermissions('SURCHARGE', 'readPerm')
  @ApiOperation({ summary: 'Daftar surcharge / biaya (paginasi)' })
  @ApiResponse({ status: 200, description: 'Daftar surcharge' })
  async findAll(@Query() query: QuerySurchargeDto) {
    return this.surchargesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('SURCHARGE', 'readPerm')
  @ApiOperation({ summary: 'Detail surcharge berdasarkan ID' })
  @ApiResponse({ status: 200, description: 'Detail surcharge' })
  async findOne(@Param('id') id: string) {
    return this.surchargesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('SURCHARGE', 'updatePerm')
  @ApiOperation({ summary: 'Update surcharge' })
  @ApiResponse({ status: 200, description: 'Surcharge berhasil diupdate' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSurchargeDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.surchargesService.update(id, dto, user?.username);
  }

  @Delete(':id')
  @RequirePermissions('SURCHARGE', 'deletePerm')
  @ApiOperation({ summary: 'Hapus surcharge' })
  @ApiResponse({ status: 200, description: 'Surcharge berhasil dihapus' })
  async remove(@Param('id') id: string) {
    return this.surchargesService.remove(id);
  }
}
