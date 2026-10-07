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
import { MenusService } from './menus.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { QueryMenuDto } from './dto/query-menu.dto';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Menus & Navigation')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('MASTER_MENUS', 'create')
  @ApiOperation({ summary: 'Create menu item' })
  @ApiResponse({ status: 201, description: 'Menu created' })
  async create(
    @Body() dto: CreateMenuDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.menusService.create(dto, user?.username);
  }

  @Get()
  @RequirePermission('MASTER_MENUS', 'read')
  @ApiOperation({ summary: 'Retrieve paginated flat list of menus' })
  @ApiResponse({ status: 200, description: 'Paginated menu list' })
  async findAll(@Query() query: QueryMenuDto) {
    return this.menusService.findAll(query);
  }

  @Get('tree')
  @RequirePermission('MASTER_MENUS', 'read')
  @ApiOperation({ summary: 'Get entire system menu hierarchy tree' })
  @ApiResponse({ status: 200, description: 'Hierarchical tree' })
  async getTree() {
    return this.menusService.getTree();
  }

  @Get('navigation')
  @ApiOperation({ summary: 'Get hierarchical navigation tree permitted for authenticated user' })
  @ApiResponse({ status: 200, description: 'User navigation tree' })
  async getUserNavigation(@CurrentUser() user: CurrentUserPayload) {
    const isSuperAdmin = user.usergroupCode === 'SUPERADMIN';
    return this.menusService.getUserMenuTree(user.usergroupId, isSuperAdmin);
  }

  @Get(':id')
  @RequirePermission('MASTER_MENUS', 'read')
  @ApiOperation({ summary: 'Get single menu details with sub-menus' })
  @ApiResponse({ status: 200, description: 'Menu details' })
  async findOne(@Param('id') id: string) {
    return this.menusService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('MASTER_MENUS', 'update')
  @ApiOperation({ summary: 'Update menu item' })
  @ApiResponse({ status: 200, description: 'Menu updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMenuDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.menusService.update(id, dto, user?.username);
  }

  @Delete(':id')
  @RequirePermission('MASTER_MENUS', 'delete')
  @ApiOperation({ summary: 'Delete menu item' })
  @ApiResponse({ status: 200, description: 'Menu deleted' })
  async remove(@Param('id') id: string) {
    return this.menusService.remove(id);
  }
}
