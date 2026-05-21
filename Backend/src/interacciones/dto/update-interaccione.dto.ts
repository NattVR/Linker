import { PartialType } from '@nestjs/swagger';
import { CreateInteraccioneDto } from './create-interaccione.dto';

export class UpdateInteraccioneDto extends PartialType(CreateInteraccioneDto) {}
