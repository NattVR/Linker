import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { SignupEmpresas } from './signup-empresas';
import { Alerts } from '../../shared/services/alerts';
import { Auth } from '../../shared/services/auth';
import { LoggerService } from '../../shared/services/logger';

const mockAlerts = {
    error: jasmine.createSpy('error'),
    success: jasmine.createSpy('success'),
};

const mockAuth = {
    signUp: jasmine.createSpy('signUp'),
    signUpEmpresa: jasmine.createSpy('signUpEmpresa'),
};

let mockNavigate: jasmine.Spy;

const mockLogger = {
    log: jasmine.createSpy('log'),
    error: jasmine.createSpy('error'),
};

function fillForms(
    component: SignupEmpresas,
    opts: {
        email?: string;
        password?: string;
        repassword?: string;
        name_empresa?: string;
        NIT?: string;
    } = {}
): void {
    component.signupEmpresasForm.setValue({
        email: opts.email ?? 'empresa@correo.com',
        password: opts.password ?? 'abc123',
        repassword: opts.repassword ?? 'abc123',
    });
    component.empresaForm.setValue({
        name_empresa: opts.name_empresa ?? 'Mi Empresa SA',
        NIT: opts.NIT ?? '900123456',
    });
}

describe('HU4RF02 — Registrar Reclutador | SignupEmpresas', () => {

    let component: SignupEmpresas;
    let fixture: ComponentFixture<SignupEmpresas>;

    beforeEach(async () => {
        mockAlerts.error.calls.reset();
        mockAlerts.success.calls.reset();
        mockAuth.signUp.calls.reset();
        mockAuth.signUpEmpresa.calls.reset();
        mockLogger.error.calls.reset();
        mockLogger.log.calls.reset();

        await TestBed.configureTestingModule({
            imports: [SignupEmpresas, ReactiveFormsModule],
            providers: [
                FormBuilder,
                provideRouter([]),
                { provide: Alerts, useValue: mockAlerts },
                { provide: Auth, useValue: mockAuth },
                { provide: LoggerService, useValue: mockLogger },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(SignupEmpresas);
        component = fixture.componentInstance;

        const router = TestBed.inject(Router);
        mockNavigate = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

        fixture.detectChanges();
    });

    describe('Validaciones de formulario', () => {

        it('[C1] Contraseñas no coinciden → alert.error sin llamar a signUp', () => {
            fillForms(component, { password: 'abc123', repassword: 'xyz999' });

            component.onSignupEmpresa();

            expect(mockAuth.signUp).not.toHaveBeenCalled();
            expect(mockAlerts.error).toHaveBeenCalledOnceWith('Las contraseñas no coinciden');
            expect(mockAlerts.success).not.toHaveBeenCalled();
        });

        it('[C2] Formulario inválido (campos vacíos) → alert.error sin llamar a signUp', () => {
            fillForms(component, {
                email: '', password: 'abc123', repassword: 'abc123',
                name_empresa: '', NIT: '',
            });

            component.onSignupEmpresa();

            expect(mockAuth.signUp).not.toHaveBeenCalled();
            expect(mockAlerts.error).toHaveBeenCalledOnceWith('Campos incorrectos');
        });

        it('[CP-019] Todos los campos vacíos → alert.error("Campos incorrectos")', () => {
            fillForms(component, {
                email: '', password: '', repassword: '',
                name_empresa: '', NIT: '',
            });

            component.onSignupEmpresa();

            expect(mockAuth.signUp).not.toHaveBeenCalled();
            expect(mockAlerts.error).toHaveBeenCalledOnceWith('Campos incorrectos');
        });

        it('[CP-020] Todos los campos con caracteres especiales → alert.error("Campos incorrectos")', () => {
            fillForms(component, {
                email: '!!!@@@###', password: '!@#$%^', repassword: '!@#$%^',
                name_empresa: '***&&&', NIT: '!!!###',
            });

            component.onSignupEmpresa();

            expect(mockAuth.signUp).not.toHaveBeenCalled();
            expect(mockAlerts.error).toHaveBeenCalledOnceWith('Campos incorrectos');
        });

        it('[CP-021] Todos los campos con números (email inválido) → alert.error("Campos incorrectos")', () => {
            fillForms(component, {
                email: '12345678', password: '123456', repassword: '123456',
                name_empresa: '9999', NIT: '111222333',
            });

            component.onSignupEmpresa();

            expect(mockAuth.signUp).not.toHaveBeenCalled();
            expect(mockAlerts.error).toHaveBeenCalledOnceWith('Campos incorrectos');
        });

        it('[CP-022] Solo nombre de empresa diligenciado → alert.error("Campos incorrectos")', () => {
            fillForms(component, {
                email: '', password: '', repassword: '',
                name_empresa: 'Mi Empresa SA', NIT: '',
            });

            component.onSignupEmpresa();

            expect(mockAuth.signUp).not.toHaveBeenCalled();
            expect(mockAlerts.error).toHaveBeenCalledOnceWith('Campos incorrectos');
        });

        it('[CP-023] NIT con letras (error de patrón inyectado) → alert.error("Campos incorrectos")', () => {
            fillForms(component, {
                email: 'empresa@correo.com', password: 'abc123', repassword: 'abc123',
                name_empresa: 'Mi Empresa SA', NIT: 'ABC-DEF-GHI',
            });
            component.empresaForm.get('NIT')?.setErrors({ pattern: true });

            component.onSignupEmpresa();

            expect(mockAuth.signUp).not.toHaveBeenCalled();
            expect(mockAlerts.error).toHaveBeenCalledOnceWith('Campos incorrectos');
        });

        it('[CP-024] Solo correo diligenciado → alert.error("Campos incorrectos")', () => {
            fillForms(component, {
                email: 'empresa@correo.com', password: '', repassword: '',
                name_empresa: '', NIT: '',
            });

            component.onSignupEmpresa();

            expect(mockAuth.signUp).not.toHaveBeenCalled();
            expect(mockAlerts.error).toHaveBeenCalledOnceWith('Campos incorrectos');
        });

        it('[CP-025] Solo contraseña diligenciada → alert.error("Las contraseñas no coinciden")', () => {
            fillForms(component, {
                email: '', password: 'abc123', repassword: '',
                name_empresa: '', NIT: '',
            });

            component.onSignupEmpresa();

            expect(mockAuth.signUp).not.toHaveBeenCalled();
            expect(mockAlerts.error).toHaveBeenCalledOnceWith('Las contraseñas no coinciden');
        });

        it('[CP-026] Email + nombre empresa (sin contraseña ni NIT) → alert.error("Campos incorrectos")', () => {
            fillForms(component, {
                email: 'empresa@correo.com', password: '', repassword: '',
                name_empresa: 'Mi Empresa SA', NIT: '',
            });

            component.onSignupEmpresa();

            expect(mockAuth.signUp).not.toHaveBeenCalled();
            expect(mockAlerts.error).toHaveBeenCalledOnceWith('Campos incorrectos');
        });

        it('[CP-027a] Contraseña menor a 6 caracteres → alert.error("Campos incorrectos")', () => {
            fillForms(component, {
                email: 'empresa@correo.com', password: 'abc', repassword: 'abc',
                name_empresa: 'Mi Empresa SA', NIT: '123456789',
            });

            component.onSignupEmpresa();

            expect(mockAuth.signUp).not.toHaveBeenCalled();
            expect(mockAlerts.error).toHaveBeenCalledOnceWith('Campos incorrectos');
        });

        it('[CP-028a] Correo con solo caracteres especiales → alert.error("Campos incorrectos")', () => {
            fillForms(component, {
                email: '!@#$%^&*()', password: 'abc123', repassword: 'abc123',
                name_empresa: 'Mi Empresa SA', NIT: '123456789',
            });

            component.onSignupEmpresa();

            expect(mockAuth.signUp).not.toHaveBeenCalled();
            expect(mockAlerts.error).toHaveBeenCalledOnceWith('Campos incorrectos');
        });

        it('[CP-028b] Correo con solo letras (sin @ ni dominio) → alert.error("Campos incorrectos")', () => {
            fillForms(component, {
                email: 'sololetras', password: 'abc123', repassword: 'abc123',
                name_empresa: 'Mi Empresa SA', NIT: '123456789',
            });

            component.onSignupEmpresa();

            expect(mockAuth.signUp).not.toHaveBeenCalled();
            expect(mockAlerts.error).toHaveBeenCalledOnceWith('Campos incorrectos');
        });

        it('[CP-028c] Correo con solo números (sin @ ni dominio) → alert.error("Campos incorrectos")', () => {
            fillForms(component, {
                email: '1234567890', password: 'abc123', repassword: 'abc123',
                name_empresa: 'Mi Empresa SA', NIT: '123456789',
            });

            component.onSignupEmpresa();

            expect(mockAuth.signUp).not.toHaveBeenCalled();
            expect(mockAlerts.error).toHaveBeenCalledOnceWith('Campos incorrectos');
        });

    });

    describe('Errores HTTP en signUp', () => {

        it('[C3] signUp lanza error HTTP 500 → logger.error + no alert.success', () => {
            fillForms(component);
            mockAuth.signUp.and.returnValue(throwError(() => new Error('Internal Server Error')));

            component.onSignupEmpresa();

            expect(mockAuth.signUp).toHaveBeenCalledTimes(1);
            expect(mockLogger.error).toHaveBeenCalledOnceWith(
                'Error en el registro de usuario',
                jasmine.any(Error)
            );
            expect(mockAlerts.success).not.toHaveBeenCalled();
            expect(mockNavigate).not.toHaveBeenCalled();
        });

    });

    describe('Respuesta de negocio fallida en signUp', () => {

        it('[C4] response.success=false → alert.error(response.message) y no llama a signUpEmpresa', () => {
            fillForms(component);
            mockAuth.signUp.and.returnValue(
                of({ success: false, message: 'El correo ya está registrado' })
            );

            component.onSignupEmpresa();

            expect(mockAuth.signUpEmpresa).not.toHaveBeenCalled();
            expect(mockAlerts.error).toHaveBeenCalledOnceWith('El correo ya está registrado');
            expect(mockNavigate).not.toHaveBeenCalled();
        });

    });

    describe('Flujo signUpEmpresa tras signUp exitoso', () => {

        it('[C5] signUpEmpresa recibe id_perfil correcto del usuario creado', () => {
            fillForms(component);
            mockAuth.signUp.and.returnValue(
                of({ success: true, user: { id: 'uuid-user-test' } })
            );
            mockAuth.signUpEmpresa.and.returnValue(of({ message: 'ok' }));

            component.onSignupEmpresa();

            expect(mockAuth.signUpEmpresa).toHaveBeenCalledOnceWith(
                jasmine.objectContaining({ id_perfil: 'uuid-user-test' })
            );
            expect(mockAlerts.success).toHaveBeenCalledOnceWith(
                'Registro exitoso. Por favor, inicie sesión.'
            );
            expect(mockNavigate).toHaveBeenCalledOnceWith(['login']);
        });

        it('[C6] signUpEmpresa devuelve null → alert.error("No se pudo completar")', () => {
            fillForms(component);
            mockAuth.signUp.and.returnValue(
                of({ success: true, user: { id: 'uuid-user-test' } })
            );
            mockAuth.signUpEmpresa.and.returnValue(of(null));

            component.onSignupEmpresa();

            expect(mockAlerts.success).not.toHaveBeenCalled();
            expect(mockNavigate).not.toHaveBeenCalled();
            expect(mockAlerts.error).toHaveBeenCalledOnceWith(
                'No se pudo completar el registro de la empresa.'
            );
        });

        it('[C7] Flujo completamente exitoso → alert.success + navigate([login])', () => {
            fillForms(component);
            mockAuth.signUp.and.returnValue(
                of({ success: true, user: { id: 'uuid-user-test' } })
            );
            mockAuth.signUpEmpresa.and.returnValue(
                of({ message: 'Empresa registrada con éxito', empresa: { id: 'uuid-empresa-test' } })
            );

            component.onSignupEmpresa();

            expect(mockAlerts.success).toHaveBeenCalledOnceWith(
                'Registro exitoso. Por favor, inicie sesión.'
            );
            expect(mockNavigate).toHaveBeenCalledOnceWith(['login']);
            expect(mockAlerts.error).not.toHaveBeenCalled();
        });

        it('[C8] signUpEmpresa lanza error HTTP → logger.error + sin alert.success', () => {
            fillForms(component);
            mockAuth.signUp.and.returnValue(
                of({ success: true, user: { id: 'uuid-user-test' } })
            );
            mockAuth.signUpEmpresa.and.returnValue(
                throwError(() => new Error('Service Unavailable'))
            );

            component.onSignupEmpresa();

            expect(mockLogger.error).toHaveBeenCalledOnceWith(
                'Error en el registro de empresa',
                jasmine.any(Error)
            );
            expect(mockAlerts.success).not.toHaveBeenCalled();
            expect(mockNavigate).not.toHaveBeenCalled();
        });

        it('[CP-018] Datos válidos completos → flujo exitoso con datos reales de empresa', () => {
            fillForms(component, {
                email: 'empresa@correo.com', password: 'Pass123', repassword: 'Pass123',
                name_empresa: 'Mi Empresa S.A.', NIT: '900123456',
            });
            mockAuth.signUp.and.returnValue(
                of({ success: true, user: { id: 'uuid-cp018' } })
            );
            mockAuth.signUpEmpresa.and.returnValue(
                of({ message: 'Empresa registrada con éxito', empresa: { id: 'uuid-empresa-cp018' } })
            );

            component.onSignupEmpresa();

            expect(mockAlerts.success).toHaveBeenCalledOnceWith(
                'Registro exitoso. Por favor, inicie sesión.'
            );
            expect(mockNavigate).toHaveBeenCalledOnceWith(['login']);
        });

        it('[CP-027b] Contraseña solo con letras (>=6) llega a signUp [sin validador de complejidad]', () => {
            fillForms(component, { password: 'abcdef', repassword: 'abcdef' });
            mockAuth.signUp.and.returnValue(
                of({ success: false, message: 'Error del servidor' })
            );

            component.onSignupEmpresa();

            expect(mockAuth.signUp).toHaveBeenCalledTimes(1);
            expect(mockAlerts.error).toHaveBeenCalledTimes(1);
        });

        it('[CP-027c] Contraseña solo con números (>=6) llega a signUp [sin validador de complejidad]', () => {
            fillForms(component, { password: '123456', repassword: '123456' });
            mockAuth.signUp.and.returnValue(
                of({ success: false, message: 'Error del servidor' })
            );

            component.onSignupEmpresa();

            expect(mockAuth.signUp).toHaveBeenCalledTimes(1);
            expect(mockAlerts.error).toHaveBeenCalledTimes(1);
        });

        it('[CP-027d] Contraseña solo con caracteres especiales (>=6) llega a signUp [sin validador de complejidad]', () => {
            fillForms(component, { password: '!@#$%^', repassword: '!@#$%^' });
            mockAuth.signUp.and.returnValue(
                of({ success: false, message: 'Error del servidor' })
            );

            component.onSignupEmpresa();

            expect(mockAuth.signUp).toHaveBeenCalledTimes(1);
            expect(mockAlerts.error).toHaveBeenCalledTimes(1);
        });

    });

    describe('formsValidated() — branches directos', () => {

        it('[FV-01] Formularios válidos y contraseñas iguales → retorna true', () => {
            fillForms(component);

            const result = component.formsValidated({} as User, {} as Empresa);

            expect(result).toBeTrue();
            expect(mockAlerts.error).not.toHaveBeenCalled();
        });

        it('[FV-02] passwordMismatch activo → retorna false y lanza alert', () => {
            fillForms(component, { password: 'abc123', repassword: 'xyz999' });

            const result = component.formsValidated({} as User, {} as Empresa);

            expect(result).toBeFalse();
            expect(mockAlerts.error).toHaveBeenCalledOnceWith('Las contraseñas no coinciden');
        });

        it('[FV-03] signupEmpresasForm inválido → retorna false y lanza alert', () => {
            fillForms(component, { email: 'no-es-email' });

            const result = component.formsValidated({} as User, {} as Empresa);

            expect(result).toBeFalse();
            expect(mockAlerts.error).toHaveBeenCalledOnceWith('Campos incorrectos');
        });

        it('[FV-04] empresaForm inválido → retorna false y lanza alert', () => {
            fillForms(component, { name_empresa: '', NIT: '' });

            const result = component.formsValidated({} as User, {} as Empresa);

            expect(result).toBeFalse();
            expect(mockAlerts.error).toHaveBeenCalledOnceWith('Campos incorrectos');
        });

    });

    describe('Navegación entre pasos — nextStep() y previousStep()', () => {

        it('[NS-01] nextStep() con nombre y NIT válidos → currentStep pasa a 2', () => {
            component.empresaForm.setValue({ name_empresa: 'Mi Empresa SA', NIT: '900123456' });

            component.nextStep();

            expect(component.currentStep).toBe(2);
        });

        it('[NS-02] nextStep() con nombre vacío → currentStep permanece en 1', () => {
            component.empresaForm.setValue({ name_empresa: '', NIT: '900123456' });

            component.nextStep();

            expect(component.currentStep).toBe(1);
        });

        it('[NS-03] nextStep() con NIT vacío → currentStep permanece en 1', () => {
            component.empresaForm.setValue({ name_empresa: 'Mi Empresa SA', NIT: '' });

            component.nextStep();

            expect(component.currentStep).toBe(1);
        });

        it('[NS-04] nextStep() con ambos campos vacíos → currentStep permanece en 1', () => {
            component.empresaForm.setValue({ name_empresa: '', NIT: '' });

            component.nextStep();

            expect(component.currentStep).toBe(1);
        });

        it('[NS-05] previousStep() desde paso 2 → currentStep regresa a 1', () => {
            component.empresaForm.setValue({ name_empresa: 'Mi Empresa SA', NIT: '900123456' });
            component.nextStep();
            expect(component.currentStep).toBe(2);

            component.previousStep();

            expect(component.currentStep).toBe(1);
        });

        it('[NS-06] previousStep() desde paso 1 → currentStep queda en 0 (sin guardia)', () => {
            expect(component.currentStep).toBe(1);

            component.previousStep();

            expect(component.currentStep).toBe(0);
        });

    });

});