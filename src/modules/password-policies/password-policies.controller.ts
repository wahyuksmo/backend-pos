import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PasswordPoliciesService } from './password-policies.service';
import { UpdatePasswordPolicyDto } from './dto/update-password-policy.dto';
import { QueryPasswordPolicyDto } from './dto/query-password-policy.dto';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Password Policy Rules')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@Controller('password-policies')
export class PasswordPoliciesController {
  constructor(private readonly policiesService: PasswordPoliciesService) {}

  @Get()
  @RequirePermission('MASTER_PASSWORD_POLICY', 'read')
  @ApiOperation({ summary: 'Retrieve paginated list of active password policies' })
  @ApiResponse({ status: 200, description: 'Paginated list of password policies' })
  async findAll(@Query() query: QueryPasswordPolicyDto) {
    return this.policiesService.findAll(query);
  }

  @Get(':id')
  @RequirePermission('MASTER_PASSWORD_POLICY', 'read')
  @ApiOperation({ summary: 'Get password policy by ID' })
  @ApiResponse({ status: 200, description: 'Policy details' })
  async findOne(@Param('id') id: string) {
    return this.policiesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('MASTER_PASSWORD_POLICY', 'update')
  @ApiOperation({ summary: 'Update password policy configuration' })
  @ApiResponse({ status: 200, description: 'Policy updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePasswordPolicyDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.policiesService.update(id, dto, user?.username);
  }
}
