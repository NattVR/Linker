import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';

import { Login } from '../../src/app/features/login/login';
import { Auth } from '../../src/app/shared/services/auth';
import { Alerts } from '../../src/app/shared/services/alerts';
import { Perfil } from '../../src/app/shared/services/perfil';

describe('Login regresion', () => {
  let fixture: ComponentFixture<Login>;
  let component: Login;
  let authSpy: jasmine.SpyObj<Auth>;
  let alertsSpy: jasmine.SpyObj<Alerts>;
  let perfilSpy: jasmine.SpyObj<Perfil>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockLoginResponse = {
    success: true,
    message: 'Inicio de sesión exitoso',
    token: 'mock-jwt-token',
    user: { id: 'user-1' },
  };

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<Auth>('Auth', ['login', 'getPerfilId'], {
      isLogged: jasmine.createSpyObj('Signal', ['set']),
    });
    alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['success', 'error']);
    perfilSpy = jasmine.createSpyObj<Perfil>('Perfil', ['getIsEmpresa']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    authSpy.login.and.returnValue(of(mockLoginResponse));
    authSpy.getPerfilId.and.returnValue(of({ id: 'perfil-1' }));
    perfilSpy.getIsEmpresa.and.returnValue(of({ isEmpresa: false }));

    spyOn(sessionStorage, 'getItem').and.returnValue(null);
    spyOn(sessionStorage, 'setItem');

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: Auth, useValue: authSpy },
        { provide: Alerts, useValue: alertsSpy },
        { provide: Perfil, useValue: perfilSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the login form', () => {
    expect(fixture.nativeElement.querySelector('form')).toBeTruthy();
  });

  it('form is invalid when empty', () => {
    expect(component.loginForm.valid).toBeFalse();
  });

  it('form is invalid with malformed email', () => {
    component.loginForm.patchValue({ email: 'correo_mal', password: 'password123' });
    expect(component.loginForm.valid).toBeFalse();
  });

  it('form is invalid when password is empty', () => {
    component.loginForm.patchValue({ email: 'test@correo.com', password: '' });
    expect(component.loginForm.valid).toBeFalse();
  });

  it('form is valid with correct email and password', () => {
    component.loginForm.patchValue({ email: 'test@correo.com', password: 'password123' });
    expect(component.loginForm.valid).toBeTrue();
  });

  it('calls auth.login with form values on submit', () => {
    component.loginForm.patchValue({ email: 'test@correo.com', password: 'password123' });
    component.onLogin();
    expect(authSpy.login).toHaveBeenCalledWith(
      jasmine.objectContaining({ email: 'test@correo.com', password: 'password123' })
    );
  });

  it('stores token and userId in sessionStorage on success', () => {
    component.loginForm.patchValue({ email: 'test@correo.com', password: 'password123' });
    component.onLogin();
    expect(sessionStorage.setItem).toHaveBeenCalledWith('token', 'mock-jwt-token');
    expect(sessionStorage.setItem).toHaveBeenCalledWith('userId', 'user-1');
  });

  it('stores perfilId in sessionStorage after getting perfil', () => {
    component.loginForm.patchValue({ email: 'test@correo.com', password: 'password123' });
    component.onLogin();
    expect(sessionStorage.setItem).toHaveBeenCalledWith('perfilId', 'perfil-1');
  });

  it('shows success alert on login', () => {
    component.loginForm.patchValue({ email: 'test@correo.com', password: 'password123' });
    component.onLogin();
    expect(alertsSpy.success).toHaveBeenCalledWith('Inicio de sesión exitoso');
  });

  it('sets isLogged to true on success', () => {
    component.loginForm.patchValue({ email: 'test@correo.com', password: 'password123' });
    component.onLogin();
    expect(authSpy.isLogged.set).toHaveBeenCalledWith(true);
  });

  it('navigates to match after successful login', () => {
    component.loginForm.patchValue({ email: 'test@correo.com', password: 'password123' });
    component.onLogin();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['match']);
  });

  it('shows error alert when login request fails', () => {
    authSpy.login.and.returnValue(throwError(() => new Error('Credenciales inválidas')));
    component.loginForm.patchValue({ email: 'fail@correo.com', password: 'wrong' });
    component.onLogin();
    expect(alertsSpy.error).toHaveBeenCalledWith('Error en la solicitud');
  });

  it('does not navigate on login error', () => {
    authSpy.login.and.returnValue(throwError(() => new Error('Error')));
    component.loginForm.patchValue({ email: 'fail@correo.com', password: 'wrong' });
    component.onLogin();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('throws when response success is false', () => {
    authSpy.login.and.returnValue(of({ success: false, message: 'Credenciales inválidas' }));
    component.loginForm.patchValue({ email: 'test@correo.com', password: 'password123' });
    component.onLogin();
    expect(alertsSpy.error).toHaveBeenCalledWith('Error en la solicitud');
  });
});