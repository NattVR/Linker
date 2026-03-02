import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SignupEmpresas } from './signup-empresas';
import { Alerts } from '../../shared/services/alerts';
import { Auth } from '../../shared/services/auth';

describe('SignupEmpresas', () => {
  let component: SignupEmpresas;
  let authSpy: jasmine.SpyObj<Auth>;
  let alertsSpy: jasmine.SpyObj<Alerts>;
  let router: Router;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<Auth>('Auth', ['signUp', 'signUpEmpresa']);
    alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['error', 'success']);

    await TestBed.configureTestingModule({
      imports: [SignupEmpresas],
      providers: [
        provideRouter([]),
        { provide: Auth, useValue: authSpy },
        { provide: Alerts, useValue: alertsSpy },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SignupEmpresas);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  function fillValidForms(): void {
    component.empresaForm.setValue({
      name_empresa: 'Empresa Test',
      NIT: '123456789',
    });

    component.signupEmpresasForm.setValue({
      email: 'empresa@test.com',
      password: '123456789',
      repassword: '123456789',
    });
  }

  it('SignupEmpresas should create', () => {
    expect(component).toBeTruthy();
  });

  it('SignupEmpresas nextStep se mueve a step 2 si empresa form valid', () => {
    component.empresaForm.setValue({
      name_empresa: 'Empresa Test',
      NIT: '900123456',
    });

    component.nextStep();
    expect(component.currentStep).toBe(2);
  });

  it('SignupEmpresas nextStep se queda en step 1 cuando empresa form es invalido', () => {
    component.empresaForm.setValue({
      name_empresa: '',
      NIT: '',
    });

    component.nextStep();
    expect(component.currentStep).toBe(1);
  });

  it('onSignupEmpresa mismatch password error y return', () => {
    component.empresaForm.setValue({
      name_empresa: 'Empresa Test',
      NIT: '900123456',
    });
    component.signupEmpresasForm.setValue({
      email: 'empresa@test.com',
      password: '1234567899',
      repassword: '1234567890',
    });

    component.onSignupEmpresa();

    expect(alertsSpy.error).toHaveBeenCalledWith('Las contraseñas no coinciden');
    expect(component.signupEmpresasForm.hasError('passwordMismatch')).toBeTrue();
    expect(authSpy.signUp).not.toHaveBeenCalled();
  });

  it('onSignupEmpresa invalid forms', () => {
    component.empresaForm.setValue({
      name_empresa: '',
      NIT: '',
    });
    component.signupEmpresasForm.setValue({
      email: 'correo-invalido',
      password: '123',
      repassword: '123',
    });

    component.onSignupEmpresa();
    expect(alertsSpy.error).toHaveBeenCalledWith('Campos incorrectos');
    expect(component.signupEmpresasForm.invalid).toBeTrue();
    expect(component.empresaForm.invalid).toBeTrue();
    expect(authSpy.signUp).not.toHaveBeenCalled();
  });


  it('onSignupEmpresa signup asignar user id y registar empresa', () => {
    fillValidForms();
    authSpy.signUp.and.returnValue(of({ success: true, user: { id: 10 } }));
    authSpy.signUpEmpresa.and.returnValue(of(true));

    component.onSignupEmpresa();

    expect(authSpy.signUpEmpresa).toHaveBeenCalledWith(
      jasmine.objectContaining({
        name_empresa: 'Empresa Test',
        NIT: '123456789',
        id_perfil: 10,
      })
    );
   
    expect(alertsSpy.success).toHaveBeenCalledWith(
      jasmine.stringMatching(/Registro exitoso/i)
    );
    expect(router.navigate).toHaveBeenCalledWith(['login']);
  });

 
  it('onSignupEmpresa signUp success false', () => {
    fillValidForms();
    authSpy.signUp.and.returnValue(
      of({ success: false, message: 'Correo ya registrado' })
    );

    component.onSignupEmpresa();
    expect(alertsSpy.error).toHaveBeenCalledWith('Correo ya registrado');
    expect(authSpy.signUpEmpresa).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled()
  });

  it('onSignupEmpresa signUp request falla error', () => {
    fillValidForms();
    authSpy.signUp.and.returnValue(throwError(() => new Error('network error')));
    component.onSignupEmpresa();

    expect(alertsSpy.error).toHaveBeenCalledWith('Error en la solicitud');
    expect(authSpy.signUpEmpresa).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled()
  });

  //fALLAR
  it('onSignupEmpresa error cuando signUpEmpresa false', () => {
    fillValidForms();
    authSpy.signUp.and.returnValue(of({ success: true, user: { id: 10 } }));
    authSpy.signUpEmpresa.and.returnValue(of(false));

    component.onSignupEmpresa();
    expect(alertsSpy.error).toHaveBeenCalledWith('No se pudo registrar la empresa');
    expect(router.navigate).not.toHaveBeenCalled()
  });

   it('onSignupEmpresa signUpEmpresa request falla error', () => {
    fillValidForms();
    authSpy.signUpEmpresa.and.returnValue(throwError(() => new Error('network error')));
    component.onSignupEmpresa();

    expect(alertsSpy.error).toHaveBeenCalledWith('Error en la solicitud');
    expect(authSpy.signUpEmpresa).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled()
  });

  
});
