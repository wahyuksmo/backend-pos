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
import { KitchenStationsService } from './kitchen-stations.service';
import { CreateKitchenStationDto } from './dto/create-kitchen-station.dto';
import { UpdateKitchenStationDto } from './dto/update-kitchen-station.dto';
import { QueryKitchenStationDto } from './dto/query-kitchen-station.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Master Kitchen Stations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('kitchen-stations')
export class KitchenStationsController {
  constructor(private readonly kitchenStationsService: KitchenStationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('KITCHEN_STATION', 'createPerm')
  @ApiOperation({ summary: 'Buat kitchen station baru' })
  @ApiResponse({ status: 201, description: 'Kitchen station berhasil dibuat' })
  async create(@Body() dto: CreateKitchenStationDto, @CurrentUser() user: CurrentUserPayload) {
    return this.kitchenStationsService.create(dto, user?.username);
  }

  @Get()
  @RequirePermissions('KITCHEN_STATION', 'readPerm')
  @ApiOperation({ summary: 'Daftar kitchen stations (paginasi)' })
  @ApiResponse({ status: 200, description: 'Daftar kitchen stations' })
  async findAll(@Query() query: QueryKitchenStationDto) {
    return this.kitchenStationsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('KITCHEN_STATION', 'readPerm')
  @ApiOperation({ summary: 'Detail kitchen station berdasarkan ID' })
  @ApiResponse({ status: 200, description: 'Detail kitchen station' })
  async findOne(@Param('id') id: string) {
    return this.kitchenStationsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('KITCHEN_STATION', 'updatePerm')
  @ApiOperation({ summary: 'Update kitchen station' })
  @ApiResponse({ status: 200, description: 'Kitchen station berhasil diupdate' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateKitchenStationDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.kitchenStationsService.update(id, dto, user?.username);
  }

  @Delete(':id')
  @RequirePermissions('KITCHEN_STATION', 'deletePerm')
  @ApiOperation({ summary: 'Hapus kitchen station' })
  @ApiResponse({ status: 200, description: 'Kitchen station berhasil dihapus' })
  async remove(@Param('id') id: string) {
    return this.kitchenStationsService.remove(id);
  }
}
