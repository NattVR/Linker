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

    if (nameControl?.valid && nitControl?.valid) { 
      this.currentStep = 2;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep;
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
    } //1 y 2 
    
    if (this.signupEmpresasForm.invalid || this.empresaForm.invalid) {
      this.alert.error('Campos incorrectos');
      return;
    } // 3-4

    this.auth.signUp(user).subscribe({
      next: (response) => { //5
        if (response.success) {
          empresa.id_perfil = response.user.id;// como pruebo if

          this.auth.signUpEmpresa(empresa).subscribe({
            next: (postresponse) => {//6
              if (postresponse) { 
                this.alert.success('Registro exitoso. Por favor, inicie sesión.');
                this.router.navigate(['login']);
              }
            },
          });
        } else {//7
          this.alert.error(response.message);
        } //8 error backend
      },
      error: (error) => { //9
        console.error(error);
        this.alert.error('Error en la solicitud');
      },
    });
  }
}
