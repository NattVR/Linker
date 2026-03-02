import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PerfilEmpresaCertificados } from './perfil-empresa-certificados';
import { Perfil } from '../../../shared/services/perfil';
import { Alerts } from '../../../shared/services/alerts';

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
