import { inject, Injectable } from '@angular/core';
import { Auth } from './auth';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, switchMap } from 'rxjs';
import { ConfigService } from '../../core/services/config.service';

interface PerfilPostulanteResponse {
  name: string;
  lastname: string;
}

@Injectable({
  providedIn: 'root',
})
export class Perfil {

  private config = inject(ConfigService);
  
  get apiUrl() {
    return this.config.apiUrl;
  }

  updateVacante(id: string, data: any) {
    return this.http.put(`${this.apiUrl}/vacantes/${id}`, data);
  }
  auth = inject(Auth);
  http = inject(HttpClient);


  updatePerfilEmpresa(id: string, datos: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/empresa/${id}`, datos);
  }

  getIsEmpresa(id: string): Observable<{ isEmpresa: boolean }> {
    return this.http.get<{ isEmpresa: boolean }>(`${this.apiUrl}/empresa/isEmpresa/${id}`);
  }

  getPostulanteByUserId(idUsuario: string) {
    return this.http.get(`${this.apiUrl}/postulante/${idUsuario}`);
  }

  getUserNamePostulante(id: string): Observable<PerfilPostulanteResponse> {
    return this.http.get<PerfilPostulanteResponse>(`${this.apiUrl}/postulante/${id}`);
  }

  getEmpresa(id: string): Observable<Empresa> {
    return this.http.get<Empresa>(`${this.apiUrl}/empresa/${id}`);
  }

  getCatalogoHabilidades(): Observable<any> {
    return this.http.get(`${this.apiUrl}/habilidades`);
  }

  getCatalogoIdiomas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/idiomas`);
  }

  getCatalogosPostulante(): Observable<any> {
    return forkJoin({
      habilidades: this.getCatalogoHabilidades(),
      idiomas: this.getCatalogoIdiomas(),
    });
  }

  createVacante(vacante: CrearVacante): Observable<any> {
    return this.http.post(`${this.apiUrl}/vacantes`, vacante);
  }

  getHabilidades(): Observable<Habilidad[]> {
    return this.http.get<Habilidad[]>(`${this.apiUrl}/habilidades`);
  }

  getIdiomas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/idiomas`);
  }

  getCerticados(): Observable<any> {
    return this.http.get(`${this.apiUrl}/certificados`);
  }

  createCertificado(certificado: CrearCertificadoEmpresa): Observable<any> {
    return this.http.post(`${this.apiUrl}/detalles-certificados`, certificado);
  }

  getCertificadosOfEmpresa(idEmpresa: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/detalles-certificados/empresa/${idEmpresa}`);
  }

  crearEstudio(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/estudios`, datos);
  }

  crearDetalleEstudios(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/detalle-estudios`, datos);
  }

  crearDetalleCertificados(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/detalles-certificados`, datos);
  }

  crearPostulanteHabilidad(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/postulante-habilidades`, datos);
  }

  crearPostulanteIdioma(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/postulante-idiomas`, datos);
  }

  actualizarPostulante(id: string, datos: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/postulante/${id}`, datos);
  }

  guardarPerfilPostulante(idUsuario: string, datosFormulario: any): Observable<any> {
    const actualizarPostulante$ = this.actualizarPostulante(idUsuario, {
      experiencia: datosFormulario.experiencia,
      cv: datosFormulario.cv,
    });

    const limpiar$ = this.http.delete(`${this.apiUrl}/postulante/limpiar/${idUsuario}`);

    const detalleEstudios$ = datosFormulario.estudios.map((estudio: any) =>
      this.crearEstudio({ titulo: estudio.titulo, nivel: estudio.nivel }).pipe(
        switchMap((estResp: any) => {
          const idEstudio = estResp?.id_estudio || estResp?.id;
          if (!idEstudio) throw new Error('No se obtuvo el id del estudio creado');
          return this.crearDetalleEstudios({
            postulante: { id_postulante: idUsuario },
            estudio: { id_estudio: idEstudio },
            certificado: estudio.certificado
          });
        })
      )
    );

    const postulanteHabilidades$ = datosFormulario.habilidades.map((habilidad: any) =>
      this.crearPostulanteHabilidad({
        postulante: { id_postulante: idUsuario },
        habilidades: { id_habilidad: habilidad.id },
        certificado: habilidad.certificado,
      })
    );

    const postulanteIdiomas$ = datosFormulario.idiomas.map((idioma: any) =>
      this.crearPostulanteIdioma({
        postulante: { id_postulante: idUsuario },
        idioma: { id_idioma: idioma.id },
        certificado: idioma.certificado,
      })
    );

    return actualizarPostulante$.pipe(
      switchMap(() => limpiar$),
      switchMap(() => forkJoin([
        ...detalleEstudios$,
        ...postulanteHabilidades$,
        ...postulanteIdiomas$,
      ] as Observable<any>[]))
    );

  }


  getPerfilCompleto(id: string) {
    return this.http.get(`${this.apiUrl}/postulante/perfil-completo/${id}`);
  }

  updateCertificado(id: string, datos: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/detalles-certificados/${id}`, datos);
  }
  deleteCertificado(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/detalles-certificados/${id}`);
  }
}