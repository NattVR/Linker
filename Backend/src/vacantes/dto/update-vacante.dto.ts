import { PartialType } from '@nestjs/swagger';
import { CreateVacanteDto } from './create-vacante.dto';

export class UpdateVacanteDto extends PartialType(CreateVacanteDto) {}
