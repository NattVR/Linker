import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { switchMap } from 'rxjs';
import { Alerts } from '../../shared/services/alerts';
import { Auth } from '../../shared/services/auth';
import { Perfil } from '../../shared/services/perfil';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  alert = inject(Alerts);
  auth = inject(Auth);
  fb = inject(FormBuilder);
  router = inject(Router);
  profile = inject(Perfil);

  loginForm = this.fb.group({
    email: ['', [Validators.email, Validators.required]],
    password: ['', [Validators.required]],
  });

  onLogin() {
    const user = this.loginForm.value as User;

    this.auth.login(user).pipe(
      switchMap((response) => {
        this.handleLoginSuccess(response);
        return this.profile.getIsEmpresa(response.user.id);
      }),
      switchMap((isEmpresa: any) => {
        sessionStorage.setItem('isEmpresa', isEmpresa);
        const id = sessionStorage.getItem('userId')!;
        return this.auth.getPerfilId(id);
      })
    ).subscribe({
      next: (perfilData: any) => {
        sessionStorage.setItem('perfilId', perfilData.id);
        this.router.navigate(['match']);
      },
      error: (err) => {
        console.error(err);
        this.alert.error('Error en la solicitud');
      }
    });
  }

  private handleLoginSuccess(response: any) {
    if (!response.success) {
      throw new Error(response.message);
    }
    this.alert.success(response.message);
    this.auth.isLogged.set(true);
    sessionStorage.setItem('token', response.token);
    sessionStorage.setItem('userId', response.user.id);
  }
}