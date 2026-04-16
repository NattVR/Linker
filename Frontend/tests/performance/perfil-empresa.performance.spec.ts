import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { PerfilEmpresa } from '../../src/app/features/perfil-empresa/perfil-empresa';
import { Alerts } from '../../src/app/shared/services/alerts';
import { Perfil } from '../../src/app/shared/services/perfil';
import { expectWithinBudget, measurePerformance } from './performance-test.utils';

describe('PerfilEmpresa performance', () => {
  let perfilSpy: jasmine.SpyObj<Perfil>;
  let alertsSpy: jasmine.SpyObj<Alerts>;

  const empresaMock: Empresa = {
    id_perfil: 'empresa-1',
    name_empresa: 'Linker',
    sector: 'Tecnologia',
    ubicacion: 'Bogota',
    descripcion: 'Empresa de pruebas',
    NIT: '900100200-1',
  };

  function createComponent(): ComponentFixture<PerfilEmpresa> {
    const fixture = TestBed.createComponent(PerfilEmpresa);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    perfilSpy = jasmine.createSpyObj<Perfil>('Perfil', ['getEmpresa', 'updatePerfilEmpresa']);
    alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['error', 'success']);

    perfilSpy.getEmpresa.and.returnValue(of(empresaMock));
    perfilSpy.updatePerfilEmpresa.and.returnValue(of({ ok: true }));

    spyOn(sessionStorage, 'getItem').and.callFake((key: string): string | null =>
      key === 'userId' ? 'empresa-1' : null
    );

    await TestBed.configureTestingModule({
      imports: [PerfilEmpresa],
      providers: [
        provideRouter([]),
        { provide: Perfil, useValue: perfilSpy },
        { provide: Alerts, useValue: alertsSpy },
      ],
    })
      .overrideComponent(PerfilEmpresa, {
        set: {
          imports: [ReactiveFormsModule],
          template: '',
        },
      })
      .compileComponents();
  });

  it('renders and loads profile data within budget', () => {
    const result = measurePerformance({
      iterations: 12,
      run: () => {
        const fixture = createComponent();
        fixture.destroy();
      },
    });

    expectWithinBudget(result, 130, 280);
  });

  it('switches tabs and patches the form efficiently', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.datosEmpresa = empresaMock;

    const result = measurePerformance({
      iterations: 80,
      run: () => {
        component.setActiveTab('certificados');
        component.setActiveTabEmpresa('editar_perfil');
        component.setActiveTabEmpresa('perfil');
      },
    });

    expect(component.perfilEmpresa.getRawValue()).toEqual({
      name_empresa: 'Linker',
      sector: 'Tecnologia',
      ubicacion: 'Bogota',
      descripcion: 'Empresa de pruebas',
    });
    expectWithinBudget(result, 4, 18);
  });

  it('submits profile updates within the interaction budget', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.perfilEmpresa.setValue({
      name_empresa: 'Linker Labs',
      sector: 'Software',
      ubicacion: 'Medellin',
      descripcion: 'Perfil optimizado',
    });

    const result = measurePerformance({
      iterations: 50,
      run: () => {
        component.updateEmpresa();
      },
    });

    expect(perfilSpy.updatePerfilEmpresa).toHaveBeenCalled();
    expectWithinBudget(result, 8, 30);
  });
});
