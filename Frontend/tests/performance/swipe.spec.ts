import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Swipe } from '../../src/app/features/match/swipe/swipe';
import { Match } from '../../src/app/shared/services/match';
import { Auth } from '../../src/app/shared/services/auth';
import { Alerts } from '../../src/app/shared/services/alerts';
import { Perfil } from '../../src/app/shared/services/perfil';
import { FilterService } from '../../src/app/services/filter/filter-service';
import { expectWithinBudget, measurePerformance } from './performance-test.utils';

describe('Swipe performance', () => {
  let fixture: ComponentFixture<Swipe>;
  let component: Swipe;
  let matchSpy: jasmine.SpyObj<Match>;
  let authSpy: jasmine.SpyObj<Auth>;
  let alertsSpy: jasmine.SpyObj<Alerts>;
  let filterSpy: jasmine.SpyObj<FilterService>;

  function buildVacante(index: number): Vacante {
    return {
      id_vacante: `vac-${index}`,
      titulo: `Vacante ${index}`,
      tipo_trabajo: 'Full-time',
      modalidad: 'Remoto',
      salario: 3500000,
      ubicacion: 'Bogotá',
      habilidades: ['Angular', 'TypeScript'],
      idiomas: ['Español'],
      empresa: {
        id: `empresa-${index}`,
        id_perfil: `perfil-empresa-${index}`,
        name_empresa: `Empresa ${index}`,
      },
    };
  }

  function createPointerEvent(clientX: number): PointerEvent {
    return {
      clientX,
      pointerId: 1,
      currentTarget: {
        setPointerCapture: jasmine.createSpy('setPointerCapture'),
        releasePointerCapture: jasmine.createSpy('releasePointerCapture'),
      },
    } as unknown as PointerEvent;
  }

  function renderCards(count = 6): void {
    component.list = Array.from({ length: count }, (_, i) => buildVacante(i + 1));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    matchSpy = jasmine.createSpyObj<Match>('Match', ['onAction', 'getVacantes']);
    authSpy = jasmine.createSpyObj<Auth>('Auth', ['getUserType']);
    alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['info', 'error']);
    filterSpy = jasmine.createSpyObj<FilterService>('FilterService', ['Switch']);

    authSpy.getUserType.and.returnValue(false); // postulante
    matchSpy.onAction.and.returnValue(of({ ok: true }));
    matchSpy.getVacantes.and.returnValue(
      of(Array.from({ length: 8 }, (_, i) => buildVacante(i + 1)))
    );

    spyOn(sessionStorage, 'getItem').and.callFake((key: string): string | null => {
      if (key === 'perfilId') return 'postulante-1';
      return null;
    });
    spyOn(console, 'log');

    await TestBed.configureTestingModule({
      imports: [Swipe],
      providers: [
        { provide: Match, useValue: matchSpy },
        { provide: Auth, useValue: authSpy },
        { provide: Alerts, useValue: alertsSpy },
        { provide: FilterService, useValue: filterSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Swipe);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the swipe stack within budget', () => {
    const result = measurePerformance({
      iterations: 20,
      run: () => {
        renderCards(10);
      },
    });

    expectWithinBudget(result, 18, 60);
  });

  it('updates drag transforms within the gesture budget', () => {
    renderCards(3);
    component.onPointerDown(createPointerEvent(100));

    const result = measurePerformance({
      iterations: 200,
      run: () => {
        component.onPointerMove(createPointerEvent(220));
      },
    });

    expect(component.current_position).toBe(120);
    expectWithinBudget(result, 1.5, 8);
  });

  it('loads vacantes within the refresh budget', () => {
    const result = measurePerformance({
      iterations: 60,
      run: () => {
        component.getCards();
      },
    });

    expect(matchSpy.getVacantes).toHaveBeenCalled();
    expect(component.list.length).toBe(8);
    expectWithinBudget(result, 3, 12);
  });

  it('processes pointer up (small move) within budget', () => {
    renderCards(3);
    component.onPointerDown(createPointerEvent(100));
    component.onPointerMove(createPointerEvent(150));

    const result = measurePerformance({
      iterations: 100,
      run: () => {
        component.isDragging = true;
        component.current_position = 50;
        component.onPointerUp(buildVacante(1));
      },
    });

    expectWithinBudget(result, 2, 10);
  });

  it('processes swipe like action within budget', () => {
    renderCards(5);
    const initialLength = component.list.length;

    const result = measurePerformance({
      iterations: 20,
      run: () => {
        component.list = Array.from({ length: 5 }, (_, i) => buildVacante(i + 1));
        component.isDragging = true;
        component.current_position = 200; // like (> 110)
        component.onPointerUp(buildVacante(1));
      },
    });

    expect(matchSpy.onAction).toHaveBeenCalled();
    expectWithinBudget(result, 3, 15);
  });

  it('toggles filter within budget', () => {
    const result = measurePerformance({
      iterations: 200,
      run: () => {
        component.filterActivated();
      },
    });

    expect(filterSpy.Switch).toHaveBeenCalled();
    expectWithinBudget(result, 0.5, 3);
  });
});