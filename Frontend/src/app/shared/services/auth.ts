import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  isLogged = signal(false);

  http = inject(HttpClient);

  apiUrl = environment.apiUrl;

  getUserType() {
    const isEmpresa = sessionStorage.getItem('isEmpresa');
    return isEmpresa === 'true';
  }

  getPerfilId(user: string) {
    return this.http.get(`${this.apiUrl}/user/perfil/${user}`);
  }

  signUp(user: User): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/registro`, user);
  }

  signUpPostulante(postulante: PerfilPostulanteModel): Observable<any> {
    return this.http.post(`${this.apiUrl}/postulante/registro`, postulante);
  }

  signUpEmpresa(empresa: Empresa): Observable<any> {
    return this.http.post(`${this.apiUrl}/empresa/registro`, empresa);
  }

  login(user: User): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/login`, user);
  }

  logout() {
    this.isLogged.set(false);
    sessionStorage.clear();
  }
}