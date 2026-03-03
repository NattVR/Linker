import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ElementRef, QueryList } from '@angular/core';
import { Swipe } from './swipe';
import { Match } from '../../../shared/services/match';
import { Perfil } from '../../../shared/services/perfil';
import { Auth } from '../../../shared/services/auth';
import { Alerts } from '../../../shared/services/alerts';
import { FilterService } from '../../../services/filter/filter-service';

function makeCardElement(): HTMLDivElement {
  const el = document.createElement('div');
  el.classList.add('card');
  return el;
}

function makeCardQueryList(el: HTMLDivElement): QueryList<ElementRef<HTMLDivElement>> {
  const ref = new ElementRef(el);
  const ql  = new QueryList<ElementRef<HTMLDivElement>>();
  (ql as any)._results = [ref];
  return ql;
}

function makeVacante(overrides: any = {}): any {
  return {
    id_vacante: overrides.id_vacante ?? 'v-uuid-1',
    empresa:    { id_perfil: overrides.id_perfil ?? 'emp-uuid-1' },
    ...overrides,
  };
}

function makePointerEvent(clientX: number): PointerEvent {
  return { clientX } as unknown as PointerEvent;
}

describe('Swipe - onPointerDown()', () => {
  let component: Swipe;
  let fixture: ComponentFixture<Swipe>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Swipe],
      providers: [
        { provide: Match,         useValue: jasmine.createSpyObj('Match',         ['onAction', 'getVacantes']) },
        { provide: Perfil,        useValue: jasmine.createSpyObj('Perfil',        ['getPerfilCompleto'])       },
        { provide: Auth,          useValue: { getUserType: () => false }                                       },
        { provide: Alerts,        useValue: jasmine.createSpyObj('Alerts',        ['error', 'info'])           },
        { provide: FilterService, useValue: jasmine.createSpyObj('FilterService', ['Switch'])                  },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(Swipe);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => sessionStorage.clear());

  it('[C1] Camino 1,2,3,4,F - event.clientX=200 -> start=200 e isDragging=true', () => {
    const event = makePointerEvent(200);

    component.onPointerDown(event);

    expect(component.start).toBe(200);
    expect(component.isDragging).toBeTrue();
  });
});

describe('Swipe - onPointerMove()', () => {
  let component: Swipe;
  let fixture: ComponentFixture<Swipe>;
  let cardEl: HTMLDivElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Swipe],
      providers: [
        { provide: Match,         useValue: jasmine.createSpyObj('Match',         ['onAction', 'getVacantes']) },
        { provide: Perfil,        useValue: jasmine.createSpyObj('Perfil',        ['getPerfilCompleto'])       },
        { provide: Auth,          useValue: { getUserType: () => false }                                       },
        { provide: Alerts,        useValue: jasmine.createSpyObj('Alerts',        ['error', 'info'])           },
        { provide: FilterService, useValue: jasmine.createSpyObj('FilterService', ['Switch'])                  },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(Swipe);
    component = fixture.componentInstance;
    cardEl    = makeCardElement();
    component.cardElement = makeCardQueryList(cardEl);
    fixture.detectChanges();
  });

  afterEach(() => sessionStorage.clear());

  it('[C1] Camino 1,2,3,7,F - isDragging=false -> return, current_position no cambia', () => {
    component.isDragging      = false;
    component.current_position = 0;

    component.onPointerMove(makePointerEvent(300));

    expect(component.current_position).toBe(0);
    expect(cardEl.style.transform).toBe('');
  });

  it('[C2] Camino 1,2,3,4,5,6,F - isDragging=true, start=100, clientX=250 -> current_position=150 + transform', () => {
    component.isDragging = true;
    component.start      = 100;

    component.onPointerMove(makePointerEvent(250));

    expect(component.current_position).toBe(150);
    expect(cardEl.style.transform).toBe('translateX(150px) rotate(7.5deg)');
  });
});

describe('Swipe - onPointerUp()', () => {
  let component: Swipe;
  let fixture: ComponentFixture<Swipe>;
  let matchSpy: jasmine.SpyObj<Match>;
  let cardEl: HTMLDivElement;

  beforeEach(async () => {
    matchSpy = jasmine.createSpyObj<Match>('Match', ['onAction', 'getVacantes']);

    await TestBed.configureTestingModule({
      imports: [Swipe],
      providers: [
        { provide: Match,         useValue: matchSpy                                                           },
        { provide: Perfil,        useValue: jasmine.createSpyObj('Perfil',        ['getPerfilCompleto'])       },
        { provide: Auth,          useValue: { getUserType: () => false }                                       },
        { provide: Alerts,        useValue: jasmine.createSpyObj('Alerts',        ['error', 'info'])           },
        { provide: FilterService, useValue: jasmine.createSpyObj('FilterService', ['Switch'])                  },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(Swipe);
    component = fixture.componentInstance;
    cardEl    = makeCardElement();
    component.cardElement = makeCardQueryList(cardEl);
    fixture.detectChanges();
  });

  afterEach(() => sessionStorage.clear());

  it('[C-001] Camino 1,2,3,28,F - isDragging=false -> return inmediato', () => {
    component.isDragging = false;

    component.onPointerUp(makeVacante());

    expect(matchSpy.onAction).not.toHaveBeenCalled();
  });

  it('[C-002] Camino 1,2,3,4,5,6,7,8,9,10,11,F - current_position=50 (<110) -> reset card + return', () => {
    component.isDragging       = true;
    component.current_position = 50;

    component.onPointerUp(makeVacante());

    expect(cardEl.style.transform).toBe('translateX(0px) rotate(0deg)');
    expect(cardEl.style.transition).toContain('transform 0.4s');
    expect(component.isDragging).toBeFalse();
    expect(component.current_position).toBe(0);
    expect(matchSpy.onAction).not.toHaveBeenCalled();
  });

  it('[C-003] Camino ...15,16,17,18,19,F - current_position=-150 -> dislike enviado + list.shift()', () => {
    sessionStorage.setItem('perfilId', 'post-uuid');
    component.isDragging       = true;
    component.current_position = -150;
    component.list             = [makeVacante(), makeVacante({ id_vacante: 'v-2' })];
    matchSpy.onAction.and.returnValue(of({}));
    spyOn(console, 'log');

    const vacante = makeVacante();
    component.onPointerUp(vacante);

    expect(matchSpy.onAction).toHaveBeenCalledWith(
      jasmine.objectContaining({ accion_postulante: 'dislike', vacante: 'v-uuid-1' })
    );
    expect(console.log).toHaveBeenCalledWith('Dislike enviado:', jasmine.any(Object));
    expect(component.list.length).toBe(1);
    expect(component.isDragging).toBeFalse();
    expect(component.current_position).toBe(0);
  });

  it('[C-004] Camino ...20,21,17,18,19,F - current_position=-150, backend falla -> console.error dislike', () => {
    sessionStorage.setItem('perfilId', 'post-uuid');
    component.isDragging       = true;
    component.current_position = -150;
    component.list             = [makeVacante()];
    matchSpy.onAction.and.returnValue(throwError(() => new Error('server error')));
    spyOn(console, 'error');

    component.onPointerUp(makeVacante());

    expect(console.error).toHaveBeenCalledWith(
      'Error al enviar dislike:',
      jasmine.any(Error)
    );
    expect(component.list.length).toBe(0);
    expect(component.isDragging).toBeFalse();
    expect(component.current_position).toBe(0);
  });

  it('[C-005] Camino ...24,25,17,18,19,F - current_position=150 -> like enviado + list.shift()', () => {
    sessionStorage.setItem('perfilId', 'post-uuid');
    component.isDragging       = true;
    component.current_position = 150;
    component.list             = [makeVacante(), makeVacante({ id_vacante: 'v-2' })];
    matchSpy.onAction.and.returnValue(of({}));
    spyOn(console, 'log');

    const vacante = makeVacante();
    component.onPointerUp(vacante);

    expect(matchSpy.onAction).toHaveBeenCalledWith(
      jasmine.objectContaining({ accion_postulante: 'like', vacante: 'v-uuid-1' })
    );
    expect(console.log).toHaveBeenCalledWith('like enviado:', jasmine.any(Object));
    expect(component.list.length).toBe(1);
    expect(component.isDragging).toBeFalse();
    expect(component.current_position).toBe(0);
  });

  it('[C-006] Camino ...26,27,17,18,19,F - current_position=150, backend falla -> console.error like', () => {
    sessionStorage.setItem('perfilId', 'post-uuid');
    component.isDragging       = true;
    component.current_position = 150;
    component.list             = [makeVacante()];
    matchSpy.onAction.and.returnValue(throwError(() => new Error('server error')));
    spyOn(console, 'error');

    component.onPointerUp(makeVacante());

    expect(console.error).toHaveBeenCalledWith(
      'Error al enviar like:',
      jasmine.any(Error)
    );
    expect(component.list.length).toBe(0);
    expect(component.isDragging).toBeFalse();
    expect(component.current_position).toBe(0);
  });
});