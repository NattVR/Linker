import { inject, Injectable } from '@angular/core';
import { v4 as uuid4 } from 'uuid';
import { Auth } from './auth';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, forkJoin, Observable, of, switchMap } from 'rxjs';

interface PerfilPostulanteResponse {
  name: string;
  lastname: string;
}

@Injectable({
  providedIn: 'root',
})
export class Perfil {
  updateVacante(id: string, data: any) {
  return this.http.put(`http://localhost:3000/vacantes/${id}`, data);
  }
  auth = inject(Auth);
  http = inject(HttpClient);

  getIsEmpresa(id: string): Observable<{ isEmpresa: boolean }> {
    return this.http.get<{ isEmpresa: boolean }>(`http://localhost:3000/empresa/isEmpresa/${id}`);
  }

  getPostulanteByUserId(idUsuario: string) {
    return this.http.get(`http://localhost:3000/postulante/${idUsuario}`);
  }

  getUserNamePostulante(id: string): Observable<PerfilPostulanteResponse> {
    return this.http.get<PerfilPostulanteResponse>(`http://localhost:3000/postulante/${id}`);
  }

  getUserNameEmpresa(id: string): Observable<{ name: string }> {
    return this.http.get<{ name: string }>(`http://localhost:3000/empresa/${id}`);
  }

  getCatalogoHabilidades(): Observable<any> {
    return this.http.get(`http://localhost:3000/habilidades`);
  }

  getCatalogoIdiomas(): Observable<any> {
    return this.http.get(`http://localhost:3000/idiomas`);
  }

  getCatalogosPostulante(): Observable<any> {
    return forkJoin({
      habilidades: this.getCatalogoHabilidades(),
      idiomas: this.getCatalogoIdiomas(),
    });
  }

  createVacante(vacante:CrearVacante): Observable<any> {
    console.log(vacante,'desde service')
    return this.http.post('http://localhost:3000/vacantes', vacante);
  }

  getHabilidades(): Observable<Habilidad[]> {
    return this.http.get<Habilidad[]>('http://localhost:3000/habilidades');
  }

  getIdiomas():Observable<any>{
    return this.http.get('http://localhost:3000/idiomas');
  }

  getCerticados():Observable<any>{
    return this.http.get('http://localhost:3000/certificados')
  }

  createCertificado(certificado: CrearCertificadoEmpresa): Observable<any>{
    return this.http.post('http://localhost:3000/detalles-certificados', certificado)
  }

  getCertificadosOfEmpresa(idEmpresa:string): Observable<any>{
    return this.http.get(`http://localhost:3000/detalles-certificados/empresa/${idEmpresa}`)
  }

  crearEstudio(datos: any): Observable<any> {
    return this.http.post(`http://localhost:3000/estudios`, datos);
  }

  crearDetalleEstudios(datos: any): Observable<any> {
    return this.http.post(`http://localhost:3000/detalle-estudios`, datos);
  }

  crearDetalleCertificados(datos: any): Observable<any> {
    return this.http.post(`http://localhost:3000/detalles-certificados`, datos);
  }

  crearPostulanteHabilidad(datos: any): Observable<any> {
    return this.http.post(`http://localhost:3000/postulante-habilidades`, datos);
  }

  crearPostulanteIdioma(datos: any): Observable<any> {
    return this.http.post(`http://localhost:3000/postulante-idiomas`, datos);
  }

  actualizarPostulante(id: string, datos: any): Observable<any> {
    return this.http.patch(`http://localhost:3000/postulante/${id}`, datos);
  }

  guardarPerfilPostulante(idUsuario: string, datosFormulario: any): Observable<any> {
    const actualizarPostulante$ = this.actualizarPostulante(idUsuario, {
      experiencia: datosFormulario.experiencia,
      cv: datosFormulario.cv,
    });
    
    const detalleEstudios$ = datosFormulario.estudios.map((estudio: any) => {
      const estudioPayload = {
        titulo: estudio.titulo,
        nivel: estudio.nivel,
      };

      return this.crearEstudio(estudioPayload).pipe(
        switchMap((estResp: any) => {
          const idEstudio = estResp?.id_estudio || estResp?.id || estResp?.estudioId;
          if (!idEstudio) {
            throw new Error('No se obtuvo el id del estudio creado');
          }

          const detallePayload = {
            postulante: { id_postulante: idUsuario },
            estudio: { id_estudio: idEstudio },
            certificado: estudio.certificado
          };

          return this.crearDetalleEstudios(detallePayload);
        })
      );
    });

    const postulanteHabilidades$ = datosFormulario.habilidades.map((habilidad: any) => {
      const habilidadPayload = {
        postulante: { id_postulante: idUsuario },
        habilidades: { id_habilidad: habilidad.id },
        certificado: habilidad.certificado, 
      };

      return this.crearPostulanteHabilidad(habilidadPayload);
    });
    
    const postulanteIdiomas$ = datosFormulario.idiomas.map((idioma: any) => {
      const idiomaPayload = {
        postulante: { id_postulante: idUsuario },
        idioma: { id_idioma: idioma.id },
        certificado: idioma.certificado , 
      };

      return this.crearPostulanteIdioma(idiomaPayload);
    });

    return actualizarPostulante$.pipe(
      switchMap(() =>
        forkJoin([
          ...detalleEstudios$,
          ...postulanteHabilidades$,
          ...postulanteIdiomas$,
        ])
      )
    );
  }

  /*guardarPerfil(perfil: PerfilPostulanteModel| PerfilEmpresaModel) {
    let user= this.auth.getUser()
    if(user){
      let userData= localStorage.getItem(user)
      if(userData){
        let parsedUser = JSON.parse(userData);
        parsedUser.perfil= perfil;
        localStorage.setItem(user, JSON.stringify(parsedUser));
        return{success:true , message:'Usuario registrado exitosamente'}
      }
      return{success:false , message:'Usuario no encontrado'}
    }  

    return{success:false , message:'Usuario np encontrado :)'}
  }*/
}