import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PerfilVacantes } from '../../src/app/features/perfil-empresa/perfil-vacantes/perfil-vacantes';
import { Match } from '../../src/app/shared/services/match';
import { Perfil } from '../../src/app/shared/services/perfil';
import { LoggerService } from '../../src/app/shared/services/logger';

describe('PerfilVacante regresion', () => {
  let fixture: ComponentFixture<PerfilVacantes>;
  let component: PerfilVacantes;
  let perfilSpy: jasmine.SpyObj<Perfil>;
  let matchSpy: jasmine.SpyObj<Match>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;

  const vacanteMock: Vacante = {
    id_vacante: 'vac-1',
    titulo: 'Frontend Developer',
    salario: 4500000,
    ubicacion: 'Medellin',
    modalidad: 'Remoto',
    tipo_trabajo: 'Full-time',
    habilidades: ['Angular'],
    idiomas: ['Ingles'],
  } as Vacante;

  beforeEach(async () => {
    perfilSpy = jasmine.createSpyObj<Perfil>('Perfil', [
      'createVacante',
      'updateVacante',
      'getHabilidades',
      'getIdiomas',
      'getCatalogosPostulante',
    ]);
    matchSpy = jasmine.createSpyObj<Match>('Match', ['getVacantesForEmpresa']);
    loggerSpy = jasmine.createSpyObj<LoggerService>('LoggerService', ['log', 'error']);

    perfilSpy.createVacante.and.returnValue(of({ id_vacante: 'nueva-vacante' }));
    perfilSpy.getHabilidades.and.returnValue(of([{ id_habilidad: 'hab-1', nombre_habilidad: 'Angular' }] as Habilidad[]));
    perfilSpy.getIdiomas.and.returnValue(of([{ id_idioma: 'idi-1', nombre: 'Ingles' }] as Idioma[]));
    perfilSpy.getCatalogosPostulante.and.returnValue(
      of({
        habilidades: [{ id_habilidad: 'hab-1', nombre_habilidad: 'Angular' }],
        idiomas: [{ id_idioma: 'idi-1', nombre: 'Ingles' }],
      })
    );
    matchSpy.getVacantesForEmpresa.and.returnValue(of([vacanteMock]));

    spyOn(sessionStorage, 'getItem').and.callFake((key: string): string | null =>
      key === 'perfilId' ? 'empresa-1' : null
    );

    await TestBed.configureTestingModule({
      imports: [PerfilVacantes],
      providers: [
        { provide: Perfil, useValue: perfilSpy },
        { provide: Match, useValue: matchSpy },
        { provide: LoggerService, useValue: loggerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilVacantes);
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

  function fillVacanteForm() {
    component.nuevaVacante.patchValue({
      titulo: 'QA Analyst',
      salario: 3800000,
      ubicacion: 'Bogota',
      modalidad: 'Remoto',
      tipo_trabajo: 'Full-time',
    });
  }

  it('keeps the published vacancies view reachable from the form tab', () => {
    expect(component.activeTab).toBe('form');

    getButtonByText('Publicadas').click();
    fixture.detectChanges();

    expect(matchSpy.getVacantesForEmpresa).toHaveBeenCalled();
    expect(component.activeTab).toBe('list');
    expect(fixture.nativeElement.textContent).toContain('Frontend Developer');
  });

  it('preserves the create vacancy flow and resets back to the list', () => {
    fillVacanteForm();

    const publishButton = fixture.nativeElement.querySelector('button.publish-button') as HTMLButtonElement;
    publishButton.click();
    fixture.detectChanges();

    expect(perfilSpy.createVacante).toHaveBeenCalledWith(
      jasmine.objectContaining({
        titulo: 'QA Analyst',
        empresa: 'empresa-1',
        vacanteHabilidades: [],
        vacantesIdiomas: [],
      })
    );
    expect(component.activeTab).toBe('list');
    expect(component.modoEdicion).toBeFalse();
    expect(matchSpy.getVacantesForEmpresa).toHaveBeenCalled();
  });

  it('keeps editing available from the published vacancies list', () => {
    component.activeTab = 'list';
    component.vacantes = [vacanteMock];
    fixture.detectChanges();

    const editButton = fixture.nativeElement.querySelector('.edit-button') as HTMLButtonElement;
    editButton.click();
    fixture.detectChanges();

    expect(component.activeTab).toBe('form');
    expect(component.modoEdicion).toBeTrue();
    expect(component.vacanteEditandoId).toBe('vac-1');
    expect(component.nuevaVacante.get('titulo')?.value).toBe('Frontend Developer');
    expect(component.habilidades.at(0).value).toBe('hab-1');
    expect(component.idiomas.at(0).value).toBe('idi-1');
  });
});
