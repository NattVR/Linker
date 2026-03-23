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
  let authSpy: jasmine.SpyObj<Auth>;     // Mock + Stub
  let alertsSpy: jasmine.SpyObj<Alerts>; // Mock
  let perfilSpy: jasmine.SpyObj<Perfil>; // Stub
  let router: Router;

  beforeEach(async () => {
    // Arrange - construcción de dobles de prueba
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

  it('[C-001] error HTTP -> alert.error("Error en la solicitud")', () => {
    // Arrange - Stub que simula fallo de red
    authSpy.login.and.returnValue(throwError(() => new Error('network error')));
    component.loginForm.setValue({ email: 'test@test.com', password: '123' });

    // Act
    component.onLogin();

    // Assert
    expect(alertsSpy.error).toHaveBeenCalledWith('Error en la solicitud'); // Mock
    expect(alertsSpy.success).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('[C-002] response.success=false -> alert.error con el mensaje del servidor', () => {
    // Arrange - Stub que devuelve respuesta controlada
    authSpy.login.and.returnValue(of({ success: false, message: 'Credenciales inválidas' }));
    component.loginForm.setValue({ email: 'bad@test.com', password: 'wrong' });

    // Act
    component.onLogin();

    // Assert
    expect(alertsSpy.error).toHaveBeenCalledWith('Credenciales inválidas'); // Mock
    expect((authSpy as any).isLogged()).toBe(false);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('[C-003] getIsEmpresa falla -> console.error y no navega', () => {
    // Arrange - Stub login ok, Stub getIsEmpresa falla
    authSpy.login.and.returnValue(
      of({ success: true, message: 'OK', token: 'tok', user: { id: 'u1' } })
    );
    perfilSpy.getIsEmpresa.and.returnValue(throwError(() => new Error('backend error')));
    spyOn(console, 'error');
    component.loginForm.setValue({ email: 'ok@test.com', password: 'pass' });

    // Act
    component.onLogin();

    // Assert
    expect((authSpy as any).isLogged()).toBe(true);
    expect(sessionStorage.getItem('token')).toBe('tok');
    expect(console.error).toHaveBeenCalledWith(
      'Error al obtener tipo de usuario:',
      jasmine.any(Error)
    );
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('[C-004] getPerfilId falla -> console.error y no navega', () => {
    // Arrange - Stub login ok, Stub getIsEmpresa ok, Stub getPerfilId falla
    authSpy.login.and.returnValue(
      of({ success: true, message: 'OK', token: 'tok', user: { id: 'u1' } })
    );
    perfilSpy.getIsEmpresa.and.returnValue(of('true') as any);
    authSpy.getPerfilId.and.returnValue(throwError(() => new Error('perfil error')));
    spyOn(console, 'error');
    component.loginForm.setValue({ email: 'ok@test.com', password: 'pass' });

    // Act
    component.onLogin();

    // Assert
    expect(sessionStorage.getItem('isEmpresa')).toBe('true');
    expect(console.error).toHaveBeenCalledWith(
      'Error al obtener el perfil:',
      jasmine.any(Error)
    );
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('[C-005] login exitoso -> sessionStorage completo + navigate(["match"])', () => {
    // Arrange - todos los Stubs retornan éxito
    authSpy.login.and.returnValue(
      of({ success: true, message: 'Inicio de sesión exitoso', token: 'jwt-token', user: { id: 'user-42' } })
    );
    perfilSpy.getIsEmpresa.and.returnValue(of('false') as any);
    authSpy.getPerfilId.and.returnValue(of({ id: 'perfil-99' }));
    component.loginForm.setValue({ email: 'm@gmail.com', password: '123456789' });

    // Act
    component.onLogin();

    // Assert
    expect(alertsSpy.success).toHaveBeenCalledWith('Inicio de sesión exitoso'); // Mock
    expect((authSpy as any).isLogged()).toBe(true);
    expect(sessionStorage.getItem('token')).toBe('jwt-token');
    expect(sessionStorage.getItem('userId')).toBe('user-42');
    expect(sessionStorage.getItem('isEmpresa')).toBe('false');
    expect(sessionStorage.getItem('perfilId')).toBe('perfil-99');
    expect(router.navigate).toHaveBeenCalledWith(['match']);
  });

  it('[C-006] formulario vacío -> loginForm inválido', () => {
    // Arrange - formulario sin valores

    // Act - (no se llama onLogin, se verifica estado del form)

    // Assert
    expect(component.loginForm.valid).toBeFalse();
  });

  it('[C-007] email con formato inválido -> campo email inválido', () => {
    // Arrange
    component.loginForm.setValue({ email: 'no-es-email', password: '123' });

    // Act - (validación reactiva, sin llamada explícita)

    // Assert
    expect(component.loginForm.get('email')?.valid).toBeFalse();
  });

  it('[C-008] login exitoso -> isLogged pasa de false a true', () => {
    // Arrange
    authSpy.login.and.returnValue(
      of({ success: true, message: 'OK', token: 'tok', user: { id: 'u' } })
    );
    perfilSpy.getIsEmpresa.and.returnValue(of('false') as any);
    authSpy.getPerfilId.and.returnValue(of({ id: 'p' }));
    expect((authSpy as any).isLogged()).toBeFalse();
    component.loginForm.setValue({ email: 'a@b.com', password: 'pass' });

    // Act
    component.onLogin();

    // Assert
    expect((authSpy as any).isLogged()).toBeTrue();
  });
});