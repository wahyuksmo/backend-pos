import { PartialType } from '@nestjs/swagger';
import { CreateApprovalTemplateDto } from './create-approval-template.dto';

export class UpdateApprovalTemplateDto extends PartialType(CreateApprovalTemplateDto) {}

