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
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { QueryUnitDto } from './dto/query-unit.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Master Units')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('UNIT', 'createPerm')
  @ApiOperation({ summary: 'Create new unit' })
  @ApiResponse({ status: 201, description: 'Unit successfully created' })
  async create(@Body() dto: CreateUnitDto, @CurrentUser() user: CurrentUserPayload) {
    return this.unitsService.create(dto, user?.username);
  }

  @Get()
  @RequirePermissions('UNIT', 'readPerm')
  @ApiOperation({ summary: 'Retrieve paginated list of units' })
  @ApiResponse({ status: 200, description: 'Paginated units list' })
  async findAll(@Query() query: QueryUnitDto) {
    return this.unitsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('UNIT', 'readPerm')
  @ApiOperation({ summary: 'Get unit details by ID' })
  @ApiResponse({ status: 200, description: 'Unit details' })
  async findOne(@Param('id') id: string) {
    return this.unitsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('UNIT', 'updatePerm')
  @ApiOperation({ summary: 'Update unit' })
  @ApiResponse({ status: 200, description: 'Unit updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUnitDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.unitsService.update(id, dto, user?.username);
  }

  @Delete(':id')
  @RequirePermissions('UNIT', 'deletePerm')
  @ApiOperation({ summary: 'Delete unit' })
  @ApiResponse({ status: 200, description: 'Unit deleted' })
  async remove(@Param('id') id: string) {
    return this.unitsService.remove(id);
  }
}
