import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { ApprovalsService } from './approvals.service';
import { ApprovalActionDto } from './dto/approval-action.dto';
import { InitiateApprovalDto } from './dto/initiate-approval.dto';

@ApiTags('Approval Transactions Engine')
@ApiBearerAuth()
@Controller('approvals/transactions')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initiate approval process for an object' })
  @ApiResponse({ status: 201, description: 'Approval initiated' })
  async initiate(
    @Body() dto: InitiateApprovalDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.approvalsService.initiateApproval({
      objectCode: dto.objectCode,
      objectId: dto.objectId,
      amount: dto.amount,
      requestedByUserId: dto.requestedByUserId,
      initiatedBy: user?.username,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get approval transaction status and step history' })
  @ApiResponse({ status: 200, description: 'Approval transaction status' })
  async getStatus(@Param('id') id: string) {
    return this.approvalsService.getStatus(id);
  }

  @Get('object/:objectCode/:objectId')
  @ApiOperation({ summary: 'Get approval history by target object' })
  @ApiResponse({ status: 200, description: 'Approval history by object' })
  async getHistoryByObject(
    @Param('objectCode') objectCode: string,
    @Param('objectId') objectId: string,
  ) {
    return this.approvalsService.getHistoryByObject(objectCode, objectId);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve current step' })
  @ApiResponse({ status: 200, description: 'Approved' })
  async approve(
    @Param('id') id: string,
    @Body() dto: ApprovalActionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.approvalsService.approve({
      approvalId: id,
      userId: user.userId,
      notes: dto.notes,
    });
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject current step' })
  @ApiResponse({ status: 200, description: 'Rejected' })
  async reject(
    @Param('id') id: string,
    @Body() dto: ApprovalActionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.approvalsService.reject({
      approvalId: id,
      userId: user.userId,
      notes: dto.notes || 'Rejected',
    });
  }

  @Post(':id/revise')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request revision on current step' })
  @ApiResponse({ status: 200, description: 'Revision requested' })
  async revise(
    @Param('id') id: string,
    @Body() dto: ApprovalActionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.approvalsService.revise({
      approvalId: id,
      userId: user.userId,
      notes: dto.notes || 'Revision required',
    });
  }

  @Post(':id/resubmit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resubmit revised transaction back to step 1' })
  @ApiResponse({ status: 200, description: 'Resubmitted' })
  async resubmit(
    @Param('id') id: string,
    @Body() dto: ApprovalActionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.approvalsService.resubmit(id, user.userId, dto.notes);
  }
}

