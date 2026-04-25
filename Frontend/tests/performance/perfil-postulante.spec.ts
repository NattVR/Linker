import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';

import { PerfilPostulante } from '../../src/app/features/perfil-postulante/perfil-postulante';
import { Alerts } from '../../src/app/shared/services/alerts';
import { Perfil } from '../../src/app/shared/services/perfil';
import { expectWithinBudget, measurePerformance } from './performance-test.utils';

describe('PerfilPostulante performance', () => {
  let fixture: ComponentFixture<PerfilPostulante>;
  let component: PerfilPostulante;
  let perfilSpy: jasmine.SpyObj<Perfil>;
  let alertsSpy: jasmine.SpyObj<Alerts>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockCatalogos = {
    niveles: [
      { id: '1', titulo: 'Bachiller', nivel: 'Básico' },
      { id: '2', titulo: 'Universitario', nivel: 'Superior' },
    ],
    habilidades: [
      { id_habilidad: 'h1', nombre_habilidad: 'Angular' },
      { id_habilidad: 'h2', nombre_habilidad: 'TypeScript' },
    ],
    idiomas: [
      { id_idioma: 'i1', nombre: 'Español' },
      { id_idioma: 'i2', nombre: 'Inglés' },
    ],
  };

  const mockPerfilCompleto = {
    años_experiencia: 3,
    curriculum: 'cv.pdf',
    postulanteEstudios: [
      { estudio: { titulo: 'Ingeniería', nivel: 'Superior' }, certificado: 'cert.pdf' },
    ],
    postulanteHabilidades: [
      { habilidades: { id_habilidad: 'h1' }, certificado: '' },
    ],
    postulanteIdiomas: [
      { idioma: { id_idioma: 'i1' }, certificado: '' },
    ],
  };

  beforeEach(async () => {
    perfilSpy = jasmine.createSpyObj<Perfil>('Perfil', [
      'getCatalogosPostulante',
      'getUserNamePostulante',
      'getPerfilCompleto',
      'guardarPerfilPostulante',
    ]);
    alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['success', 'error']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    perfilSpy.getCatalogosPostulante.and.returnValue(of(mockCatalogos));
    perfilSpy.getUserNamePostulante.and.returnValue(of({ name: 'Juan', lastname: 'Pérez' }));
    perfilSpy.getPerfilCompleto.and.returnValue(of(mockPerfilCompleto));
    perfilSpy.guardarPerfilPostulante.and.returnValue(of({ ok: true }));

    spyOn(sessionStorage, 'getItem').and.callFake((key: string): string | null => {
      if (key === 'perfilId') return 'postulante-1';
      return null;
    });

    await TestBed.configureTestingModule({
      imports: [PerfilPostulante],
      providers: [
        { provide: Perfil, useValue: perfilSpy },
        { provide: Alerts, useValue: alertsSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilPostulante);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the perfil form within budget', () => {
    const result = measurePerformance({
      iterations: 20,
      run: () => {
        fixture.detectChanges();
      },
    });

    expectWithinBudget(result, 18, 60);
  });

  it('initializes form within budget', () => {
    const result = measurePerformance({
      iterations: 30,
      run: () => {
        component.inicializarFormulario();
      },
    });

    expect(component.postulanteForm).toBeDefined();
    expectWithinBudget(result, 5, 20);
  });

  it('adds and removes estudios within budget', () => {
    const result = measurePerformance({
      iterations: 50,
      run: () => {
        component.agregarEstudio();
        component.eliminarEstudio(component.estudiosForm.length - 1);
      },
    });

    expectWithinBudget(result, 2, 10);
  });

  it('adds and removes habilidades within budget', () => {
    const result = measurePerformance({
      iterations: 50,
      run: () => {
        component.agregarHabilidad();
        component.eliminarHabilidad(component.habilidadesForm.length - 1);
      },
    });

    expectWithinBudget(result, 2, 10);
  });

  it('adds and removes idiomas within budget', () => {
    const result = measurePerformance({
      iterations: 50,
      run: () => {
        component.agregarIdioma();
        component.eliminarIdioma(component.idiomasForm.length - 1);
      },
    });

    expectWithinBudget(result, 2, 10);
  });

  it('loads catalogos within budget', () => {
    const result = measurePerformance({
      iterations: 30,
      run: () => {
        component.cargarCatalogos();
      },
    });

    expect(perfilSpy.getCatalogosPostulante).toHaveBeenCalled();
    expect(component.catalogoEstudios.length).toBe(2);
    expect(component.catalogoHabilidades.length).toBe(2);
    expect(component.catalogoIdiomas.length).toBe(2);
    expectWithinBudget(result, 5, 20);
  });

  it('patches form values within budget', () => {
    const result = measurePerformance({
      iterations: 100,
      run: () => {
        component.postulanteForm.patchValue({
          experiencia: 5,
          cv: 'nuevo-cv.pdf',
        });
      },
    });

    expect(component.postulanteForm.get('experiencia')?.value).toBe(5);
    expectWithinBudget(result, 1, 5);
  });
});