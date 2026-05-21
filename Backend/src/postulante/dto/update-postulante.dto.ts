import { PartialType } from '@nestjs/swagger';
import { CreatePostulanteDto } from './create-postulante.dto';

export class UpdatePostulanteDto extends PartialType(CreatePostulanteDto) {}
