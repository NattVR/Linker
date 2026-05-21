import { TipoInteraccion } from "../entities/interacciones.entity";
import { ApiProperty } from '@nestjs/swagger';

export class CreateInteraccioneDto {
    @ApiProperty({
        enum: TipoInteraccion,
        example: TipoInteraccion.LIKE,
        description: 'Accion de la empresa sobre el postulante',
    })
    accion_empresa: TipoInteraccion;

    @ApiProperty({
        enum: TipoInteraccion,
        example: TipoInteraccion.NO_INTERACCION,
        description: 'Accion del postulante sobre la vacante',
    })
    accion_postulante: TipoInteraccion;

    @ApiProperty({
        example: '7d8a8fe6-71c6-4b17-9e13-0058c30117cb',
        description: 'ID de la vacante',
    })
    vacante:string;

    @ApiProperty({
        example: '74e62d07-a20d-4be3-95f5-8d46db9e8f9a',
        description: 'ID del postulante',
    })
    postulante:string;

    @ApiProperty({
        example: 'f4f9bdf3-80a8-4f04-9f9a-e6e5c99f43b8',
        description: 'ID de la empresa',
    })
    empresa:string
}
 
