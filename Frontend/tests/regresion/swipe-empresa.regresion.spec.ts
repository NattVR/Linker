import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { SwipeEmpresa } from '../../src/app/features/match/swipe-empresa/swipe-empresa';
import { Match } from '../../src/app/shared/services/match';
import { Auth } from '../../src/app/shared/services/auth';
import { Alerts } from '../../src/app/shared/services/alerts';

describe('SwipeEmpresa regresion', () => {
  let fixture: ComponentFixture<SwipeEmpresa>;
  let component: SwipeEmpresa;
  let matchSpy: jasmine.SpyObj<Match>;
  let authSpy: jasmine.SpyObj<Auth>;
  let alertsSpy: jasmine.SpyObj<Alerts>;

  function buildPostulante(id: string, name: string): Postulante {
    return {
      id,
      name,
      lastname: 'Tester',
      anos_experiencia: 3,
      curriculum: '#',
      foto: 'https://example.com/foto.jpg',
      ubicacion: 'Bogota',
      habilidades: ['Angular'],
      idiomas: ['Espanol'],
    };
  }

  function pointerTarget(): jasmine.SpyObj<HTMLElement> {
    return jasmine.createSpyObj<HTMLElement>('pointerTarget', ['setPointerCapture', 'releasePointerCapture']);
  }

  function pointerEvent(clientX: number, currentTarget: unknown): PointerEvent {
    return {
      clientX,
      pointerId: 1,
      currentTarget,
    } as PointerEvent;
  }

  beforeEach(async () => {
    matchSpy = jasmine.createSpyObj<Match>('Match', ['onAction', 'getPostulantes']);
    authSpy = jasmine.createSpyObj<Auth>('Auth', ['getUserType']);
    alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['info', 'error']);

    authSpy.getUserType.and.returnValue(true);
    matchSpy.onAction.and.returnValue(of('Interaccion registrada'));
    matchSpy.getPostulantes.and.returnValue(of([
      buildPostulante('post-1', 'Ana'),
      buildPostulante('post-2', 'Luis'),
    ]));

    spyOn(console, 'log');
    spyOn(sessionStorage, 'getItem').and.callFake((key: string): string | null => {
      if (key === 'vacante') return 'vac-1';
      if (key === 'perfilId') return 'emp-1';
      return null;
    });

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

  it('keeps the refresh flow rendering cards from the empty state', () => {
    expect(fixture.nativeElement.querySelector('.btn-refresh')).not.toBeNull();

    (fixture.nativeElement.querySelector('.btn-refresh') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(matchSpy.getPostulantes).toHaveBeenCalledWith('vac-1');
    expect(component.list.length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('.cards').length).toBe(2);
  });

  it('preserves swipe-right like behavior and advances the deck', () => {
    component.list = [buildPostulante('post-1', 'Ana'), buildPostulante('post-2', 'Luis')];
    fixture.detectChanges();

    const target = pointerTarget();
    component.onPointerDown(pointerEvent(100, target));
    component.onPointerMove(pointerEvent(260, target));
    component.onPointerUp(pointerEvent(260, target), component.list[0]);
    fixture.detectChanges();

    expect(matchSpy.onAction).toHaveBeenCalledWith({
      accion_empresa: 'like',
      vacante: 'vac-1',
      postulante: 'post-1',
      empresa: 'emp-1',
    });
    expect(component.list.length).toBe(1);
    expect(component.list[0].id).toBe('post-2');
  });

  it('keeps the no-more-candidates message when loading fails', () => {
    matchSpy.getPostulantes.and.returnValue(throwError(() => new Error('network')));

    component.getCards();

    expect(alertsSpy.info).toHaveBeenCalledWith('No hay mas postulantes para la vacante');
  });
});
