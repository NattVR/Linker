import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { PerfilEmpresaCertificados } from '../../src/app/features/perfil-empresa/perfil-empresa-certificados/perfil-empresa-certificados';
import { Alerts } from '../../src/app/shared/services/alerts';
import { Perfil } from '../../src/app/shared/services/perfil';
import { expectWithinBudget, measurePerformance } from './performance-test.utils';

describe('PerfilEmpresaCertificados performance', () => {
  let fixture: ComponentFixture<PerfilEmpresaCertificados>;
  let component: PerfilEmpresaCertificados;
  let perfilSpy: jasmine.SpyObj<Perfil>;
  let alertsSpy: jasmine.SpyObj<Alerts>;

  const certificado: Certificado = {
    id_certificado: 'cert-1',
    nombre_certificado: 'ISO 27001',
    entidad_emisora: 'ICONTEC',
  };

  beforeEach(async () => {
    perfilSpy = jasmine.createSpyObj<Perfil>('Perfil', [
      'getCerticados',
      'getCertificadosOfEmpresa',
      'createCertificado',
      'updateCertificado',
    ]);
    alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['error', 'success']);

    perfilSpy.getCerticados.and.returnValue(of([certificado]));
    perfilSpy.getCertificadosOfEmpresa.and.returnValue(of([]));
    perfilSpy.createCertificado.and.returnValue(of({ ok: true }));
    perfilSpy.updateCertificado.and.returnValue(of({ ok: true }));

    spyOn(sessionStorage, 'getItem').and.callFake((key: string): string | null =>
      key === 'perfilId' ? 'empresa-1' : null
    );

    await TestBed.configureTestingModule({
      imports: [PerfilEmpresaCertificados],
      providers: [
        { provide: Perfil, useValue: perfilSpy },
        { provide: Alerts, useValue: alertsSpy },
      ],
    })
      .overrideComponent(PerfilEmpresaCertificados, {
        set: {
          imports: [ReactiveFormsModule],
          template: '',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PerfilEmpresaCertificados);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('initializes certificate management within budget', () => {
    const result = measurePerformance({
      iterations: 12,
      run: () => {
        const localFixture = TestBed.createComponent(PerfilEmpresaCertificados);
        localFixture.detectChanges();
        localFixture.destroy();
      },
    });

    expectWithinBudget(result, 140, 300);
  });

  it('handles local UI state changes efficiently', () => {
    const result = measurePerformance({
      iterations: 120,
      run: () => {
        component.toggleDropdown();
        component.seleccionarCertificado(certificado);
        component.setActiveTab('form');
        component.setActiveTab('list');
      },
    });

    expectWithinBudget(result, 2.5, 10);
  });

  it('submits certificate creation within the interaction budget', () => {
    const result = measurePerformance({
      iterations: 50,
      run: () => {
        component.setActiveTab('form');
        component.certificadoSeleccionado = certificado;
        component.certificadoForm.setValue({
          fechaEmision: '2024-01-01',
          fechaCaducidad: '2026-01-01',
        });
        component.submitForm();
      },
    });

    expect(perfilSpy.createCertificado).toHaveBeenCalled();
    expectWithinBudget(result, 8, 30);
  });
});
