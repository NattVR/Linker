import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { Alerts } from '../../../shared/services/alerts';
import { Perfil } from '../../../shared/services/perfil';
import { PerfilEmpresaCertificados } from './perfil-empresa-certificados';

describe('PerfilEmpresaCertificados', () => {
  let component: PerfilEmpresaCertificados;
  let fixture: ComponentFixture<PerfilEmpresaCertificados>;
  let perfilSpy: jasmine.SpyObj<Perfil>;
  let alertsSpy: jasmine.SpyObj<Alerts>;
  let sessionStorageGetItemSpy: jasmine.Spy;

  const perfilId = 'empresa-1';

  function buildCertificado(overrides: Partial<Certificado> = {}): Certificado {
    return {
      id_certificado: 'cert-1',
      entidad_emisora: 'Google',
      nombre_certificado: 'Cloud Associate',
      ...overrides,
    };
  }

  function buildCertificadoEmpresa(): CertificadoEmpresa {
    return {
      id_detalles_certificados: 'detalle-1',
      certificado: {
        entidad_emisora: 'Google',
        nombre_certificado: 'Cloud Associate',
      },
      fecha_emision: '2024-01-01',
      fecha_caducidad: '2026-01-01',
    };
  }

  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  function getTomorrow(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow);
  }

  function createComponent(
    idEmpresa: string | null = perfilId,
    runInitialChangeDetection = false
  ): void {
    sessionStorageGetItemSpy.and.callFake((key: string): string | null => {
      if (key === 'perfilId') {
        return idEmpresa;
      }

      return null;
    });

    fixture = TestBed.createComponent(PerfilEmpresaCertificados);
    component = fixture.componentInstance;

    if (runInitialChangeDetection) {
      fixture.detectChanges();
    }
  }

  function fillValidCreateForm(): void {
    component.certificadoSeleccionado = buildCertificado();
    component.certificadoForm.setValue({
      fechaEmision: '2024-01-01',
      fechaCaducidad: '2026-01-01',
    });
  }

  beforeEach(async () => {
    perfilSpy = jasmine.createSpyObj<Perfil>('Perfil', [
      'getCerticados',
      'getCertificadosOfEmpresa',
      'createCertificado',
      'updateCertificado',
      'deleteCertificado',
    ]);
    alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['error', 'success']);

    perfilSpy.getCerticados.and.returnValue(of([]));
    perfilSpy.getCertificadosOfEmpresa.and.returnValue(of([]));
    perfilSpy.createCertificado.and.returnValue(of({ ok: true }));
    perfilSpy.updateCertificado.and.returnValue(of({ ok: true }));
    perfilSpy.deleteCertificado.and.returnValue(of({ ok: true }));

    await TestBed.configureTestingModule({
      imports: [PerfilEmpresaCertificados],
      providers: [
        { provide: Perfil, useValue: perfilSpy },
        { provide: Alerts, useValue: alertsSpy },
      ],
    })
      .overrideComponent(PerfilEmpresaCertificados, {
        set: {
          template: '',
          imports: [ReactiveFormsModule],
        },
      })
      .compileComponents();

    sessionStorageGetItemSpy = spyOn(sessionStorage, 'getItem');
  });

  it('should create with the default state', () => {
    // Arrange
    createComponent();

    // Assert
    expect(component).toBeTruthy();
    expect(component.activeTab).toBe('list');
    expect(component.mostrarDropdown).toBeFalse();
    expect(component.modoEdicion).toBeFalse();
    expect(component.certificadoSeleccionado).toBeNull();
    expect(component.certificadoForm.invalid).toBeTrue();
  });

  it('should load catalog and company certificates on init when the company id exists', () => {
    // Arrange
    const catalogo = [buildCertificado()];
    const certificadosEmpresa = [buildCertificadoEmpresa()];
    perfilSpy.getCerticados.and.returnValue(of(catalogo));
    perfilSpy.getCertificadosOfEmpresa.and.returnValue(of(certificadosEmpresa));
    createComponent(perfilId);

    // Act
    fixture.detectChanges();

    // Assert
    expect(perfilSpy.getCerticados).toHaveBeenCalled();
    expect(perfilSpy.getCertificadosOfEmpresa).toHaveBeenCalledWith(perfilId);
    expect(component.certificados).toEqual(catalogo);
    expect(component.certificadosOfEmpresa).toEqual(certificadosEmpresa);
  });

  it('should skip company certificate loading on init when the company id is missing', () => {
    // Arrange
    createComponent(null);

    // Act
    fixture.detectChanges();

    // Assert
    expect(perfilSpy.getCerticados).toHaveBeenCalled();
    expect(perfilSpy.getCertificadosOfEmpresa).not.toHaveBeenCalled();
    expect(component.certificadosOfEmpresa).toEqual([]);
  });

  it('should show an error when the catalog request fails', () => {
    // Arrange
    perfilSpy.getCerticados.and.returnValue(
      throwError(() => new Error('catalog failed'))
    );
    createComponent(perfilId);

    // Act
    fixture.detectChanges();

    // Assert
    expect(alertsSpy.error).toHaveBeenCalledWith(
      jasmine.stringMatching(/^Error al cargar el cat/)
    );
  });

  it('should show an error when loading company certificates fails', () => {
    // Arrange
    perfilSpy.getCertificadosOfEmpresa.and.returnValue(
      throwError(() => new Error('list failed'))
    );
    createComponent(perfilId);

    // Act
    fixture.detectChanges();

    // Assert
    expect(alertsSpy.error).toHaveBeenCalledWith(
      'Error al obtener los certificados'
    );
  });

  it('should toggle the dropdown visibility', () => {
    // Arrange
    createComponent();

    // Act
    component.toggleDropdown();
    component.toggleDropdown();

    // Assert
    expect(component.mostrarDropdown).toBeFalse();
  });

  it('should select a certificate and close the dropdown', () => {
    // Arrange
    const certificado = buildCertificado({ id_certificado: 'cert-2' });
    createComponent();
    component.mostrarDropdown = true;

    // Act
    component.seleccionarCertificado(certificado);

    // Assert
    expect(component.certificadoSeleccionado).toEqual(certificado);
    expect(component.mostrarDropdown).toBeFalse();
  });

  it('should keep the current form state when switching to the list tab', () => {
    // Arrange
    const certificado = buildCertificado();
    createComponent();
    component.certificadoSeleccionado = certificado;
    component.certificadoForm.setValue({
      fechaEmision: '2024-01-01',
      fechaCaducidad: '2026-01-01',
    });

    // Act
    component.setActiveTab('list');

    // Assert
    expect(component.activeTab).toBe('list');
    expect(component.certificadoSeleccionado).toEqual(certificado);
    expect(component.certificadoForm.getRawValue()).toEqual({
      fechaEmision: '2024-01-01',
      fechaCaducidad: '2026-01-01',
    });
  });

  it('should reset the form state when switching to the form tab', () => {
    // Arrange
    const certificadoEmpresa = buildCertificadoEmpresa();
    createComponent();
    component.iniciarEdicion(certificadoEmpresa);

    // Act
    component.setActiveTab('form');

    // Assert
    expect(component.activeTab).toBe('form');
    expect(component.modoEdicion).toBeFalse();
    expect(component.certificadoSeleccionado).toBeNull();
    expect(component.certificadoForm.getRawValue()).toEqual({
      fechaEmision: null,
      fechaCaducidad: null,
    });
  });

  it('should cancel the edition and return to the list tab', () => {
    // Arrange
    const certificadoEmpresa = buildCertificadoEmpresa();
    createComponent();
    component.iniciarEdicion(certificadoEmpresa);

    // Act
    component.cancelarEdicion();

    // Assert
    expect(component.activeTab).toBe('list');
    expect(component.modoEdicion).toBeFalse();
    expect(component.certificadoSeleccionado).toBeNull();
    expect(component.certificadoForm.getRawValue()).toEqual({
      fechaEmision: null,
      fechaCaducidad: null,
    });
  });

  it('should block creation when no certificate is selected', () => {
    // Arrange
    createComponent();
    component.certificadoForm.setValue({
      fechaEmision: '2024-01-01',
      fechaCaducidad: '2026-01-01',
    });

    // Act
    component.submitForm();

    // Assert
    expect(alertsSpy.error).toHaveBeenCalledWith('Selecciona un certificado');
    expect(perfilSpy.createCertificado).not.toHaveBeenCalled();
  });

  it('should mark form controls as touched when the dates are missing', () => {
    // Arrange
    createComponent();
    component.certificadoSeleccionado = buildCertificado();
    component.certificadoForm.setValue({
      fechaEmision: '',
      fechaCaducidad: '',
    });

    // Act
    component.submitForm();

    // Assert
    expect(component.certificadoForm.get('fechaEmision')?.touched).toBeTrue();
    expect(component.certificadoForm.get('fechaCaducidad')?.touched).toBeTrue();
    expect(alertsSpy.error).toHaveBeenCalledWith('Completa las fechas');
    expect(perfilSpy.createCertificado).not.toHaveBeenCalled();
  });

  it('should reject a future emission date during creation', () => {
    // Arrange
    createComponent();
    component.certificadoSeleccionado = buildCertificado();
    component.certificadoForm.setValue({
      fechaEmision: getTomorrow(),
      fechaCaducidad: '2030-01-01',
    });

    // Act
    component.submitForm();

    // Assert
    expect(alertsSpy.error).toHaveBeenCalledWith(
      jasmine.stringMatching(/^La fecha de emisi/)
    );
    expect(perfilSpy.createCertificado).not.toHaveBeenCalled();
  });

  it('should reject an expiration date that is not after the emission date', () => {
    // Arrange
    createComponent();
    component.certificadoSeleccionado = buildCertificado();
    component.certificadoForm.setValue({
      fechaEmision: '2024-05-01',
      fechaCaducidad: '2024-05-01',
    });

    // Act
    component.submitForm();

    // Assert
    expect(alertsSpy.error).toHaveBeenCalledWith(
      jasmine.stringMatching(/^La caducidad debe ser posterior/)
    );
    expect(perfilSpy.createCertificado).not.toHaveBeenCalled();
  });

  it('should create a certificate and reset the form on success', () => {
    // Arrange
    createComponent();
    fillValidCreateForm();

    // Act
    component.submitForm();

    // Assert
    expect(perfilSpy.createCertificado).toHaveBeenCalledWith({
      certificado: { id_certificado: 'cert-1' },
      empresa: { id: perfilId },
      fecha_emision: '2024-01-01',
      fecha_caducidad: '2026-01-01',
    });
    expect(alertsSpy.success).toHaveBeenCalledWith('Certificado agregado');
    expect(perfilSpy.getCertificadosOfEmpresa).toHaveBeenCalledWith(perfilId);
    expect(component.activeTab).toBe('list');
    expect(component.modoEdicion).toBeFalse();
    expect(component.certificadoSeleccionado).toBeNull();
    expect(component.certificadoForm.getRawValue()).toEqual({
      fechaEmision: null,
      fechaCaducidad: null,
    });
  });

  it('should show an error when the create request fails', () => {
    // Arrange
    perfilSpy.createCertificado.and.returnValue(
      throwError(() => new Error('create failed'))
    );
    createComponent();
    fillValidCreateForm();

    // Act
    component.submitForm();

    // Assert
    expect(alertsSpy.error).toHaveBeenCalledWith('Error al agregar certificado');
    expect(perfilSpy.getCertificadosOfEmpresa).not.toHaveBeenCalled();
  });

  it('should enter edit mode with the selected certificate data', () => {
    // Arrange
    const certificadoEmpresa = buildCertificadoEmpresa();
    createComponent();

    // Act
    component.iniciarEdicion(certificadoEmpresa);

    // Assert
    expect(component.modoEdicion).toBeTrue();
    expect(component.activeTab).toBe('form');
    expect(component.certificadoSeleccionado).toEqual(
      certificadoEmpresa.certificado as Certificado
    );
    expect(component.certificadoForm.getRawValue()).toEqual({
      fechaEmision: '2024-01-01',
      fechaCaducidad: '2026-01-01',
    });
  });

  it('should block the edit flow when the form is invalid', () => {
    // Arrange
    const certificadoEmpresa = buildCertificadoEmpresa();
    createComponent();
    component.iniciarEdicion(certificadoEmpresa);
    component.certificadoForm.setValue({
      fechaEmision: '',
      fechaCaducidad: '',
    });

    // Act
    component.submitForm();

    // Assert
    expect(alertsSpy.error).toHaveBeenCalledWith('Completa las fechas');
    expect(perfilSpy.updateCertificado).not.toHaveBeenCalled();
    expect(component.activeTab).toBe('form');
  });

  it('should update a certificate and reset the edit state on success', () => {
    // Arrange
    const certificadoEmpresa = buildCertificadoEmpresa();
    createComponent();
    component.iniciarEdicion(certificadoEmpresa);
    component.certificadoForm.setValue({
      fechaEmision: '2024-03-10',
      fechaCaducidad: '2027-03-10',
    });

    // Act
    component.submitForm();

    // Assert
    expect(perfilSpy.updateCertificado).toHaveBeenCalledWith('detalle-1', {
      fecha_emision: '2024-03-10',
      fecha_caducidad: '2027-03-10',
    });
    expect(alertsSpy.success).toHaveBeenCalledWith('Certificado actualizado');
    expect(perfilSpy.getCertificadosOfEmpresa).toHaveBeenCalledWith(perfilId);
    expect(component.activeTab).toBe('list');
    expect(component.modoEdicion).toBeFalse();
    expect(component.certificadoSeleccionado).toBeNull();
    expect(component.certificadoForm.getRawValue()).toEqual({
      fechaEmision: null,
      fechaCaducidad: null,
    });
  });

  it('should show an error when the update request fails', () => {
    // Arrange
    const certificadoEmpresa = buildCertificadoEmpresa();
    perfilSpy.updateCertificado.and.returnValue(
      throwError(() => new Error('update failed'))
    );
    createComponent();
    component.iniciarEdicion(certificadoEmpresa);
    component.certificadoForm.setValue({
      fechaEmision: '2024-03-10',
      fechaCaducidad: '2027-03-10',
    });

    // Act
    component.submitForm();

    // Assert
    expect(alertsSpy.error).toHaveBeenCalledWith(
      'Error al actualizar certificado'
    );
    expect(component.activeTab).toBe('form');
    expect(component.modoEdicion).toBeTrue();
  });

  it('should stop the delete flow when the user cancels the confirmation', () => {
    // Arrange
    createComponent();
    spyOn(window, 'confirm').and.returnValue(false);

    // Act
    component.eliminarCertificado('detalle-1');

    // Assert
    expect(perfilSpy.deleteCertificado).not.toHaveBeenCalled();
    expect(perfilSpy.getCertificadosOfEmpresa).not.toHaveBeenCalled();
  });

  it('should delete a certificate and reload the list when the user confirms', () => {
    // Arrange
    createComponent();
    spyOn(window, 'confirm').and.returnValue(true);

    // Act
    component.eliminarCertificado('detalle-1');

    // Assert
    expect(perfilSpy.deleteCertificado).toHaveBeenCalledWith('detalle-1');
    expect(alertsSpy.success).toHaveBeenCalledWith('Certificado eliminado');
    expect(perfilSpy.getCertificadosOfEmpresa).toHaveBeenCalledWith(perfilId);
  });

  it('should show an error when the delete request fails', () => {
    // Arrange
    perfilSpy.deleteCertificado.and.returnValue(
      throwError(() => new Error('delete failed'))
    );
    createComponent();
    spyOn(window, 'confirm').and.returnValue(true);

    // Act
    component.eliminarCertificado('detalle-1');

    // Assert
    expect(alertsSpy.error).toHaveBeenCalledWith('Error al eliminar certificado');
    expect(perfilSpy.getCertificadosOfEmpresa).not.toHaveBeenCalled();
  });
});
