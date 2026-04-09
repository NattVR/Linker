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
    empresa: { id_perfil: overrides.id_perfil ?? 'emp-uuid-1' },
    ...overrides,
  };
}

function makePointerEvent(clientX: number): PointerEvent {
  return { clientX } as unknown as PointerEvent;
}

describe('Swipe', () => {
  let component: Swipe;
  let fixture: ComponentFixture<Swipe>;
  let matchSpy: jasmine.SpyObj<Match>;
  let alertsSpy: jasmine.SpyObj<Alerts>;
  let filterSpy: jasmine.SpyObj<FilterService>;
  let cardEl: HTMLDivElement;

  beforeEach(async () => {
    matchSpy  = jasmine.createSpyObj<Match>('Match', ['onAction', 'getVacantes']);
    alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['error', 'info']);
    filterSpy = jasmine.createSpyObj<FilterService>('FilterService', ['Switch']);

    await TestBed.configureTestingModule({
      imports: [Swipe],
      providers: [
        { provide: Match,         useValue: matchSpy  },
        { provide: Perfil,        useValue: jasmine.createSpyObj('Perfil', ['getPerfilCompleto']) }, // Dummy
        { provide: Auth,          useValue: { getUserType: () => false } },                          // Stub simple
        { provide: Alerts,        useValue: alertsSpy },
        { provide: FilterService, useValue: filterSpy },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(Swipe);
    component = fixture.componentInstance;
    cardEl    = makeCardElement();
    component.cardElement = makeCardQueryList(cardEl);
    fixture.detectChanges();
  });

  afterEach(() => sessionStorage.clear());

  it('[C-001] onPointerDown -> guarda clientX en start y activa isDragging', () => {
    const event = makePointerEvent(200);

    component.onPointerDown(event);

    expect(component.start).toBe(200);
    expect(component.isDragging).toBeTrue();
  });

  it('[C-002] onPointerMove con isDragging=false -> no modifica current_position ni transform', () => {
    component.isDragging       = false;
    component.current_position = 0;

    component.onPointerMove(makePointerEvent(300));

    expect(component.current_position).toBe(0);
    expect(cardEl.style.transform).toBe('');
  });

  // it('[C-003] onPointerMove con isDragging=true -> actualiza current_position y aplica transform', () => {
  //   component.isDragging = true;
  //   component.start      = 100;

  //   component.onPointerMove(makePointerEvent(250));

  //   expect(component.current_position).toBe(150);
  //   expect(cardEl.style.transform).toBe('translateX(150px) rotate(7.5deg)');
  // });

  it('[C-004] onPointerUp con isDragging=false -> return inmediato, no llama onAction', () => {
    component.isDragging = false;

    component.onPointerUp(makeVacante());

    expect(matchSpy.onAction).not.toHaveBeenCalled();
  });

  // it('[C-005] onPointerUp con movimiento < 110px -> resetea carta sin enviar acción', () => {
  //   component.isDragging       = true;
  //   component.current_position = 50;

  //   component.onPointerUp(makeVacante());

  //   expect(cardEl.style.transform).toBe('translateX(0px) rotate(0deg)');
  //   expect(cardEl.style.transition).toContain('transform 0.4s');
  //   expect(component.isDragging).toBeFalse();
  //   expect(component.current_position).toBe(0);
  //   expect(matchSpy.onAction).not.toHaveBeenCalled();
  // });

  it('[C-006] onPointerUp con current_position negativo -> envía dislike y hace list.shift()', () => {
    sessionStorage.setItem('perfilId', 'post-uuid');
    component.isDragging       = true;
    component.current_position = -150;
    component.list             = [makeVacante(), makeVacante({ id_vacante: 'v-2' })];
    matchSpy.onAction.and.returnValue(of({}));
    spyOn(console, 'log');

    component.onPointerUp(makeVacante());

    expect(matchSpy.onAction).toHaveBeenCalledWith(
      jasmine.objectContaining({ accion_postulante: 'dislike', vacante: 'v-uuid-1' })
    );
    expect(component.list.length).toBe(1);
    expect(component.isDragging).toBeFalse();
    expect(component.current_position).toBe(0);
  });

  it('[C-007] onPointerUp dislike -> backend falla -> console.error', () => {
    sessionStorage.setItem('perfilId', 'post-uuid');
    component.isDragging       = true;
    component.current_position = -150;
    component.list             = [makeVacante()];
    matchSpy.onAction.and.returnValue(throwError(() => new Error('server error')));
    spyOn(console, 'error');

    component.onPointerUp(makeVacante());

    expect(console.error).toHaveBeenCalledWith('Error al enviar dislike:', jasmine.any(Error));
    expect(component.list.length).toBe(0);
  });

  it('[C-008] onPointerUp con current_position positivo -> envía like y hace list.shift()', () => {
    sessionStorage.setItem('perfilId', 'post-uuid');
    component.isDragging       = true;
    component.current_position = 150;
    component.list             = [makeVacante(), makeVacante({ id_vacante: 'v-2' })];
    matchSpy.onAction.and.returnValue(of({}));
    spyOn(console, 'log');

    component.onPointerUp(makeVacante());

    expect(matchSpy.onAction).toHaveBeenCalledWith(
      jasmine.objectContaining({ accion_postulante: 'like', vacante: 'v-uuid-1' })
    );
    expect(component.list.length).toBe(1);
    expect(component.isDragging).toBeFalse();
    expect(component.current_position).toBe(0);
  });

  it('[C-009] onPointerUp like -> backend falla -> console.error', () => {
    sessionStorage.setItem('perfilId', 'post-uuid');
    component.isDragging       = true;
    component.current_position = 150;
    component.list             = [makeVacante()];
    matchSpy.onAction.and.returnValue(throwError(() => new Error('server error')));
    spyOn(console, 'error');

    component.onPointerUp(makeVacante());

    expect(console.error).toHaveBeenCalledWith('Error al enviar like:', jasmine.any(Error));
  });

  it('[C-010] getCards éxito -> llena list con las vacantes recibidas', () => {
    const vacantes = [makeVacante(), makeVacante({ id_vacante: 'v-2' })];
    matchSpy.getVacantes.and.returnValue(of(vacantes));

    component.getCards();

    expect(component.list).toEqual(vacantes);
  });

  it('[C-011] getCards error -> alerts.info con mensaje de no hay vacantes', () => {
    matchSpy.getVacantes.and.returnValue(throwError(() => new Error('error')));

    component.getCards();

    expect(alertsSpy.info).toHaveBeenCalledWith('No hay mas vacantes disponibles por el momento'); // Mock
  });

  it('[C-012] filterActivated -> delega en filter.Switch()', () => {
    component.filterActivated();

    expect(filterSpy.Switch).toHaveBeenCalled();
  });
});