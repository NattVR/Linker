import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from '../../core/services/config.service';

@Injectable({
  providedIn: 'root',
})
export class Match {
  http = inject(HttpClient);

  private config = inject(ConfigService);

  get apiUrl() {
    return this.config.apiUrl;
  }

  get perfil() {
    return sessionStorage.getItem('perfilId');
  }

  get user() {
    return sessionStorage.getItem('userId');
  }

  get isEmpresa() {
    return sessionStorage.getItem('isEmpresa');
  }

  getVacantesForEmpresa(): Observable<any> {
    console.log('desde getvacantesempresafront', this.perfil);
    return this.http.get(`${this.apiUrl}/vacantes/empresaId/${this.perfil}`);
  }

  getVacantes(): Observable<any> {
    if (!this.perfil) {
      console.warn('No hay perfil en sesión');
    }
    return this.http.get(`${this.apiUrl}/vacantes/vacantes/${this.perfil}`);
  }

  getPostulantes(vacanteId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/postulante/postulantes/${vacanteId}`);
  }

  onAction(interaccion: Interaccion): Observable<any> {
    if (!this.perfil) {
      console.warn(' No hay perfil en sesión');
    }
    return this.http.post(`${this.apiUrl}/interacciones`, interaccion);
  }

  onLike() {
    if (this.isEmpresa) {
      console.log('like Empresa');
    } else {
      console.log('Like User');
    }
  }

  onDislike() {
    if (this.isEmpresa) {
      console.log('dislke Empresa');
    } else {
      console.log('dislike User');
    }
  }
}
