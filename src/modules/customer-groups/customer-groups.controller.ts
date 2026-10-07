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
import { CustomerGroupsService } from './customer-groups.service';
import { CreateCustomerGroupDto } from './dto/create-customer-group.dto';
import { UpdateCustomerGroupDto } from './dto/update-customer-group.dto';
import { QueryCustomerGroupDto } from './dto/query-customer-group.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Master Customer Groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('customer-groups')
export class CustomerGroupsController {
  constructor(private readonly customerGroupsService: CustomerGroupsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('CUSTOMER_GROUP', 'createPerm')
  @ApiOperation({ summary: 'Create new customer group' })
  @ApiResponse({ status: 201, description: 'Customer group successfully created' })
  async create(@Body() dto: CreateCustomerGroupDto, @CurrentUser() user: CurrentUserPayload) {
    return this.customerGroupsService.create(dto, user?.username);
  }

  @Get()
  @RequirePermissions('CUSTOMER_GROUP', 'readPerm')
  @ApiOperation({ summary: 'Retrieve paginated list of customer groups' })
  @ApiResponse({ status: 200, description: 'Paginated customer groups list' })
  async findAll(@Query() query: QueryCustomerGroupDto) {
    return this.customerGroupsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('CUSTOMER_GROUP', 'readPerm')
  @ApiOperation({ summary: 'Get customer group details by ID' })
  @ApiResponse({ status: 200, description: 'Customer group details' })
  async findOne(@Param('id') id: string) {
    return this.customerGroupsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('CUSTOMER_GROUP', 'updatePerm')
  @ApiOperation({ summary: 'Update customer group' })
  @ApiResponse({ status: 200, description: 'Customer group updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerGroupDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.customerGroupsService.update(id, dto, user?.username);
  }

  @Delete(':id')
  @RequirePermissions('CUSTOMER_GROUP', 'deletePerm')
  @ApiOperation({ summary: 'Delete customer group' })
  @ApiResponse({ status: 200, description: 'Customer group deleted' })
  async remove(@Param('id') id: string) {
    return this.customerGroupsService.remove(id);
  }
}
