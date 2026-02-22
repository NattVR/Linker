import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Alerts } from '../../shared/services/alerts';
import { Auth } from '../../shared/services/auth';
import { passwordValidator } from '../../validators/password-validator';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signup-empresas',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './signup-empresas.html',
  styleUrl: './signup-empresas.css',
})
export class SignupEmpresas {
  alert = inject(Alerts);
  auth = inject(Auth);
  fb = inject(FormBuilder);
  router = inject(Router);
  currentStep: number = 1;

  nextStep(): void {
    const nameControl = this.empresaForm.get('name_empresa');
    const nitControl = this.empresaForm.get('NIT');

    if (nameControl?.valid && nitControl?.valid) { // 2. Control de validación para los campos de empresa
      this.currentStep = 2;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  empresaForm = this.fb.group({
    name_empresa: ['', Validators.required],
    NIT: ['', Validators.required],
  });

  signupEmpresasForm = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      repassword: ['', Validators.required],
    },
    { validators: passwordValidator('password', 'repassword') }
  );

  onSignupEmpresa() {
    let user = this.signupEmpresasForm.value as User;
    let empresa = this.empresaForm.value as Empresa;

    if (this.signupEmpresasForm.hasError('passwordMismatch')) {
      this.alert.error('Las contraseñas no coinciden');
      return;
    }

    if (this.signupEmpresasForm.invalid || this.empresaForm.invalid) {
      this.alert.error('Campos incorrectos');
      return;
    }

    this.auth.signUp(user).subscribe({
      next: (response) => {
        if (response.success) {
          empresa.id_perfil = response.user.id;

          this.auth.signUpEmpresa(empresa).subscribe({
            next: (postresponse) => {
              if (postresponse) {
                this.alert.success('Registro exitoso. Por favor, inicie sesión.');
                this.router.navigate(['login']);
              }
            },
          });
        } else {
          this.alert.error(response.message);
        }
      },
      error: (error) => {
        console.error(error);
        this.alert.error('Error en la solicitud');
      },
    });
  }
}
