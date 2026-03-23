import { TipoInteraccion } from "../entities/interacciones.entity";

export class CreateInteraccioneDto {
    //interaccion:TipoInteraccion;
    accion_empresa: TipoInteraccion;
    accion_postulante: TipoInteraccion;
    vacante:string;
    postulante:string;
    empresa:string
}
 