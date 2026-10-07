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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { ApprovalTemplatesService } from './approval-templates.service';
import { CreateApprovalTemplateDto } from './dto/create-approval-template.dto';
import { QueryApprovalTemplateDto } from './dto/query-approval-template.dto';
import { UpdateApprovalTemplateDto } from './dto/update-approval-template.dto';

@ApiTags('Approval Templates')
@ApiBearerAuth()
@Controller('approvals/templates')
export class ApprovalTemplatesController {
  constructor(private readonly service: ApprovalTemplatesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create approval template with steps' })
  @ApiResponse({ status: 201, description: 'Approval template created' })
  async create(
    @Body() dto: CreateApprovalTemplateDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.create(dto, user?.username);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of approval templates' })
  @ApiResponse({ status: 200, description: 'List of approval templates' })
  async findAll(@Query() query: QueryApprovalTemplateDto) {
    return this.service.findAll(query);
  }

  @Get('lookups')
  @ApiOperation({ summary: 'Get approval lookup options (modules, usergroups, users, types)' })
  @ApiResponse({ status: 200, description: 'Approval lookups retrieved' })
  async getLookups() {
    return this.service.getLookups();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get approval template details' })
  @ApiResponse({ status: 200, description: 'Approval template detail' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update approval template and steps' })
  @ApiResponse({ status: 200, description: 'Approval template updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateApprovalTemplateDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.update(id, dto, user?.username);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete approval template' })
  @ApiResponse({ status: 200, description: 'Approval template deleted' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

