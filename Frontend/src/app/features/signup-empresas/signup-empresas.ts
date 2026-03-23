import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Alerts } from '../../shared/services/alerts';
import { Auth } from '../../shared/services/auth';
import { passwordValidator } from '../../validators/password-validator';
import { CommonModule } from '@angular/common';
import { LoggerService } from '../../shared/services/logger';

// 1
@Component({
  selector: 'app-signup-empresas',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './signup-empresas.html',
  styleUrl: './signup-empresas.css',
})
export class SignupEmpresas {
  // 2
  alert = inject(Alerts);
  auth = inject(Auth);
  fb = inject(FormBuilder);
  router = inject(Router);
  logger = inject(LoggerService);

  passwordMinLength = 6;
  currentStep = 1;

  nextStep(): void {
    const nameControl = this.empresaForm.get('name_empresa');
    const nitControl = this.empresaForm.get('NIT');

    if (nameControl?.valid && nitControl?.valid) {
      this.currentStep = 2;
    }
  }

  previousStep(): void {
    this.currentStep--;
  }

  empresaForm = this.fb.group({
    name_empresa: ['', Validators.required],
    NIT: ['', Validators.required],
  });

  signupEmpresasForm = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(this.passwordMinLength)]],
      repassword: ['', Validators.required],
    },
    { validators: passwordValidator('password', 'repassword') }
  );

  formsValidated(user: User, empresa: Empresa): boolean {
    if (this.signupEmpresasForm.hasError('passwordMismatch')) { // 4
      this.alert.error('Las contraseñas no coinciden'); // 5
      return false; // 6
    }

    if (this.signupEmpresasForm.invalid || this.empresaForm.invalid) { // 7
      this.alert.error('Campos incorrectos'); // 8
      return false; // 9
    }

    return true;
  }

  onSignupEmpresa(): void {
    // 3
    const user = this.signupEmpresasForm.value as User;
    const empresa = this.empresaForm.value as Empresa;

    if (!this.formsValidated(user, empresa)) {// 4
      return; // 5
    };

    this.registrarUsuario(user, empresa); // 6
  }

  private registrarUsuario(user: User, empresa: Empresa): void {
    this.auth.signUp(user).subscribe({ // 3
      next: response => {
        if (response.success) { // 4
          this.registrarEmpresa(response.user.id, empresa); // 5
        } else {
          this.alert.error(response.message); // 6
        }
      },
      error: error => this.logger.error('Error en el registro de usuario', error) // 7
    });
  }

  private registrarEmpresa(idPerfil: string, empresa: Empresa): void {
    empresa.id_perfil = idPerfil; // 3
    this.auth.signUpEmpresa(empresa).subscribe({ // 4
      next: postresponse => {
        if (postresponse) { // 5
          this.alert.success('Registro exitoso. Por favor, inicie sesión.'); // 6
          this.router.navigate(['login']); // 7
        } else {
          this.alert.error('No se pudo completar el registro de la empresa.'); // 8
        }
      },
      error: error => this.logger.error('Error en el registro de empresa', error) // 9
    });
  }
}
