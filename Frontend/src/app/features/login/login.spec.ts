import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { Login } from './login';
import { Auth } from '../../shared/services/auth';
import { Alerts } from '../../shared/services/alerts';
import { Perfil } from '../../shared/services/perfil';

describe('Login - onLogin()', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authSpy: jasmine.SpyObj<Auth>;
  let alertsSpy: jasmine.SpyObj<Alerts>;
  let perfilSpy: jasmine.SpyObj<Perfil>;
  let router: Router;

  beforeEach(async () => {
    authSpy   = jasmine.createSpyObj<Auth>('Auth', ['login', 'logout', 'getPerfilId']);
    alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['error', 'success']);
    perfilSpy = jasmine.createSpyObj<Perfil>('Perfil', ['getIsEmpresa']);

    (authSpy as any).isLogged = signal(false);

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: Auth,   useValue: authSpy   },
        { provide: Alerts, useValue: alertsSpy },
        { provide: Perfil, useValue: perfilSpy },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    router    = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  afterEach(() => sessionStorage.clear());

  it('[C-001] Camino 1,2,3,4,21,F - falla HTTP -> alert.error("Error en la solicitud")', () => {
    authSpy.login.and.returnValue(throwError(() => new Error('network error')));

    component.loginForm.setValue({ email: 'test@test.com', password: '123' });
    component.onLogin();

    expect(authSpy.login).toHaveBeenCalledTimes(1);
    expect(alertsSpy.error).toHaveBeenCalledWith('Error en la solicitud');
    expect(alertsSpy.success).not.toHaveBeenCalled();
  });

  it('[C-002] Camino 1,2,3,4,5,6,20,F - response.success=false -> alert.error(response.message)', () => {
    authSpy.login.and.returnValue(
      of({ success: false, message: 'Credenciales inválidas' })
    );

    component.loginForm.setValue({ email: 'bad@test.com', password: 'wrong' });
    component.onLogin();

    expect(alertsSpy.error).toHaveBeenCalledWith('Credenciales inválidas');
    expect((authSpy as any).isLogged()).toBe(false);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('[C-003] Camino ...11,19,F - getIsEmpresa falla -> console.error("Error al obtener tipo de usuario:")', () => {
    authSpy.login.and.returnValue(
      of({ success: true, message: 'OK', token: 'tok', user: { id: 'u1' } })
    );
    perfilSpy.getIsEmpresa.and.returnValue(throwError(() => new Error('backend error')));
    spyOn(console, 'error');

    component.loginForm.setValue({ email: 'ok@test.com', password: 'pass' });
    component.onLogin();

    expect((authSpy as any).isLogged()).toBe(true);
    expect(sessionStorage.getItem('token')).toBe('tok');
    expect(console.error).toHaveBeenCalledWith(
      'Error al obtener tipo de usuario:',
      jasmine.any(Error)
    );
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('[C-004] Camino ...14,18,F - getPerfilId falla -> console.error("Error al obtener el perfil:")', () => {
    authSpy.login.and.returnValue(
      of({ success: true, message: 'OK', token: 'tok', user: { id: 'u1' } })
    );
    perfilSpy.getIsEmpresa.and.returnValue(of('true') as any);
    authSpy.getPerfilId.and.returnValue(throwError(() => new Error('perfil error')));
    spyOn(console, 'error');

    component.loginForm.setValue({ email: 'ok@test.com', password: 'pass' });
    component.onLogin();

    expect(sessionStorage.getItem('isEmpresa')).toBe('true');
    expect(console.error).toHaveBeenCalledWith(
      'Error al obtener el perfil:',
      jasmine.any(Error)
    );
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('[C-005] Camino ...15,16,17,F - login exitoso -> sessionStorage completo + navigate(["match"])', () => {
    authSpy.login.and.returnValue(
      of({ success: true, message: 'Inicio de sesión exitoso', token: 'jwt-token', user: { id: 'user-42' } })
    );
    perfilSpy.getIsEmpresa.and.returnValue(of('false') as any);
    authSpy.getPerfilId.and.returnValue(of({ id: 'perfil-99' }));

    component.loginForm.setValue({ email: 'm@gmail.com', password: '123456789' });
    component.onLogin();

    expect(alertsSpy.success).toHaveBeenCalledWith('Inicio de sesión exitoso');
    expect((authSpy as any).isLogged()).toBe(true);
    expect(sessionStorage.getItem('token')).toBe('jwt-token');
    expect(sessionStorage.getItem('userId')).toBe('user-42');
    expect(sessionStorage.getItem('isEmpresa')).toBe('false');
    expect(sessionStorage.getItem('perfilId')).toBe('perfil-99');
    expect(router.navigate).toHaveBeenCalledWith(['match']);
  });

  it('formulario vacío -> loginForm inválido (validators bloquean)', () => {
    expect(component.loginForm.valid).toBeFalse();
  });

  it('email con formato inválido -> campo email inválido', () => {
    component.loginForm.setValue({ email: 'no-es-email', password: '123' });
    expect(component.loginForm.get('email')?.valid).toBeFalse();
  });

  it('credenciales correctas -> sessionStorage token presente', () => {
    authSpy.login.and.returnValue(
      of({ success: true, message: 'OK', token: 'tok-bb', user: { id: 'id1' } })
    );
    perfilSpy.getIsEmpresa.and.returnValue(of('true') as any);
    authSpy.getPerfilId.and.returnValue(of({ id: 'p1' }));

    component.loginForm.setValue({ email: 'a@b.com', password: 'pass' });
    component.onLogin();

    expect(sessionStorage.getItem('token')).toBeTruthy();
  });

  it('response.success=false -> NO se guarda token en sessionStorage', () => {
    authSpy.login.and.returnValue(of({ success: false, message: 'Error' }));

    component.loginForm.setValue({ email: 'a@b.com', password: 'wrong' });
    component.onLogin();

    expect(sessionStorage.getItem('token')).toBeNull();
  });

  it('error de red -> NO navega a "match"', () => {
    authSpy.login.and.returnValue(throwError(() => new Error('500')));

    component.loginForm.setValue({ email: 'a@b.com', password: 'pass' });
    component.onLogin();

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('login exitoso -> isLogged pasa de false a true', () => {
    authSpy.login.and.returnValue(
      of({ success: true, message: 'OK', token: 'tok', user: { id: 'u' } })
    );
    perfilSpy.getIsEmpresa.and.returnValue(of('false') as any);
    authSpy.getPerfilId.and.returnValue(of({ id: 'p' }));

    expect((authSpy as any).isLogged()).toBeFalse();

    component.loginForm.setValue({ email: 'a@b.com', password: 'pass' });
    component.onLogin();

    expect((authSpy as any).isLogged()).toBeTrue();
  });
});