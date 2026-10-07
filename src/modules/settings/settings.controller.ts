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
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { QuerySettingDto } from './dto/query-setting.dto';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('System Settings')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('ADMIN_SETTINGS', 'create')
  @ApiOperation({ summary: 'Create system setting' })
  @ApiResponse({ status: 201, description: 'Setting created' })
  async create(
    @Body() dto: CreateSettingDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.settingsService.create(dto, user?.username);
  }

  @Get()
  @RequirePermission('ADMIN_SETTINGS', 'read')
  @ApiOperation({ summary: 'Retrieve paginated list of system settings' })
  @ApiResponse({ status: 200, description: 'Paginated settings list' })
  async findAll(@Query() query: QuerySettingDto) {
    return this.settingsService.findAll(query);
  }

  @Get(':id')
  @RequirePermission('ADMIN_SETTINGS', 'read')
  @ApiOperation({ summary: 'Get setting details by ID or Key' })
  @ApiResponse({ status: 200, description: 'Setting details' })
  async findOne(@Param('id') id: string) {
    return this.settingsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('ADMIN_SETTINGS', 'update')
  @ApiOperation({ summary: 'Update system setting' })
  @ApiResponse({ status: 200, description: 'Setting updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSettingDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.settingsService.update(id, dto, user?.username);
  }

  @Delete(':id')
  @RequirePermission('ADMIN_SETTINGS', 'delete')
  @ApiOperation({ summary: 'Delete system setting' })
  @ApiResponse({ status: 200, description: 'Setting deleted' })
  async remove(@Param('id') id: string) {
    return this.settingsService.remove(id);
  }
}

