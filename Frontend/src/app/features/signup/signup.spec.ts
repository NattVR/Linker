import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Signup } from './signup';
import { Alerts } from '../../shared/services/alerts';
import { Auth } from '../../shared/services/auth';

describe('Signup', () => {
  let component: Signup;
  let fixture: ComponentFixture<Signup>;
  let authSpy: jasmine.SpyObj<Auth>;
  let alertsSpy: jasmine.SpyObj<Alerts>;
  let router: Router;
  let navigateSpy: jasmine.Spy;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<Auth>('Auth', ['signUp', 'signUpPostulante']);
    alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['error', 'success']);

    await TestBed.configureTestingModule({
      imports: [Signup],
      providers: [
        provideRouter([]),
        { provide: Auth, useValue: authSpy },
        { provide: Alerts, useValue: alertsSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Signup);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  function setValidCredentials(): void {
    component.signupForm.setValue({
      email: 'test@mail.com',
      password: 'abc12345678',
      repassword: 'abc12345678',
    });
  }

  function setValidPostulante(): void {
    component.postulanteForm.setValue({
      name: 'Juan',
      lastname: 'Perez',
    });
  }

  function setValidForms(): void {
    setValidCredentials();
    setValidPostulante();
  }

  describe('nextStep', () => {
    it('moves to step 2 postulante form is valid', () => {
     
      setValidPostulante();

      component.nextStep();

      expect(component.currentStep).toBe(2);
      expect(alertsSpy.error).not.toHaveBeenCalled();
    });

    it('se queda en step 1, marks fields as touched y error postulante form is invalid', () => {

      component.postulanteForm.setValue({
        name: '',
        lastname: '',
      });

      component.nextStep();

      expect(component.currentStep).toBe(1);
      expect(component.postulanteForm.get('name')?.touched).toBeTrue();
      expect(component.postulanteForm.get('lastname')?.touched).toBeTrue();
      expect(alertsSpy.error).toHaveBeenCalledWith('Por favor, complete todos los campos requeridos');
    });
  });

  describe('previousStep', () => {
    it('returns to step 1', () => {
     
      component.currentStep = 2;

      component.previousStep();

      expect(component.currentStep).toBe(1);
    });
  });

  describe('onSignUp', () => {
    it('stops the flow when passwords missmatch', () => {
      component.signupForm.setValue({
        email: 'test@mail.com',
        password: 'abc12345678',
        repassword: 'different-password',
      });
      setValidPostulante();

      component.onSignUp();

      expect(component.signupForm.hasError('passwordMismatch')).toBeTrue();
      expect(alertsSpy.error).toHaveBeenCalledWith(jasmine.stringMatching(/^Las contrase/));
      expect(authSpy.signUp).not.toHaveBeenCalled();
    });

    it(' para cuando form is invalid and marks controls as touched', () => {
      component.signupForm.setValue({
        email: '',
        password: 'abc12345678',
        repassword: 'abc12345678',
      });
      component.postulanteForm.setValue({
        name: '',
        lastname: 'Perez',
      });

      component.onSignUp();

      expect(component.signupForm.get('email')?.touched).toBeTrue();
      expect(component.postulanteForm.get('name')?.touched).toBeTrue();
      expect(alertsSpy.error).toHaveBeenCalledWith('Campos incorrectos');
      expect(authSpy.signUp).not.toHaveBeenCalled();
    });

    it('backend message signUp responde con success false', () => {

      setValidForms();
      authSpy.signUp.and.returnValue(
        of({ success: false, message: 'El correo ya esta registrado' })
      );

      component.onSignUp();

  
      expect(authSpy.signUp).toHaveBeenCalled();
      expect(authSpy.signUpPostulante).not.toHaveBeenCalled();
      expect(alertsSpy.error).toHaveBeenCalledWith('El correo ya esta registrado');
      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('serror cuando signUp request fails', () => {
    
      const requestError = new Error('network error');
      setValidForms();
      authSpy.signUp.and.returnValue(throwError(() => requestError));


      component.onSignUp();

      const lastErrorCall = alertsSpy.error.calls.mostRecent().args;
      expect(authSpy.signUpPostulante).not.toHaveBeenCalled();
      expect(alertsSpy.error).toHaveBeenCalled();
      expect(lastErrorCall[0]).toBe('Error en el registro');
      expect(lastErrorCall[1] as unknown).toBe(requestError);
      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('registers the postulante, shows success and redirects cuando las dos requests succeed', () => {
      setValidForms();
      authSpy.signUp.and.returnValue(of({ success: true, user: { id: 10 } }));
      authSpy.signUpPostulante.and.returnValue(of({ message: 'ok' }));

      component.onSignUp();

      expect(authSpy.signUp).toHaveBeenCalled();
      expect(authSpy.signUpPostulante).toHaveBeenCalledWith(
        jasmine.objectContaining({
          name: 'Juan',
          lastname: 'Perez',
          id_perfil: 10,
        })
      );
      expect(alertsSpy.success).toHaveBeenCalledWith(
        jasmine.stringMatching(/^Registro exitoso\./)
      );
      expect(navigateSpy).toHaveBeenCalledWith(['login']);
    });

    it(' error cuando postulante registration fails', () => {
      const requestError = new Error('postulante error');
      setValidForms();
      authSpy.signUp.and.returnValue(of({ success: true, user: { id: 10 } }));
      authSpy.signUpPostulante.and.returnValue(throwError(() => requestError));

      component.onSignUp();

      const lastErrorCall = alertsSpy.error.calls.mostRecent().args;
      expect(authSpy.signUpPostulante).toHaveBeenCalled();
      expect(alertsSpy.error).toHaveBeenCalled();
      expect(lastErrorCall[0]).toBe('Error en el registro');
      expect(lastErrorCall[1] as unknown).toBe(requestError);
      expect(alertsSpy.success).not.toHaveBeenCalled();
      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });
});
