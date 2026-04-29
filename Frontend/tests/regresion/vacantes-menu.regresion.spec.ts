import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { VacantesMenu } from '../../src/app/features/match/vacantes-menu/vacantes-menu';
import { Auth } from '../../src/app/shared/services/auth';
import { LoggerService } from '../../src/app/shared/services/logger';
import { Match } from '../../src/app/shared/services/match';

describe('VacantesMenu regresion', () => {
  let fixture: ComponentFixture<VacantesMenu>;
  let component: VacantesMenu;
  let matchSpy: jasmine.SpyObj<Match>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;

  const vacantesMock: Vacante[] = [
    {
      id_vacante: 'vac-1',
      titulo: 'Backend Developer',
      salario: 4200000,
      ubicacion: 'Bogota',
      modalidad: 'Hibrido',
      tipo_trabajo: 'Full-time',
    } as Vacante,
    {
      id_vacante: 'vac-2',
      titulo: 'QA Engineer',
      salario: 3500000,
      ubicacion: 'Medellin',
      modalidad: 'Remoto',
      tipo_trabajo: 'Part-time',
    } as Vacante,
  ];

  beforeEach(async () => {
    matchSpy = jasmine.createSpyObj<Match>('Match', ['getVacantesForEmpresa']);
    loggerSpy = jasmine.createSpyObj<LoggerService>('LoggerService', ['log', 'error']);

    matchSpy.getVacantesForEmpresa.and.returnValue(of(vacantesMock));
    spyOn(sessionStorage, 'getItem').and.callFake((key: string): string | null =>
      key === 'perfilId' ? 'empresa-1' : null
    );
    spyOn(sessionStorage, 'setItem');

    await TestBed.configureTestingModule({
      imports: [VacantesMenu],
      providers: [
        { provide: Match, useValue: matchSpy },
        { provide: LoggerService, useValue: loggerSpy },
        { provide: Auth, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VacantesMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('keeps the vacancy dropdown loading and rendering options', () => {
    const toggleButton = fixture.nativeElement.querySelector('.dropdown-button') as HTMLButtonElement;
    toggleButton.click();
    fixture.detectChanges();

    expect(component.mostrarLista).toBeTrue();
    expect(matchSpy.getVacantesForEmpresa).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Backend Developer');
    expect(fixture.nativeElement.textContent).toContain('QA Engineer');
  });

  it('preserves vacancy selection and stores it in sessionStorage', () => {
    component.toggleLista();
    fixture.detectChanges();

    const options = fixture.nativeElement.querySelectorAll('.dropdown-item') as NodeListOf<HTMLButtonElement>;
    options[1].click();
    fixture.detectChanges();

    expect(component.vacanteSeleccionada?.id_vacante).toBe('vac-2');
    expect(component.mostrarLista).toBeFalse();
    expect(sessionStorage.setItem).toHaveBeenCalledWith('vacante', 'vac-2');
    expect(fixture.nativeElement.textContent).toContain('QA Engineer');
  });

  it('keeps the dropdown open even when loading vacancies fails', () => {
    matchSpy.getVacantesForEmpresa.and.returnValue(throwError(() => new Error('network')));

    const toggleButton = fixture.nativeElement.querySelector('.dropdown-button') as HTMLButtonElement;
    toggleButton.click();
    fixture.detectChanges();

    expect(component.mostrarLista).toBeTrue();
    expect(loggerSpy.log).toHaveBeenCalledWith('no hay vacantes');
    expect(component.vacantes).toEqual([]);
  });
});
