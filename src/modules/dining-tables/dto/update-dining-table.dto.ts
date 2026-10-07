import { PartialType } from '@nestjs/swagger';
import { CreateDiningTableDto } from './create-dining-table.dto';

export class UpdateDiningTableDto extends PartialType(CreateDiningTableDto) {}
