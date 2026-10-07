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
import { TaxesService } from './taxes.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { QueryTaxDto } from './dto/query-tax.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Master Taxes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('taxes')
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('TAX', 'createPerm')
  @ApiOperation({ summary: 'Create new tax' })
  @ApiResponse({ status: 201, description: 'Tax successfully created' })
  async create(@Body() dto: CreateTaxDto, @CurrentUser() user: CurrentUserPayload) {
    return this.taxesService.create(dto, user?.username);
  }

  @Get()
  @RequirePermissions('TAX', 'readPerm')
  @ApiOperation({ summary: 'Retrieve paginated list of taxes' })
  @ApiResponse({ status: 200, description: 'Paginated taxes list' })
  async findAll(@Query() query: QueryTaxDto) {
    return this.taxesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('TAX', 'readPerm')
  @ApiOperation({ summary: 'Get tax details by ID' })
  @ApiResponse({ status: 200, description: 'Tax details' })
  async findOne(@Param('id') id: string) {
    return this.taxesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('TAX', 'updatePerm')
  @ApiOperation({ summary: 'Update tax' })
  @ApiResponse({ status: 200, description: 'Tax updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaxDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.taxesService.update(id, dto, user?.username);
  }

  @Delete(':id')
  @RequirePermissions('TAX', 'deletePerm')
  @ApiOperation({ summary: 'Delete tax' })
  @ApiResponse({ status: 200, description: 'Tax deleted' })
  async remove(@Param('id') id: string) {
    return this.taxesService.remove(id);
  }
}
