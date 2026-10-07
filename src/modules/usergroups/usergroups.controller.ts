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
import { UsergroupsService } from './usergroups.service';
import { CreateUserGroupDto } from './dto/create-usergroup.dto';
import { UpdateUserGroupDto } from './dto/update-usergroup.dto';
import { QueryUserGroupDto } from './dto/query-usergroup.dto';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('User Groups (Roles)')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@Controller('usergroups')
export class UsergroupsController {
  constructor(private readonly usergroupsService: UsergroupsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('MASTER_USERS', 'create')
  @ApiOperation({ summary: 'Create usergroup / role' })
  @ApiResponse({ status: 201, description: 'Usergroup created' })
  async create(
    @Body() dto: CreateUserGroupDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.usergroupsService.create(dto, user?.username);
  }

  @Get()
  @RequirePermission('MASTER_USERS', 'read')
  @ApiOperation({ summary: 'Retrieve paginated list of usergroups' })
  @ApiResponse({ status: 200, description: 'Paginated usergroups list' })
  async findAll(@Query() query: QueryUserGroupDto) {
    return this.usergroupsService.findAll(query);
  }

  @Get(':id')
  @RequirePermission('MASTER_USERS', 'read')
  @ApiOperation({ summary: 'Get usergroup details with users and permissions' })
  @ApiResponse({ status: 200, description: 'Usergroup details' })
  async findOne(@Param('id') id: string) {
    return this.usergroupsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('MASTER_USERS', 'update')
  @ApiOperation({ summary: 'Update usergroup' })
  @ApiResponse({ status: 200, description: 'Usergroup updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserGroupDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.usergroupsService.update(id, dto, user?.username);
  }

  @Delete(':id')
  @RequirePermission('MASTER_USERS', 'delete')
  @ApiOperation({ summary: 'Delete usergroup' })
  @ApiResponse({ status: 200, description: 'Usergroup deleted' })
  async remove(@Param('id') id: string) {
    return this.usergroupsService.remove(id);
  }
}
