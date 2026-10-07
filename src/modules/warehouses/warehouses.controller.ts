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
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { QueryWarehouseDto } from './dto/query-warehouse.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Master Warehouses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('WAREHOUSE', 'createPerm')
  @ApiOperation({ summary: 'Create new warehouse' })
  @ApiResponse({ status: 201, description: 'Warehouse successfully created' })
  async create(@Body() dto: CreateWarehouseDto, @CurrentUser() user: CurrentUserPayload) {
    return this.warehousesService.create(dto, user?.username);
  }

  @Get()
  @RequirePermissions('WAREHOUSE', 'readPerm')
  @ApiOperation({ summary: 'Retrieve paginated list of warehouses' })
  @ApiResponse({ status: 200, description: 'Paginated warehouses list' })
  async findAll(@Query() query: QueryWarehouseDto) {
    return this.warehousesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('WAREHOUSE', 'readPerm')
  @ApiOperation({ summary: 'Get warehouse details by ID' })
  @ApiResponse({ status: 200, description: 'Warehouse details' })
  async findOne(@Param('id') id: string) {
    return this.warehousesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('WAREHOUSE', 'updatePerm')
  @ApiOperation({ summary: 'Update warehouse' })
  @ApiResponse({ status: 200, description: 'Warehouse updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWarehouseDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.warehousesService.update(id, dto, user?.username);
  }

  @Delete(':id')
  @RequirePermissions('WAREHOUSE', 'deletePerm')
  @ApiOperation({ summary: 'Delete warehouse' })
  @ApiResponse({ status: 200, description: 'Warehouse deleted' })
  async remove(@Param('id') id: string) {
    return this.warehousesService.remove(id);
  }
}
