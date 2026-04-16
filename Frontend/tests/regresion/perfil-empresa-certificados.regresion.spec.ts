import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PerfilEmpresaCertificados } from '../../src/app/features/perfil-empresa/perfil-empresa-certificados/perfil-empresa-certificados';
import { Alerts } from '../../src/app/shared/services/alerts';
import { Perfil } from '../../src/app/shared/services/perfil';

describe('PerfilEmpresaCertificados regresion', () => {
  let fixture: ComponentFixture<PerfilEmpresaCertificados>;
  let component: PerfilEmpresaCertificados;
  let perfilSpy: jasmine.SpyObj<Perfil>;
  let alertsSpy: jasmine.SpyObj<Alerts>;

  const certificadoCatalogo: Certificado = {
    id_certificado: 'cert-1',
    nombre_certificado: 'ISO 27001',
    entidad_emisora: 'ICONTEC',
  };

  const certificadoEmpresa: CertificadoEmpresa = {
    id_detalles_certificados: 'detalle-1',
    certificado: {
      nombre_certificado: 'ISO 27001',
      entidad_emisora: 'ICONTEC',
    },
    fecha_emision: '2024-01-01',
    fecha_caducidad: '2026-01-01',
  };

  beforeEach(async () => {
    perfilSpy = jasmine.createSpyObj<Perfil>('Perfil', [
      'getCerticados',
      'getCertificadosOfEmpresa',
      'createCertificado',
      'updateCertificado',
      'deleteCertificado',
    ]);
    alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['error', 'success']);

    perfilSpy.getCerticados.and.returnValue(of([certificadoCatalogo]));
    perfilSpy.getCertificadosOfEmpresa.and.returnValue(of([certificadoEmpresa]));
    perfilSpy.createCertificado.and.returnValue(of({ ok: true }));
    perfilSpy.updateCertificado.and.returnValue(of({ ok: true }));
    perfilSpy.deleteCertificado.and.returnValue(of({ ok: true }));

    spyOn(sessionStorage, 'getItem').and.callFake((key: string): string | null =>
      key === 'perfilId' ? 'empresa-1' : null
    );
    spyOn(window, 'confirm').and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [PerfilEmpresaCertificados],
      providers: [
        { provide: Perfil, useValue: perfilSpy },
        { provide: Alerts, useValue: alertsSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilEmpresaCertificados);
    component = fixture.componentInstance;
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

  it('keeps the certificate list visible on load', () => {
    expect(perfilSpy.getCerticados).toHaveBeenCalled();
    expect(perfilSpy.getCertificadosOfEmpresa).toHaveBeenCalledWith('empresa-1');
    expect(fixture.nativeElement.textContent).toContain('ISO 27001');
    expect(fixture.nativeElement.textContent).toContain('ICONTEC');
    expect(component.activeTab).toBe('list');
  });

  it('preserves add-certificate flow from form to create request', () => {
    getButtonByText('Nuevo Certificado').click();
    fixture.detectChanges();

    getButtonByText('Seleccione un certificado').click();
    fixture.detectChanges();

    const dropdownItems = fixture.nativeElement.querySelectorAll('.dropdown-item') as NodeListOf<HTMLButtonElement>;
    dropdownItems[0].click();
    fixture.detectChanges();

    component.certificadoForm.setValue({
      fechaEmision: '2024-01-01',
      fechaCaducidad: '2026-01-01',
    });

    getButtonByText('Agregar Certificado').click();
    fixture.detectChanges();

    expect(perfilSpy.createCertificado).toHaveBeenCalledWith({
      certificado: { id_certificado: 'cert-1' },
      empresa: { id: 'empresa-1' },
      fecha_emision: '2024-01-01',
      fecha_caducidad: '2026-01-01',
    });
    expect(alertsSpy.success).toHaveBeenCalledWith('Certificado agregado');
    expect(component.activeTab).toBe('list');
  });

  it('keeps edit and delete actions available from the list', () => {
    const editButton = fixture.nativeElement.querySelector('.btn-edit') as HTMLButtonElement;
    editButton.click();
    fixture.detectChanges();

    expect(component.modoEdicion).toBeTrue();
    expect(component.activeTab).toBe('form');
    expect(component.certificadoSeleccionado?.nombre_certificado).toBe('ISO 27001');

    component.certificadoForm.setValue({
      fechaEmision: '2024-03-01',
      fechaCaducidad: '2027-03-01',
    });
    getButtonByText('Guardar Cambios').click();
    fixture.detectChanges();

    expect(perfilSpy.updateCertificado).toHaveBeenCalledWith('detalle-1', {
      fecha_emision: '2024-03-01',
      fecha_caducidad: '2027-03-01',
    });

    component.activeTab = 'list';
    fixture.detectChanges();

    const deleteButton = fixture.nativeElement.querySelector('.btn-delete') as HTMLButtonElement;
    deleteButton.click();

    expect(perfilSpy.deleteCertificado).toHaveBeenCalledWith('detalle-1');
  });
});
