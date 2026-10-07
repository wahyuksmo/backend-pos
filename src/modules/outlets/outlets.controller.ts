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
import { OutletsService } from './outlets.service';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';
import { QueryOutletDto } from './dto/query-outlet.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Master Outlets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('outlets')
export class OutletsController {
  constructor(private readonly outletsService: OutletsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('OUTLET', 'createPerm')
  @ApiOperation({ summary: 'Create new outlet' })
  @ApiResponse({ status: 201, description: 'Outlet successfully created' })
  async create(@Body() dto: CreateOutletDto, @CurrentUser() user: CurrentUserPayload) {
    return this.outletsService.create(dto, user?.username);
  }

  @Get()
  @RequirePermissions('OUTLET', 'readPerm')
  @ApiOperation({ summary: 'Retrieve paginated list of outlets' })
  @ApiResponse({ status: 200, description: 'Paginated outlets list' })
  async findAll(@Query() query: QueryOutletDto) {
    return this.outletsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('OUTLET', 'readPerm')
  @ApiOperation({ summary: 'Get outlet details by ID' })
  @ApiResponse({ status: 200, description: 'Outlet details' })
  async findOne(@Param('id') id: string) {
    return this.outletsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('OUTLET', 'updatePerm')
  @ApiOperation({ summary: 'Update outlet' })
  @ApiResponse({ status: 200, description: 'Outlet updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOutletDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.outletsService.update(id, dto, user?.username);
  }

  @Delete(':id')
  @RequirePermissions('OUTLET', 'deletePerm')
  @ApiOperation({ summary: 'Delete outlet' })
  @ApiResponse({ status: 200, description: 'Outlet deleted' })
  async remove(@Param('id') id: string) {
    return this.outletsService.remove(id);
  }
}
