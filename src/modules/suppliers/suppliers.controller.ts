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
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { QuerySupplierDto } from './dto/query-supplier.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Master Suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('SUPPLIER', 'createPerm')
  @ApiOperation({ summary: 'Create new supplier' })
  @ApiResponse({ status: 201, description: 'Supplier successfully created' })
  async create(@Body() dto: CreateSupplierDto, @CurrentUser() user: CurrentUserPayload) {
    return this.suppliersService.create(dto, user?.username);
  }

  @Get()
  @RequirePermissions('SUPPLIER', 'readPerm')
  @ApiOperation({ summary: 'Retrieve paginated list of suppliers' })
  @ApiResponse({ status: 200, description: 'Paginated suppliers list' })
  async findAll(@Query() query: QuerySupplierDto) {
    return this.suppliersService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('SUPPLIER', 'readPerm')
  @ApiOperation({ summary: 'Get supplier details by ID' })
  @ApiResponse({ status: 200, description: 'Supplier details' })
  async findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('SUPPLIER', 'updatePerm')
  @ApiOperation({ summary: 'Update supplier' })
  @ApiResponse({ status: 200, description: 'Supplier updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.suppliersService.update(id, dto, user?.username);
  }

  @Delete(':id')
  @RequirePermissions('SUPPLIER', 'deletePerm')
  @ApiOperation({ summary: 'Delete supplier (soft delete)' })
  @ApiResponse({ status: 200, description: 'Supplier deleted' })
  async remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }
}
