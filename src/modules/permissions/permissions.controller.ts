import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { BatchUpdatePermissionsDto } from './dto/update-permissions.dto';
import { QueryPermissionDto } from './dto/query-permission.dto';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Permissions Matrix')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermission('MASTER_MENUS', 'read')
  @ApiOperation({ summary: 'Retrieve paginated list of permissions' })
  @ApiResponse({ status: 200, description: 'Paginated permissions list' })
  async findAll(@Query() query: QueryPermissionDto) {
    return this.permissionsService.findAll(query);
  }

  @Get('usergroup/:usergroupId')
  @RequirePermission('MASTER_MENUS', 'read')
  @ApiOperation({ summary: 'Get all menu permissions for a specific usergroup' })
  @ApiResponse({ status: 200, description: 'List of permissions for group' })
  async findByUserGroup(@Param('usergroupId') usergroupId: string) {
    return this.permissionsService.findByUserGroup(usergroupId);
  }

  @Put('batch')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('MASTER_MENUS', 'update')
  @ApiOperation({ summary: 'Batch update permission matrix for a usergroup' })
  @ApiResponse({ status: 200, description: 'Permissions updated successfully' })
  async updateBatch(
    @Body() dto: BatchUpdatePermissionsDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.permissionsService.updateBatch(dto, user?.username);
  }
}
