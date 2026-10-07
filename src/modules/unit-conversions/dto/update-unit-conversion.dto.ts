import { PartialType } from '@nestjs/swagger';
import { CreateUnitConversionDto } from './create-unit-conversion.dto';

export class UpdateUnitConversionDto extends PartialType(CreateUnitConversionDto) {}
