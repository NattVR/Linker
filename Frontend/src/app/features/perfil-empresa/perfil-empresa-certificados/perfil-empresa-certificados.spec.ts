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

  it('create default state', () => {
    
    createComponent();

    
    expect(component).toBeTruthy();
    expect(component.activeTab).toBe('list');
    expect(component.mostrarDropdown).toBeFalse();
    expect(component.modoEdicion).toBeFalse();
    expect(component.certificadoSeleccionado).toBeNull();
    expect(component.certificadoForm.invalid).toBeTrue();
  });

  it('load catalogo and company certificates oninit id exists', () => {
  
    const catalogo = [buildCertificado()];
    const certificadosEmpresa = [buildCertificadoEmpresa()];
    perfilSpy.getCerticados.and.returnValue(of(catalogo));
    perfilSpy.getCertificadosOfEmpresa.and.returnValue(of(certificadosEmpresa));
    createComponent(perfilId);

  
    fixture.detectChanges();


    expect(perfilSpy.getCerticados).toHaveBeenCalled();
    expect(perfilSpy.getCertificadosOfEmpresa).toHaveBeenCalledWith(perfilId);
    expect(component.certificados).toEqual(catalogo);
    expect(component.certificadosOfEmpresa).toEqual(certificadosEmpresa);
  });

  it('saltar company certificate oninit company id missing', () => {
    
    createComponent(null);

    fixture.detectChanges();

    expect(perfilSpy.getCerticados).toHaveBeenCalled();
    expect(perfilSpy.getCertificadosOfEmpresa).not.toHaveBeenCalled();
    expect(component.certificadosOfEmpresa).toEqual([]);
  });

  it(' error cuando catalog request fails', () => {
    
    perfilSpy.getCerticados.and.returnValue(
      throwError(() => new Error('catalog failed'))
    );
    createComponent(perfilId);

    fixture.detectChanges();

    expect(alertsSpy.error).toHaveBeenCalledWith(
      jasmine.stringMatching(/^Error al cargar el cat/)
    );
  });

  it('error cuando loading company certificates fails', () => {
   
    perfilSpy.getCertificadosOfEmpresa.and.returnValue(
      throwError(() => new Error('list failed'))
    );
    createComponent(perfilId);

    fixture.detectChanges();

    expect(alertsSpy.error).toHaveBeenCalledWith(
      'Error al obtener los certificados'
    );
  });

  it('stoggle the dropdown visibility', () => {

    createComponent();

    component.toggleDropdown();
    component.toggleDropdown();

    expect(component.mostrarDropdown).toBeFalse();
  });

  it('select  certificate y close dropdown', () => {
  
    const certificado = buildCertificado({ id_certificado: 'cert-2' });
    createComponent();
    component.mostrarDropdown = true;

    component.seleccionarCertificado(certificado);

    expect(component.certificadoSeleccionado).toEqual(certificado);
    expect(component.mostrarDropdown).toBeFalse();
  });

  it('keep stat cuando se cambia  a list tab', () => {
  
    const certificado = buildCertificado();
    createComponent();
    component.certificadoSeleccionado = certificado;
    component.certificadoForm.setValue({
      fechaEmision: '2024-01-01',
      fechaCaducidad: '2026-01-01',
    });
 
    component.setActiveTab('list');

    expect(component.activeTab).toBe('list');
    expect(component.certificadoSeleccionado).toEqual(certificado);
    expect(component.certificadoForm.getRawValue()).toEqual({
      fechaEmision: '2024-01-01',
      fechaCaducidad: '2026-01-01',
    });
  });

  it('reset form cuando cambia a form tab', () => {

    const certificadoEmpresa = buildCertificadoEmpresa();
    createComponent();
    component.iniciarEdicion(certificadoEmpresa);

    component.setActiveTab('form');

    expect(component.activeTab).toBe('form');
    expect(component.modoEdicion).toBeFalse();
    expect(component.certificadoSeleccionado).toBeNull();
    expect(component.certificadoForm.getRawValue()).toEqual({
      fechaEmision: null,
      fechaCaducidad: null,
    });
  });

  it('cancel edition and return a list tab', () => {
   
    const certificadoEmpresa = buildCertificadoEmpresa();
    createComponent();
    component.iniciarEdicion(certificadoEmpresa);

    component.cancelarEdicion();

    expect(component.activeTab).toBe('list');
    expect(component.modoEdicion).toBeFalse();
    expect(component.certificadoSeleccionado).toBeNull();
    expect(component.certificadoForm.getRawValue()).toEqual({
      fechaEmision: null,
      fechaCaducidad: null,
    });
  });

  it('bloquear creation no hay certificate selected', () => {
    createComponent();
    component.certificadoForm.setValue({
      fechaEmision: '2024-01-01',
      fechaCaducidad: '2026-01-01',
    });

   
    component.submitForm();

    expect(alertsSpy.error).toHaveBeenCalledWith('Selecciona un certificado');
    expect(perfilSpy.createCertificado).not.toHaveBeenCalled();
  });

  it(' mark form controls como touched fechas missing', () => {

    createComponent();
    component.certificadoSeleccionado = buildCertificado();
    component.certificadoForm.setValue({
      fechaEmision: '',
      fechaCaducidad: '',
    });

    component.submitForm();

    expect(component.certificadoForm.get('fechaEmision')?.touched).toBeTrue();
    expect(component.certificadoForm.get('fechaCaducidad')?.touched).toBeTrue();
    expect(alertsSpy.error).toHaveBeenCalledWith('Completa las fechas');
    expect(perfilSpy.createCertificado).not.toHaveBeenCalled();
  });

  it('rechazar fecha emision futura', () => {
  
    createComponent();
    component.certificadoSeleccionado = buildCertificado();
    component.certificadoForm.setValue({
      fechaEmision: getTomorrow(),
      fechaCaducidad: '2030-01-01',
    });

    component.submitForm();

    expect(alertsSpy.error).toHaveBeenCalledWith(
      jasmine.stringMatching(/^La fecha de emisi/)
    );
    expect(perfilSpy.createCertificado).not.toHaveBeenCalled();
  });

  it(' rechazar fecha expiracion si no es despues de fecha emision', () => {
    // Arrange
    createComponent();
    component.certificadoSeleccionado = buildCertificado();
    component.certificadoForm.setValue({
      fechaEmision: '2024-05-01',
      fechaCaducidad: '2024-05-01',
    });

 
    component.submitForm();

    
    expect(alertsSpy.error).toHaveBeenCalledWith(
      jasmine.stringMatching(/^La caducidad debe ser posterior/)
    );
    expect(perfilSpy.createCertificado).not.toHaveBeenCalled();
  });

  it(' create certificate and reset cuando success', () => {

    createComponent();
    fillValidCreateForm();

    component.submitForm();

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

  it('error create request fails', () => {
    
    perfilSpy.createCertificado.and.returnValue(
      throwError(() => new Error('create failed'))
    );
    createComponent();
    fillValidCreateForm();

    component.submitForm();

    expect(alertsSpy.error).toHaveBeenCalledWith('Error al agregar certificado');
    expect(perfilSpy.getCertificadosOfEmpresa).not.toHaveBeenCalled();
  });

  it('edit mode with the selected certificate data', () => {
   
    const certificadoEmpresa = buildCertificadoEmpresa();
    createComponent();

    component.iniciarEdicion(certificadoEmpresa);

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

  it('block edit flow cuando form is invalid', () => {
  
    const certificadoEmpresa = buildCertificadoEmpresa();
    createComponent();
    component.iniciarEdicion(certificadoEmpresa);
    component.certificadoForm.setValue({
      fechaEmision: '',
      fechaCaducidad: '',
    });

    component.submitForm();

    expect(alertsSpy.error).toHaveBeenCalledWith('Completa las fechas');
    expect(perfilSpy.updateCertificado).not.toHaveBeenCalled();
    expect(component.activeTab).toBe('form');
  });

  it(' update certificate-reset on success', () => {

    const certificadoEmpresa = buildCertificadoEmpresa();
    createComponent();
    component.iniciarEdicion(certificadoEmpresa);
    component.certificadoForm.setValue({
      fechaEmision: '2024-03-10',
      fechaCaducidad: '2027-03-10',
    });

    component.submitForm();

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

  it(' error update request fails', () => {
  
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

    component.submitForm();


    expect(alertsSpy.error).toHaveBeenCalledWith(
      'Error al actualizar certificado'
    );
    expect(component.activeTab).toBe('form');
    expect(component.modoEdicion).toBeTrue();
  });

  it('stop the delete flow  user cancels confirmation', () => {

    createComponent();
    spyOn(window, 'confirm').and.returnValue(false);

 
    component.eliminarCertificado('detalle-1');

   
    expect(perfilSpy.deleteCertificado).not.toHaveBeenCalled();
    expect(perfilSpy.getCertificadosOfEmpresa).not.toHaveBeenCalled();
  });

  it('should delete a certificate y reload user confirms', () => {

    createComponent();
    spyOn(window, 'confirm').and.returnValue(true);


    component.eliminarCertificado('detalle-1');

    expect(perfilSpy.deleteCertificado).toHaveBeenCalledWith('detalle-1');
    expect(alertsSpy.success).toHaveBeenCalledWith('Certificado eliminado');
    expect(perfilSpy.getCertificadosOfEmpresa).toHaveBeenCalledWith(perfilId);
  });

  it('error cuando delete request fails', () => {
    perfilSpy.deleteCertificado.and.returnValue(
      throwError(() => new Error('delete failed'))
    );
    createComponent();
    spyOn(window, 'confirm').and.returnValue(true);

    component.eliminarCertificado('detalle-1');

    expect(alertsSpy.error).toHaveBeenCalledWith('Error al eliminar certificado');
    expect(perfilSpy.getCertificadosOfEmpresa).not.toHaveBeenCalled();
  });
});
