import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../shared/services/auth';
import { Alerts } from '../../shared/services/alerts';
import { passwordValidator } from '../../validators/password-validator';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  private readonly alert = inject(Alerts);
  private readonly auth = inject(Auth);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  currentStep = 1;

  readonly signupForm = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      repassword: ['', [Validators.required]],
    },
    { validators: passwordValidator('password', 'repassword') }
  );

  readonly postulanteForm = this.fb.group({
    name: ['', Validators.required],
    lastname: ['', Validators.required],
  });

   nextStep(): void {
    if (this.postulanteForm.invalid) {
      this.postulanteForm.markAllAsTouched();
      this.alert.error('Por favor, complete todos los campos requeridos');
    }
    else{
    this.currentStep = 2;
  }
  }

  previousStep(): void {
    this.currentStep = 1;
  }


  private validateForms(): boolean {
    if (this.signupForm.hasError('passwordMismatch')) {
      this.alert.error('Las contraseñas no coinciden');
      return false;
    }

    if (this.signupForm.invalid || this.postulanteForm.invalid) {
      this.signupForm.markAllAsTouched();
      this.postulanteForm.markAllAsTouched();
      this.alert.error('Campos incorrectos');
      return false;
    }

    return true;
  }

  private signUpUser(user: User): void {
    
    this.auth.signUp(user).subscribe({
      next: (response) => {
        if (response.success){
          let postulante = this.postulanteForm.value as PerfilPostulanteModel;
          postulante.id_perfil = response.user.id;
          this.signUpPostulante(postulante);
        }
        else{        
          this.alert.error(response.message);
        }
      },
      error: (error) => {
        this.alert.error('Error en el registro', error);
      },
    });
  }

  private signUpPostulante(postulante: PerfilPostulanteModel): void {
    this.auth.signUpPostulante(postulante).subscribe({
      next: () => {
        this.alert.success('Registro exitoso. Por favor, inicie sesión.');
        this.router.navigate(['login']);
      },
      error: (error) => {
        this.alert.error('Error en el registro', error);
      },
    });
  }   
        
  onSignUp() {
    if (!this.validateForms()) return;
    let user = this.signupForm.value as User;
    this.signUpUser(user);
  }

}
