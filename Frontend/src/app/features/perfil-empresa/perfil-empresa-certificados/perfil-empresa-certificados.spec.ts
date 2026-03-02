// =============================================================================
// HU — Editar Certificado | Frontend
// Archivo: src/app/features/perfil-empresa-certificados/perfil-empresa-certificados.spec.ts
// =============================================================================

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { PerfilEmpresaCertificados } from './perfil-empresa-certificados';
import { Perfil } from '../../../shared/services/perfil';
import { Alerts } from '../../../shared/services/alerts';

describe('Editar Certificado | PerfilEmpresaCertificados.guardarEdicion()', () => {
    let component: PerfilEmpresaCertificados;
    let fixture: ComponentFixture<PerfilEmpresaCertificados>;
    let perfilSpy: jasmine.SpyObj<Perfil>;
    let alertsEmitted: { type: string; message: string }[];

    beforeEach(async () => {
        alertsEmitted = [];

        perfilSpy = jasmine.createSpyObj('Perfil', [
            'updateCertificado',
            'getCerticados',
            'getCertificadosOfEmpresa',
        ]);

        perfilSpy.getCerticados.and.returnValue(of([]));
        perfilSpy.getCertificadosOfEmpresa.and.returnValue(of([]));

        await TestBed.configureTestingModule({
            imports: [PerfilEmpresaCertificados, ReactiveFormsModule, HttpClientTestingModule],
            providers: [
                FormBuilder,
                { provide: Perfil, useValue: perfilSpy },
                {
                    provide: Alerts,
                    useValue: {
                        error: (msg: string) => alertsEmitted.push({ type: 'error', message: msg }),
                        success: (msg: string) => alertsEmitted.push({ type: 'success', message: msg }),
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PerfilEmpresaCertificados);
        component = fixture.componentInstance;

        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fixture.detectChanges();
    });

    afterEach(() => sessionStorage.clear());

    // ---------------------------------------------------------------------------
    // [C1] Camino 1,2,3,4,5,6,F
    // certificadoForm inválido → alert.error('Completa las fechas') + return
    // ---------------------------------------------------------------------------
    it('[C1] Camino 1,2,3,4,5,6,F — formulario inválido → alert.error("Completa las fechas") sin llamada HTTP', () => {
        // Formulario con fechas vacías → invalid = true
        component.certificadoForm.setValue({ fechaEmision: '', fechaCaducidad: '' });
        component.idEditando = 'cert-uuid';

        component.guardarEdicion();

        expect(alertsEmitted.length).toBe(1);
        expect(alertsEmitted[0].type).toBe('error');
        expect(alertsEmitted[0].message).toBe('Completa las fechas');
        expect(perfilSpy.updateCertificado).not.toHaveBeenCalled();
    });

    // ---------------------------------------------------------------------------
    // [C2] Camino 1,2,3,4,7,8,12,F
    // Formulario válido → updateCertificado → error() → alert.error('Error al actualizar certificado')
    // ---------------------------------------------------------------------------
    it('[C2] Camino 1,2,3,4,7,8,12,F — formulario válido → updateCertificado error → alert.error("Error al actualizar certificado")', () => {
        component.certificadoForm.setValue({
            fechaEmision: '2024-01-01',
            fechaCaducidad: '2025-01-01',
        });
        component.idEditando = 'cert-uuid';
        perfilSpy.updateCertificado.and.returnValue(throwError(() => new Error('server error')));

        component.guardarEdicion();

        expect(perfilSpy.updateCertificado).toHaveBeenCalledWith(
            'cert-uuid',
            jasmine.objectContaining({
                fecha_emision: '2024-01-01',
                fecha_caducidad: '2025-01-01',
            })
        );
        expect(alertsEmitted.length).toBe(1);
        expect(alertsEmitted[0].type).toBe('error');
        expect(alertsEmitted[0].message).toBe('Error al actualizar certificado');
    });

    // ---------------------------------------------------------------------------
    // [C3] Camino 1,2,3,4,7,8,9,10,11,13,F
    // Formulario válido → updateCertificado → next() → alert.success + resetForm + cargarCertificados + activeTab='list'
    // ---------------------------------------------------------------------------
    it('[C3] Camino 1,2,3,4,7,8,9,10,11,13,F — formulario válido → updateCertificado next → alert.success + reset + activeTab=list', () => {
        component.certificadoForm.setValue({
            fechaEmision: '2024-03-15',
            fechaCaducidad: '2026-03-15',
        });
        component.idEditando = 'cert-uuid';
        component.modoEdicion = true;
        component.activeTab = 'form';
        perfilSpy.updateCertificado.and.returnValue(of({ id_detalles_certificados: 'cert-uuid' }));
        perfilSpy.getCertificadosOfEmpresa.and.returnValue(of([]));

        component.guardarEdicion();

        expect(alertsEmitted.length).toBe(1);
        expect(alertsEmitted[0].type).toBe('success');
        expect(alertsEmitted[0].message).toBe('Certificado actualizado');

        expect(component.modoEdicion).toBeFalse();
        expect(component.idEditando).toBeNull();
        expect(component.certificadoForm.value.fechaEmision).toBeNull();

        expect(perfilSpy.getCertificadosOfEmpresa).toHaveBeenCalled();

        expect(component.activeTab).toBe('list');
    });

 
    it('guardarEdicion() — construye datos con fechaEmision y fechaCaducidad del formulario', () => {
        component.certificadoForm.setValue({
            fechaEmision: '2023-06-01',
            fechaCaducidad: '2024-06-01',
        });
        component.idEditando = 'cert-uuid-x';
        perfilSpy.updateCertificado.and.returnValue(of({}));

        component.guardarEdicion();

        expect(perfilSpy.updateCertificado).toHaveBeenCalledWith(
            'cert-uuid-x',
            { fecha_emision: '2023-06-01', fecha_caducidad: '2024-06-01' }
        );
    });

    it('guardarEdicion() — solo fecha de emisión vacía → alert.error("Completa las fechas")', () => {
        component.certificadoForm.setValue({ fechaEmision: '', fechaCaducidad: '2025-01-01' });
        component.idEditando = 'cert-uuid';

        component.guardarEdicion();

        expect(alertsEmitted[0].message).toBe('Completa las fechas');
        expect(perfilSpy.updateCertificado).not.toHaveBeenCalled();
    });

    it('guardarEdicion() — solo fecha de caducidad vacía → alert.error("Completa las fechas")', () => {
        component.certificadoForm.setValue({ fechaEmision: '2024-01-01', fechaCaducidad: '' });
        component.idEditando = 'cert-uuid';

        component.guardarEdicion();

        expect(alertsEmitted[0].message).toBe('Completa las fechas');
        expect(perfilSpy.updateCertificado).not.toHaveBeenCalled();
    });

    it('guardarEdicion() — no navega a list cuando el formulario es inválido', () => {
        component.certificadoForm.setValue({ fechaEmision: '', fechaCaducidad: '' });
        component.activeTab = 'form';

        component.guardarEdicion();

        expect(component.activeTab).toBe('form');
    });

    it('guardarEdicion() — no llama a resetForm ni a cargarCertificados cuando hay error HTTP', () => {
        component.certificadoForm.setValue({
            fechaEmision: '2024-01-01',
            fechaCaducidad: '2025-01-01',
        });
        component.idEditando = 'cert-uuid';
        component.modoEdicion = true;
        perfilSpy.updateCertificado.and.returnValue(throwError(() => new Error('err')));

        component.guardarEdicion();

        expect(component.modoEdicion).toBeTrue();
        expect(component.activeTab).toBe('list'); 
        expect(perfilSpy.getCertificadosOfEmpresa).toHaveBeenCalledTimes(1);
    });

    it('guardarEdicion() — usa idEditando como id en la petición HTTP', () => {
        component.certificadoForm.setValue({
            fechaEmision: '2024-01-01',
            fechaCaducidad: '2025-12-31',
        });
        component.idEditando = 'mi-id-especifico-uuid';
        perfilSpy.updateCertificado.and.returnValue(of({}));

        component.guardarEdicion();

        const [idUsado] = perfilSpy.updateCertificado.calls.mostRecent().args;
        expect(idUsado).toBe('mi-id-especifico-uuid');
    });
});