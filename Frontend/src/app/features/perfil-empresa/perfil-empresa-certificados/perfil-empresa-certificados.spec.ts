<<<<<<< HEAD
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
=======
// =============================================================================
// HU — Editar Certificado | Frontend
// Archivo: src/app/features/perfil-empresa-certificados/perfil-empresa-certificados.spec.ts
// =============================================================================

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';

>>>>>>> cb1c1e54546b91c41894376b4e2a90e53adbd20a
import { PerfilEmpresaCertificados } from './perfil-empresa-certificados';
import { Perfil } from '../../../shared/services/perfil';
import { Alerts } from '../../../shared/services/alerts';

<<<<<<< HEAD
describe('PerfilEmpresaCertificados', () => {
  let component: PerfilEmpresaCertificados;
  let fixture: ComponentFixture<PerfilEmpresaCertificados>;
  let perfilSpy: jasmine.SpyObj<Perfil>;
  let alertsSpy: jasmine.SpyObj<Alerts>;

  beforeEach(async () => {
    perfilSpy = jasmine.createSpyObj<Perfil>('Perfil', [
      'getCerticados',
      'getCertificadosOfEmpresa',
      'createCertificado',
    ]);

    alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['error', 'success']);

    perfilSpy.getCerticados.and.returnValue(of([]));
    perfilSpy.getCertificadosOfEmpresa.and.returnValue(of([]));
    perfilSpy.createCertificado.and.returnValue(of({ ok: true }));

    await TestBed.configureTestingModule({
      imports: [PerfilEmpresaCertificados],
      providers: [
        { provide: Perfil, useValue: perfilSpy },
        { provide: Alerts, useValue: alertsSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilEmpresaCertificados);
    component = fixture.componentInstance;
    component.idEmpresa = 'empresa-1';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('cargarCatalogoCertificados success', () => {
    const catalogoMock: Certificado[] = [
      {
        id_certificado: 'cert-1',
        entidad_emisora: 'Google',
        nombre_certificado: 'Cloud Associate',
      },
    ];
    perfilSpy.getCerticados.and.returnValue(of(catalogoMock));

    component.cargarCatalogoCertificados();

    expect(perfilSpy.getCerticados).toHaveBeenCalled();
    expect(component.certificados).toEqual(catalogoMock);
  });

  it('cargarCatalogoCertificados error alert ', () => {
    perfilSpy.getCerticados.and.returnValue(throwError(() => new Error('network error')));
    component.cargarCatalogoCertificados();

    expect(alertsSpy.error).toHaveBeenCalledWith('Error al cargar el catálogo de certificados');
  });

  it('seleccionarCertificado  set certificadoSeleccionado y cerrar dropdown', () => {
    const cert: Certificado = {
      id_certificado: 'cert-2',
      entidad_emisora: 'AWS',
      nombre_certificado: 'Solutions Architect',
    };
    component.mostrarDropdown = true;

    component.seleccionarCertificado(cert);

    expect(component.certificadoSeleccionado).toEqual(cert);
    expect(component.mostrarDropdown).toBeFalse();
  });

  it('agregarCertificado error si no se selecciono certificadoSeleccionado', () => {
    component.certificadoSeleccionado = null;

    component.agregarCertificado();

    expect(alertsSpy.error).toHaveBeenCalledWith('Selecciona un certificado');
    expect(perfilSpy.createCertificado).not.toHaveBeenCalled();
  });

  it('agregarCertificado  error when form invalid', () => {
    component.certificadoSeleccionado = {
      id_certificado: 'cert-3',
      entidad_emisora: 'Microsoft',
      nombre_certificado: 'Azure Fundamentals',
    };
    component.certificadoForm.patchValue({
      fechaEmision: '',
      fechaCaducidad: '',
    });

    component.agregarCertificado();

    expect(alertsSpy.error).toHaveBeenCalledWith('Completa las fechas');
    expect(perfilSpy.createCertificado).not.toHaveBeenCalled();
  });

  it('agregarCertificado  error when form invalid fecha emision despues de caducidad', () => {
    component.certificadoSeleccionado = {
      id_certificado: 'cert-3',
      entidad_emisora: 'Microsoft',
      nombre_certificado: 'Azure Fundamentals',
    };
    component.certificadoForm.patchValue({
      fechaEmision: '2028-01-01',
      fechaCaducidad: '2026-01-01',
    });

    component.agregarCertificado();

    expect(alertsSpy.error).toHaveBeenCalledWith('Completa las fechas');
    expect(perfilSpy.createCertificado).not.toHaveBeenCalled();
  });

  it('agregarCertificado crear certificado success', () => {
    component.certificadoSeleccionado = {
      id_certificado: 'cert-4',
      entidad_emisora: 'Oracle',
      nombre_certificado: 'OCI Foundations',
    };
    component.certificadoForm.patchValue({
      fechaEmision: '2026-01-01',
      fechaCaducidad: '2028-01-01',
    });
    const resetSpy = spyOn(component, 'resetForm');
    const cargarSpy = spyOn(component, 'cargarCertificados');

    component.agregarCertificado();

    expect(perfilSpy.createCertificado).toHaveBeenCalledWith({
      certificado: { id_certificado: 'cert-4' },
      empresa: { id: 'empresa-1' },
      fecha_emision: '2026-01-01',
      fecha_caducidad: '2028-01-01',
    });
    expect(alertsSpy.success).toHaveBeenCalledWith('Certificado agregado');
    expect(resetSpy).toHaveBeenCalled();
    expect(cargarSpy).toHaveBeenCalled();
    expect(component.activeTab).toBe('list');
  });

  it('agregarCertificado error ', () => {
    component.certificadoSeleccionado = {
      id_certificado: 'cert-5',
      entidad_emisora: 'Cisco',
      nombre_certificado: 'CCNA',
    };
    component.certificadoForm.patchValue({
      fechaEmision: '2026-02-01',
      fechaCaducidad: '2029-02-01',
    });

    perfilSpy.createCertificado.and.returnValue(throwError(() => new Error('backend error')));

    component.agregarCertificado();

    expect(alertsSpy.error).toHaveBeenCalledWith('Error al agregar certificado');
  });
});
=======
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
>>>>>>> cb1c1e54546b91c41894376b4e2a90e53adbd20a
