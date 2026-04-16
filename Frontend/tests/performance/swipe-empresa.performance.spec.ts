import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { SwipeEmpresa } from '../../src/app/features/match/swipe-empresa/swipe-empresa';
import { Match } from '../../src/app/shared/services/match';
import { Auth } from '../../src/app/shared/services/auth';
import { Alerts } from '../../src/app/shared/services/alerts';
import { expectWithinBudget, measurePerformance } from './performance-test.utils';

describe('SwipeEmpresa performance', () => {
  let fixture: ComponentFixture<SwipeEmpresa>;
  let component: SwipeEmpresa;
  let matchSpy: jasmine.SpyObj<Match>;
  let authSpy: jasmine.SpyObj<Auth>;
  let alertsSpy: jasmine.SpyObj<Alerts>;

  function buildPostulante(index: number): Postulante {
    return {
      id: `post-${index}`,
      name: `Nombre ${index}`,
      lastname: `Apellido ${index}`,
      anos_experiencia: 3,
      curriculum: '#',
      foto: 'https://example.com/foto.jpg',
      ubicacion: 'Bogota',
      habilidades: ['Angular', 'TypeScript'],
      idiomas: ['Espanol'],
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
    component.list = Array.from({ length: count }, (_, index) => buildPostulante(index + 1));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    matchSpy = jasmine.createSpyObj<Match>('Match', ['onAction', 'getPostulantes']);
    authSpy = jasmine.createSpyObj<Auth>('Auth', ['getUserType']);
    alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['info', 'error']);

    authSpy.getUserType.and.returnValue(true);
    matchSpy.onAction.and.returnValue(of({ ok: true }));
    matchSpy.getPostulantes.and.returnValue(
      of(Array.from({ length: 8 }, (_, index) => buildPostulante(index + 1)))
    );

    spyOn(sessionStorage, 'getItem').and.callFake((key: string): string | null => {
      if (key === 'vacante') return 'vacante-1';
      if (key === 'perfilId') return 'empresa-1';
      return null;
    });
    spyOn(console, 'log');

    await TestBed.configureTestingModule({
      imports: [SwipeEmpresa],
      providers: [
        { provide: Match, useValue: matchSpy },
        { provide: Auth, useValue: authSpy },
        { provide: Alerts, useValue: alertsSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SwipeEmpresa);
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

  it('loads candidates within the refresh budget', () => {
    const result = measurePerformance({
      iterations: 60,
      run: () => {
        component.getCards();
      },
    });

    expect(matchSpy.getPostulantes).toHaveBeenCalledWith('vacante-1');
    expect(component.list.length).toBe(8);
    expectWithinBudget(result, 3, 12);
  });
});
