import { Module } from '@nestjs/common';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';
import { ApprovalTemplatesController } from './approval-templates.controller';
import { ApprovalTemplatesService } from './approval-templates.service';

@Module({
  controllers: [ApprovalTemplatesController, ApprovalsController],
  providers: [ApprovalTemplatesService, ApprovalsService],
  exports: [ApprovalsService, ApprovalTemplatesService],
})
export class ApprovalsModule {}

