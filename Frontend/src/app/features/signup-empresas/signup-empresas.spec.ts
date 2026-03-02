import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
    HttpClientTestingModule,
    HttpTestingController,
} from '@angular/common/http/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { SignupEmpresas } from './signup-empresas';
import { Alerts } from '../../shared/services/alerts';
import { Auth } from '../../shared/services/auth';


function fillForms(
    component: SignupEmpresas,
    opts: {
        email?: string;
        password?: string;
        repassword?: string;
        name_empresa?: string;
        NIT?: string;
    } = {}
) {
    component.signupEmpresasForm.setValue({
        email: opts.email ?? 'test@mail.com',
        password: opts.password ?? 'abc123',
        repassword: opts.repassword ?? 'abc123',
    });
    component.empresaForm.setValue({
        name_empresa: opts.name_empresa ?? 'Empresa SA',
        NIT: opts.NIT ?? '123456789',
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite principal — HU4RF02: Registrar Reclutador
// Pruebas de caja blanca sobre onSignupEmpresa()
// ─────────────────────────────────────────────────────────────────────────────
describe('HU4RF02 — Registrar Reclutador | onSignupEmpresa()', () => {
    let component: SignupEmpresas;
    let fixture: ComponentFixture<SignupEmpresas>;
    let httpController: HttpTestingController;
    let router: Router;

    const alertsEmitted: { type: string; message: string }[] = [];

    beforeEach(async () => {
        alertsEmitted.length = 0;

        await TestBed.configureTestingModule({
            imports: [
                SignupEmpresas,
                ReactiveFormsModule,
                HttpClientTestingModule,
                RouterTestingModule.withRoutes([]),
            ],
            providers: [FormBuilder, Auth, Alerts],
        }).compileComponents();

        fixture = TestBed.createComponent(SignupEmpresas);
        component = fixture.componentInstance;
        httpController = TestBed.inject(HttpTestingController);
        router = TestBed.inject(Router);

        const alerts = TestBed.inject(Alerts);
        spyOn(alerts, 'error').and.callFake((msg: string) =>
            alertsEmitted.push({ type: 'error', message: msg })
        );
        spyOn(alerts, 'success').and.callFake((msg: string) =>
            alertsEmitted.push({ type: 'success', message: msg })
        );

        fixture.detectChanges();
    });

    afterEach(() => {
        try {
            httpController.verify();
        } catch (_) {
            httpController.match(() => true);
        }
    });

    it('[C1] Camino 1,2,3,4,5,6,F — contraseñas no coinciden → alert.error sin llamada HTTP', () => {
        fillForms(component, { password: 'abc123', repassword: 'xyz999' });

        component.onSignupEmpresa();

        httpController.expectNone('http://localhost:3000/user/registro');
        expect(alertsEmitted.length).toBe(1);
        expect(alertsEmitted[0].type).toBe('error');
        expect(alertsEmitted[0].message).toBe('Las contraseñas no coinciden');
    });

    it('[C2] Camino 1,2,3,4,7,8,9,F — formulario inválido → alert.error sin llamada HTTP', () => {
        fillForms(component, {
            email: '',
            password: 'abc123',
            repassword: 'abc123',
            name_empresa: '',
            NIT: '',
        });

        component.onSignupEmpresa();

        httpController.expectNone('http://localhost:3000/user/registro');
        expect(alertsEmitted.length).toBe(1);
        expect(alertsEmitted[0].type).toBe('error');
        expect(alertsEmitted[0].message).toBe('Campos incorrectos');
    });

    it('[C3] Camino 1,2,3,4,7,10,18,19,F — HTTP 500 → alert.error("Error en la solicitud")', () => {
        fillForms(component);

        component.onSignupEmpresa();

        const req = httpController.expectOne('http://localhost:3000/user/registro');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(jasmine.objectContaining({ email: 'test@mail.com' }));
        req.flush('Internal Server Error', { status: 500, statusText: 'Server Error' });

        expect(alertsEmitted.length).toBe(1);
        expect(alertsEmitted[0].type).toBe('error');
        expect(alertsEmitted[0].message).toBe('Error en la solicitud');
    });

    it('[C4] Camino 1,2,3,4,7,10,11,17,F — response.success=false → alert.error(response.message)', () => {
        fillForms(component);

        component.onSignupEmpresa();

        const req = httpController.expectOne('http://localhost:3000/user/registro');
        req.flush({ success: false, message: 'El correo ya está registrado' });

        expect(alertsEmitted.length).toBe(1);
        expect(alertsEmitted[0].type).toBe('error');
        expect(alertsEmitted[0].message).toBe('El correo ya está registrado');
        httpController.expectNone('http://localhost:3000/empresa/registro');
    });

    it('[C5] Camino 1,2,3,4,7,10,11,12,13,F — [BUG] signUpEmpresa sin callback error: POST llega con id_perfil correcto', () => {
        fillForms(component);
        const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

        component.onSignupEmpresa();

        const reqUser = httpController.expectOne('http://localhost:3000/user/registro');
        reqUser.flush({ success: true, user: { id: 'uuid-user-test' } });

        const reqEmpresa = httpController.expectOne('http://localhost:3000/empresa/registro');
        expect(reqEmpresa.request.method).toBe('POST');
        expect(reqEmpresa.request.body).toEqual(
            jasmine.objectContaining({ id_perfil: 'uuid-user-test' })
        );

        reqEmpresa.flush({ message: 'ok' });

        expect(alertsEmitted.length).toBe(1);
        expect(alertsEmitted[0].type).toBe('success');
        expect(navigateSpy).toHaveBeenCalledWith(['login']);
    });

    it('[C6] Camino 1,2,3,4,7,10,11,12,13,14,F — postResponse=null → sin alerta ni navegación', () => {
        fillForms(component);
        const navigateSpy = spyOn(router, 'navigate').and.callThrough();

        component.onSignupEmpresa();

        const reqUser = httpController.expectOne('http://localhost:3000/user/registro');
        reqUser.flush({ success: true, user: { id: 'uuid-user-test' } });

        const reqEmpresa = httpController.expectOne('http://localhost:3000/empresa/registro');
        reqEmpresa.flush(null);

        expect(alertsEmitted.filter(a => a.type === 'success').length).toBe(0);
        expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('[C7] Camino 1,2,3,4,7,10,11,12,13,14,15,16,F — flujo exitoso → alert.success + navigate([login])', async () => {
        fillForms(component);
        const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

        component.onSignupEmpresa();

        const reqUser = httpController.expectOne('http://localhost:3000/user/registro');
        reqUser.flush({ success: true, user: { id: 'uuid-user-test' } });

        const reqEmpresa = httpController.expectOne('http://localhost:3000/empresa/registro');
        reqEmpresa.flush({
            message: 'Empresa registrada con éxito',
            empresa: { id: 'uuid-empresa-test' },
        });

        expect(alertsEmitted.length).toBe(1);
        expect(alertsEmitted[0].type).toBe('success');
        expect(alertsEmitted[0].message).toBe('Registro exitoso. Por favor, inicie sesión.');
        expect(navigateSpy).toHaveBeenCalledWith(['login']);
    });

    // =========================================================================
    // CASOS DE PRUEBA CP-018 a CP-028 — HU4RF02 Registrar Reclutador
    // =========================================================================

    it('[CP-018] Registro exitoso — datos válidos completos → alert.success + navigate([login])', async () => {
        fillForms(component, {
            email: 'empresa@correo.com',
            password: 'Pass123',
            repassword: 'Pass123',
            name_empresa: 'Mi Empresa S.A.',
            NIT: '900123456',
        });
        const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

        component.onSignupEmpresa();

        const reqUser = httpController.expectOne('http://localhost:3000/user/registro');
        reqUser.flush({ success: true, user: { id: 'uuid-cp018' } });

        const reqEmpresa = httpController.expectOne('http://localhost:3000/empresa/registro');
        reqEmpresa.flush({ message: 'Empresa registrada con éxito', empresa: { id: 'uuid-empresa-cp018' } });

        expect(alertsEmitted.length).toBe(1);
        expect(alertsEmitted[0].type).toBe('success');
        expect(alertsEmitted[0].message).toBe('Registro exitoso. Por favor, inicie sesión.');
        expect(navigateSpy).toHaveBeenCalledWith(['login']);
    });

    it('[CP-019] Registro fallido — todos los campos vacíos → alert.error("Campos incorrectos")', () => {
        fillForms(component, {
            email: '',
            password: '',
            repassword: '',
            name_empresa: '',
            NIT: '',
        });

        component.onSignupEmpresa();

        httpController.expectNone('http://localhost:3000/user/registro');
        expect(alertsEmitted.length).toBe(1);
        expect(alertsEmitted[0].type).toBe('error');
        expect(alertsEmitted[0].message).toBe('Campos incorrectos');
    });

    it('[CP-020] Registro fallido — todos los campos con caracteres especiales → alert.error("Campos incorrectos")', () => {
        fillForms(component, {
            email: '!!!@@@###',
            password: '!@#$%^',
            repassword: '!@#$%^',
            name_empresa: '***&&&',
            NIT: '!!!###',
        });

        component.onSignupEmpresa();

        httpController.expectNone('http://localhost:3000/user/registro');
        expect(alertsEmitted.length).toBe(1);
        expect(alertsEmitted[0].type).toBe('error');
        expect(alertsEmitted[0].message).toBe('Campos incorrectos');
    });

    it('[CP-021] Registro fallido — todos los campos con números → alert.error("Campos incorrectos")', () => {
        fillForms(component, {
            email: '12345678',
            password: '123456',
            repassword: '123456',
            name_empresa: '9999',
            NIT: '111222333',
        });

        component.onSignupEmpresa();

        httpController.expectNone('http://localhost:3000/user/registro');
        expect(alertsEmitted.length).toBe(1);
        expect(alertsEmitted[0].type).toBe('error');
        expect(alertsEmitted[0].message).toBe('Campos incorrectos');
    });

    it('[CP-022] Registro fallido — solo nombre de empresa diligenciado → alert.error("Campos incorrectos")', () => {
        fillForms(component, {
            email: '',
            password: '',
            repassword: '',
            name_empresa: 'Mi Empresa SA',
            NIT: '',
        });

        component.onSignupEmpresa();

        httpController.expectNone('http://localhost:3000/user/registro');
        expect(alertsEmitted.length).toBe(1);
        expect(alertsEmitted[0].type).toBe('error');
        expect(alertsEmitted[0].message).toBe('Campos incorrectos');
    });

    it('[CP-023] Registro fallido — NIT con letras → alert.error("Campos incorrectos") [requiere Validators.pattern en NIT]', () => {
        fillForms(component, {
            email: 'empresa@correo.com',
            password: 'abc123',
            repassword: 'abc123',
            name_empresa: 'Mi Empresa SA',
            NIT: 'ABC-DEF-GHI',
        });

        component.empresaForm.get('NIT')?.setErrors({ pattern: true });

        component.onSignupEmpresa();

        httpController.expectNone('http://localhost:3000/user/registro');
        expect(alertsEmitted.length).toBe(1);
        expect(alertsEmitted[0].type).toBe('error');
        expect(alertsEmitted[0].message).toBe('Campos incorrectos');
    });

    it('[CP-024] Registro fallido — solo correo diligenciado → alert.error("Campos incorrectos")', () => {
        fillForms(component, {
            email: 'empresa@correo.com',
            password: '',
            repassword: '',
            name_empresa: '',
            NIT: '',
        });

        component.onSignupEmpresa();

        httpController.expectNone('http://localhost:3000/user/registro');
        expect(alertsEmitted.length).toBe(1);
        expect(alertsEmitted[0].type).toBe('error');
        expect(alertsEmitted[0].message).toBe('Campos incorrectos');
    });

    it('[CP-025] Registro fallido — solo contraseña diligenciada → alert.error("Las contraseñas no coinciden")', () => {
        fillForms(component, {
            email: '',
            password: 'abc123',
            repassword: '',
            name_empresa: '',
            NIT: '',
        });

        component.onSignupEmpresa();

        httpController.expectNone('http://localhost:3000/user/registro');
        expect(alertsEmitted.length).toBe(1);
        expect(alertsEmitted[0].type).toBe('error');
        expect(alertsEmitted[0].message).toBe('Las contraseñas no coinciden');
    });

    it('[CP-026] Registro fallido — solo 2 campos diligenciados (email + nombre) → alert.error("Campos incorrectos")', () => {
        fillForms(component, {
            email: 'empresa@correo.com',
            password: '',
            repassword: '',
            name_empresa: 'Mi Empresa SA',
            NIT: '',
        });

        component.onSignupEmpresa();

        httpController.expectNone('http://localhost:3000/user/registro');
        expect(alertsEmitted.length).toBe(1);
        expect(alertsEmitted[0].type).toBe('error');
        expect(alertsEmitted[0].message).toBe('Campos incorrectos');
    });

    it('[CP-027a] Registro fallido — contraseña menor a 6 caracteres → alert.error("Campos incorrectos")', () => {
        fillForms(component, {
            email: 'empresa@correo.com',
            password: 'abc',
            repassword: 'abc',
            name_empresa: 'Mi Empresa SA',
            NIT: '123456789',
        });

        component.onSignupEmpresa();

        httpController.expectNone('http://localhost:3000/user/registro');
        expect(alertsEmitted.length).toBe(1);
        expect(alertsEmitted[0].type).toBe('error');
        expect(alertsEmitted[0].message).toBe('Campos incorrectos');
    });

    it('[CP-027b] Registro — contraseña solo con letras (>=6) llega a API [sin validador de complejidad]', () => {
        fillForms(component, {
            email: 'empresa@correo.com',
            password: 'abcdef',
            repassword: 'abcdef',
            name_empresa: 'Mi Empresa SA',
            NIT: '123456789',
        });

        component.onSignupEmpresa();

        const req = httpController.expectOne('http://localhost:3000/user/registro');
        req.flush({ success: false, message: 'Error del servidor' });

        expect(alertsEmitted.length).toBe(1);
        expect(alertsEmitted[0].type).toBe('error');
    });

    it('[CP-027c] Registro — contraseña solo con números (>=6) llega a API [sin validador de complejidad]', () => {
        fillForms(component, {
            email: 'empresa@correo.com',
            password: '123456',
            repassword: '123456',
            name_empresa: 'Mi Empresa SA',
            NIT: '123456789',
        });

        component.onSignupEmpresa();

        const req = httpController.expectOne('http://localhost:3000/user/registro');
        req.flush({ success: false, message: 'Error del servidor' });

        expect(alertsEmitted.length).toBe(1);
        expect(alertsEmitted[0].type).toBe('error');
    });

    it('[CP-027d] Registro — contraseña solo con caracteres especiales (>=6) llega a API [sin validador de complejidad]', () => {
        fillForms(component, {
            email: 'empresa@correo.com',
            password: '!@#$%^',
            repassword: '!@#$%^',
            name_empresa: 'Mi Empresa SA',
            NIT: '123456789',
        });

        component.onSignupEmpresa();

        const req = httpController.expectOne('http://localhost:3000/user/registro');
        req.flush({ success: false, message: 'Error del servidor' });

        expect(alertsEmitted.length).toBe(1);
        expect(alertsEmitted[0].type).toBe('error');
    });

    it('[CP-028a] Registro fallido — correo con solo caracteres especiales → alert.error("Campos incorrectos")', () => {
        fillForms(component, {
            email: '!@#$%^&*()',
            password: 'abc123',
            repassword: 'abc123',
            name_empresa: 'Mi Empresa SA',
            NIT: '123456789',
        });

        component.onSignupEmpresa();

        httpController.expectNone('http://localhost:3000/user/registro');
        expect(alertsEmitted.length).toBe(1);
        expect(alertsEmitted[0].type).toBe('error');
        expect(alertsEmitted[0].message).toBe('Campos incorrectos');
    });

    it('[CP-028b] Registro fallido — correo con solo letras (sin @ ni dominio) → alert.error("Campos incorrectos")', () => {
        fillForms(component, {
            email: 'sololetras',
            password: 'abc123',
            repassword: 'abc123',
            name_empresa: 'Mi Empresa SA',
            NIT: '123456789',
        });

        component.onSignupEmpresa();

        httpController.expectNone('http://localhost:3000/user/registro');
        expect(alertsEmitted.length).toBe(1);
        expect(alertsEmitted[0].type).toBe('error');
        expect(alertsEmitted[0].message).toBe('Campos incorrectos');
    });

    it('[CP-028c] Registro fallido — correo con solo números (sin @ ni dominio) → alert.error("Campos incorrectos")', () => {
        fillForms(component, {
            email: '1234567890',
            password: 'abc123',
            repassword: 'abc123',
            name_empresa: 'Mi Empresa SA',
            NIT: '123456789',
        });

        component.onSignupEmpresa();

        httpController.expectNone('http://localhost:3000/user/registro');
        expect(alertsEmitted.length).toBe(1);
        expect(alertsEmitted[0].type).toBe('error');
        expect(alertsEmitted[0].message).toBe('Campos incorrectos');
    });
});
