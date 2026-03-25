import { inject, Injectable } from '@angular/core';
import { Auth } from './auth';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, switchMap } from 'rxjs';

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


  updatePerfilEmpresa(id: string, datos: any): Observable<any> {
    return this.http.patch(`http://localhost:3000/empresa/${id}`, datos);
  }

  getIsEmpresa(id: string): Observable<{ isEmpresa: boolean }> {
    return this.http.get<{ isEmpresa: boolean }>(`http://localhost:3000/empresa/isEmpresa/${id}`);
  }

  getPostulanteByUserId(idUsuario: string) {
    return this.http.get(`http://localhost:3000/postulante/${idUsuario}`);
  }

  getUserNamePostulante(id: string): Observable<PerfilPostulanteResponse> {
    return this.http.get<PerfilPostulanteResponse>(`http://localhost:3000/postulante/${id}`);
  }

  getEmpresa(id: string): Observable<Empresa> {
    return this.http.get<Empresa>(`http://localhost:3000/empresa/${id}`);
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

  createVacante(vacante: CrearVacante): Observable<any> {
    return this.http.post('http://localhost:3000/vacantes', vacante);
  }

  getHabilidades(): Observable<Habilidad[]> {
    return this.http.get<Habilidad[]>('http://localhost:3000/habilidades');
  }

  getIdiomas(): Observable<any> {
    return this.http.get('http://localhost:3000/idiomas');
  }

  getCerticados(): Observable<any> {
    return this.http.get('http://localhost:3000/certificados')
  }

  createCertificado(certificado: CrearCertificadoEmpresa): Observable<any> {
    return this.http.post('http://localhost:3000/detalles-certificados', certificado)
  }

  getCertificadosOfEmpresa(idEmpresa: string): Observable<any> {
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

    const limpiar$ = this.http.delete(`http://localhost:3000/postulante/limpiar/${idUsuario}`);

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
    return this.http.get(`http://localhost:3000/postulante/perfil-completo/${id}`);
  }

  updateCertificado(id: string, datos: any): Observable<any> {
    return this.http.patch(`http://localhost:3000/detalles-certificados/${id}`, datos);
  }
  deleteCertificado(id: string): Observable<any> {
    return this.http.delete(`http://localhost:3000/detalles-certificados/${id}`);
  }
}