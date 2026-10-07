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
import { DiningTablesService } from './dining-tables.service';
import { CreateDiningTableDto } from './dto/create-dining-table.dto';
import { UpdateDiningTableDto } from './dto/update-dining-table.dto';
import { QueryDiningTableDto } from './dto/query-dining-table.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Master Dining Tables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('dining-tables')
export class DiningTablesController {
  constructor(private readonly diningTablesService: DiningTablesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('DINING_TABLE', 'createPerm')
  @ApiOperation({ summary: 'Create new dining table' })
  @ApiResponse({ status: 201, description: 'Dining table successfully created' })
  async create(@Body() dto: CreateDiningTableDto, @CurrentUser() user: CurrentUserPayload) {
    return this.diningTablesService.create(dto, user?.username);
  }

  @Get()
  @RequirePermissions('DINING_TABLE', 'readPerm')
  @ApiOperation({ summary: 'Retrieve paginated list of dining tables' })
  @ApiResponse({ status: 200, description: 'Paginated dining tables list' })
  async findAll(@Query() query: QueryDiningTableDto) {
    return this.diningTablesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('DINING_TABLE', 'readPerm')
  @ApiOperation({ summary: 'Get dining table details by ID' })
  @ApiResponse({ status: 200, description: 'Dining table details' })
  async findOne(@Param('id') id: string) {
    return this.diningTablesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('DINING_TABLE', 'updatePerm')
  @ApiOperation({ summary: 'Update dining table' })
  @ApiResponse({ status: 200, description: 'Dining table updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDiningTableDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.diningTablesService.update(id, dto, user?.username);
  }

  @Delete(':id')
  @RequirePermissions('DINING_TABLE', 'deletePerm')
  @ApiOperation({ summary: 'Delete dining table' })
  @ApiResponse({ status: 200, description: 'Dining table deleted' })
  async remove(@Param('id') id: string) {
    return this.diningTablesService.remove(id);
  }
}
