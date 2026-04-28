import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { SignupEmpresas } from '../../src/app/features/signup-empresas/signup-empresas';
import { Alerts } from '../../src/app/shared/services/alerts';
import { Auth } from '../../src/app/shared/services/auth';
import { LoggerService } from '../../src/app/shared/services/logger';

describe('SignupEmpresas regresion', () => {
  let fixture: ComponentFixture<SignupEmpresas>;
  let component: SignupEmpresas;
  let authSpy: jasmine.SpyObj<Auth>;
  let alertsSpy: jasmine.SpyObj<Alerts>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;
  let router: Router;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<Auth>('Auth', ['signUp', 'signUpEmpresa']);
    alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['error', 'success']);
    loggerSpy = jasmine.createSpyObj<LoggerService>('LoggerService', ['log', 'error']);

    authSpy.signUp.and.returnValue(of({ success: true, user: { id: 'perfil-empresa-1' } }));
    authSpy.signUpEmpresa.and.returnValue(of({ ok: true }));

    await TestBed.configureTestingModule({
      imports: [SignupEmpresas],
      providers: [
        provideRouter([]),
        { provide: Auth, useValue: authSpy },
        { provide: Alerts, useValue: alertsSpy },
        { provide: LoggerService, useValue: loggerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SignupEmpresas);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  function getButtonByText(text: string): HTMLButtonElement {
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const match = buttons.find((button) => button.textContent?.includes(text));
    if (!match) {
      throw new Error(`Button with text "${text}" was not found`);
    }
    return match;
  }

  it('keeps the recruiter signup step flow working', () => {
    expect(component.currentStep).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Datos Empresariales');

    component.empresaForm.setValue({
      name_empresa: 'Linker SAS',
      NIT: '900123456',
    });
    getButtonByText('Continuar').click();
    fixture.detectChanges();

    expect(component.currentStep).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Credenciales');
    expect(fixture.nativeElement.querySelector('input[type="email"]')).not.toBeNull();

    getButtonByText('Atrás').click();
    fixture.detectChanges();

    expect(component.currentStep).toBe(1);
    expect(fixture.nativeElement.querySelector('input[formcontrolname="name_empresa"]')).not.toBeNull();
  });

  it('preserves the successful company signup flow and redirects to login', () => {
    component.currentStep = 2;
    fixture.detectChanges();

    component.empresaForm.setValue({
      name_empresa: 'Linker SAS',
      NIT: '900123456',
    });
    component.signupEmpresasForm.setValue({
      email: 'empresa@test.com',
      password: 'abc123',
      repassword: 'abc123',
    });

    getButtonByText('Registrar').click();

    expect(authSpy.signUp).toHaveBeenCalledWith(
      jasmine.objectContaining({
        email: 'empresa@test.com',
        password: 'abc123',
      })
    );
    expect(authSpy.signUpEmpresa).toHaveBeenCalledWith(
      jasmine.objectContaining({
        name_empresa: 'Linker SAS',
        NIT: '900123456',
        id_perfil: 'perfil-empresa-1',
      })
    );
    expect(alertsSpy.success).toHaveBeenCalledWith('Registro exitoso. Por favor, inicie sesión.');
    expect(router.navigate).toHaveBeenCalledWith(['login']);
  });

  it('keeps signup errors visible without redirecting', () => {
    component.currentStep = 2;
    fixture.detectChanges();
    component.empresaForm.setValue({
      name_empresa: 'Linker SAS',
      NIT: '900123456',
    });
    component.signupEmpresasForm.setValue({
      email: 'empresa@test.com',
      password: 'abc123',
      repassword: 'abc123',
    });
    authSpy.signUp.and.returnValue(throwError(() => new Error('boom')));

    getButtonByText('Registrar').click();

    expect(loggerSpy.error).toHaveBeenCalledWith(
      'Error en el registro de usuario',
      jasmine.any(Error)
    );
    expect(alertsSpy.success).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
