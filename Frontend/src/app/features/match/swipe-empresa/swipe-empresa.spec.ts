import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SwipeEmpresa } from './swipe-empresa';
import { FilterService } from '../../../services/filter/filter-service';
import { Perfil } from '../../../shared/services/perfil';
import { Match } from '../../../shared/services/match';
import { Auth } from '../../../shared/services/auth';
import { Alerts } from '../../../shared/services/alerts';
import { HttpClientTestingModule } from '@angular/common/http/testing';

//NAT
describe('SwipeEmpresa', () => {
  let component: SwipeEmpresa;
  let fixture: ComponentFixture<SwipeEmpresa>;

  let filterSpy: jasmine.SpyObj<FilterService>;
  let perfilSpy: jasmine.SpyObj<Perfil>;
  let matchSpy: jasmine.SpyObj<Match>;
  let authSpy: jasmine.SpyObj<Auth>;
  let alertsSpy: jasmine.SpyObj<Alerts>;

  let fakeCard: {
    style: { transform: string; transition: string };
    classList: { remove: jasmine.Spy };
  };

  function setCardElementMock(): void {
    component.cardElement = {
      first: { nativeElement: fakeCard },
    } as any;
  }

  beforeEach(async () => {
    filterSpy = jasmine.createSpyObj<FilterService>('FilterService', ['Switch']);
    perfilSpy = jasmine.createSpyObj<Perfil>('Perfil', ['getEmpresa']);
    matchSpy = jasmine.createSpyObj<Match>('Match', ['onAction', 'getPostulantes']);
    authSpy = jasmine.createSpyObj<Auth>('Auth', ['getUserType']);
    alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['info', 'warning']);

    authSpy.getUserType.and.returnValue(true);
    matchSpy.onAction.and.returnValue(of({ ok: true }));

    await TestBed.configureTestingModule({
      imports: [SwipeEmpresa],
      providers: [
        { provide: FilterService, useValue: filterSpy },
        { provide: Perfil, useValue: perfilSpy },
        { provide: Match, useValue: matchSpy },
        { provide: Auth, useValue: authSpy },
        { provide: Alerts, useValue: alertsSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SwipeEmpresa);
    component = fixture.componentInstance;

    fakeCard = {
      style: { transform: '', transition: '' },
      classList: { remove: jasmine.createSpy('remove') },
    };

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.userType).toBeTrue();
  });

  it('onPointerDown should set start and isDragging', () => {
    const event = { clientX: 140 } as PointerEvent;

    component.onPointerDown(event);

    expect(component.start).toBe(140);
    expect(component.isDragging).toBeTrue();
  });

  it('onPointerMove should return without changes when not dragging', () => {
    component.isDragging = false;
    component.current_position = 0;
    fakeCard.style.transform = 'initial';

    component.onPointerMove({ clientX: 180 } as PointerEvent);

    expect(component.current_position).toBe(0);
    expect(fakeCard.style.transform).toBe('initial');
  });

  it('onPointerMove should update current position and card transform when dragging', () => {
    setCardElementMock();
    component.isDragging = true;
    component.start = 100;

    component.onPointerMove({ clientX: 180 } as PointerEvent);

    expect(component.current_position).toBe(80);
    expect(fakeCard.style.transform).toContain('translateX(80px)');
    expect(fakeCard.style.transform).toContain('rotate(4deg)');
  });

  it('onPointerUp should return when not dragging', () => {
    component.isDragging = false;
    component.current_position = 150;
    const postulante = { id: 'post-1' } as Postulante;

    component.onPointerUp(postulante);

    expect(matchSpy.onAction).not.toHaveBeenCalled();
  });

  it('onPointerUp should reset card when absolute movement is below threshold', () => {
    setCardElementMock();
    component.isDragging = true;
    component.current_position = 80;
    const postulante = { id: 'post-1' } as Postulante;

    component.onPointerUp(postulante);

    expect(fakeCard.style.transition).toBe('transform 0.4s cubic-bezier(0.25, 1.25, 0.5, 1)');
    expect(fakeCard.style.transform).toBe('translateX(0px) rotate(0deg)');
    expect(fakeCard.classList.remove).toHaveBeenCalledWith('grabbing');
    expect(component.isDragging).toBeFalse();
    expect(component.current_position).toBe(0);
    expect(matchSpy.onAction).not.toHaveBeenCalled();
  });

  it('onPointerUp should send dislike action when movement is negative and remove first card', () => {
    setCardElementMock();
    const getItemSpy = spyOn(sessionStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'vacante') return 'vac-123';
      if (key === 'perfilId') return 'emp-456';
      return null;
    });

    component.isDragging = true;
    component.current_position = -150;
    component.list = [
      { id: 'post-1' } as Postulante,
      { id: 'post-2' } as Postulante,
    ];

    component.onPointerUp({ id: 'post-1' } as Postulante);

    expect(getItemSpy).toHaveBeenCalledWith('vacante');
    expect(getItemSpy).toHaveBeenCalledWith('perfilId');
    expect(matchSpy.onAction).toHaveBeenCalledWith({
      accion_empresa: 'dislike',
      vacante: 'vac-123',
      postulante: 'post-1',
      empresa: 'emp-456',
    });
    expect(component.list.length).toBe(1);
    expect(component.list[0].id).toBe('post-2');
    expect(component.isDragging).toBeFalse();
    expect(component.current_position).toBe(0);
  });

  it('onPointerUp should send like action when movement is positive and remove first card', () => {
    setCardElementMock();
    spyOn(sessionStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'vacante') return 'vac-999';
      if (key === 'perfilId') return 'emp-111';
      return null;
    });

    component.isDragging = true;
    component.current_position = 160;
    component.list = [
      { id: 'post-10' } as Postulante,
      { id: 'post-20' } as Postulante,
    ];

    component.onPointerUp({ id: 'post-10' } as Postulante);

    expect(matchSpy.onAction).toHaveBeenCalledWith({
      accion_empresa: 'like',
      vacante: 'vac-999',
      postulante: 'post-10',
      empresa: 'emp-111',
    });
    expect(component.list.length).toBe(1);
    expect(component.list[0].id).toBe('post-20');
    expect(component.isDragging).toBeFalse();
    expect(component.current_position).toBe(0);
  });

  it('getCards should show warning when no vacante in session storage', () => {
    spyOn(sessionStorage, 'getItem').and.returnValue(null);

    component.getCards();

    expect(alertsSpy.warning).toHaveBeenCalledWith('Selecciona una vacante');
    expect(matchSpy.getPostulantes).not.toHaveBeenCalled();
  });

  it('getCards should load postulantes when vacante exists', () => {
    spyOn(sessionStorage, 'getItem').and.returnValue('vac-321');
    const postulantes = [
      { id: 'post-a' } as Postulante,
      { id: 'post-b' } as Postulante,
    ];
    matchSpy.getPostulantes.and.returnValue(of(postulantes));

    component.getCards();

    expect(matchSpy.getPostulantes).toHaveBeenCalledWith('vac-321');
    expect(component.list).toEqual(postulantes);
  });

  it('getCards should show info when getPostulantes fails', () => {
    spyOn(sessionStorage, 'getItem').and.returnValue('vac-777');
    matchSpy.getPostulantes.and.returnValue(
      throwError(() => new Error('network error'))
    );

    component.getCards();

    expect(alertsSpy.info).toHaveBeenCalledWith('No hay mas postulantes para la vacante');
  });

  it('filterActivated should trigger filter switch', () => {
    component.filterActivated();

    expect(filterSpy.Switch).toHaveBeenCalled();
  });
});

//TEPHO

// =============================================================================
// Seleccionar Vacante | Frontend — getVacantes() → getCards()
// =============================================================================

describe('Seleccionar Vacante | SwipeEmpresa.getCards()', () => {
    let component: SwipeEmpresa;
    let fixture: ComponentFixture<SwipeEmpresa>;
    let matchSpy: jasmine.SpyObj<Match>;
    let alertsEmitted: { type: string; message: string }[];
    let consoleSpy: jasmine.Spy;

    beforeEach(async () => {
        alertsEmitted = [];

        matchSpy = jasmine.createSpyObj('Match', ['getPostulantes', 'getVacantesForEmpresa', 'onAction']);
        matchSpy.getVacantesForEmpresa.and.returnValue(of([]));

        await TestBed.configureTestingModule({
            imports: [SwipeEmpresa, HttpClientTestingModule],
            providers: [
                { provide: Match, useValue: matchSpy },
                { provide: Auth, useValue: { getUserType: () => 'empresa' } },
                { provide: Perfil, useValue: {} },
                { provide: FilterService, useValue: { Switch: () => { } } },
                {
                    provide: Alerts,
                    useValue: {
                        info: (msg: string) => alertsEmitted.push({ type: 'info', message: msg }),
                        warning: (msg: string) => alertsEmitted.push({ type: 'warning', message: msg }),
                        error: (msg: string) => alertsEmitted.push({ type: 'error', message: msg }),
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(SwipeEmpresa);
        component = fixture.componentInstance;
        fixture.detectChanges();

        consoleSpy = spyOn(console, 'log').and.callThrough();
        sessionStorage.clear();
    });

    afterEach(() => sessionStorage.clear());

    // ---------------------------------------------------------------------------
    // [C1] Camino 1,2,3,4,F — getCards() con vacante en sessionStorage
    // API responde exitosamente → list = data, console.log datos
    // ---------------------------------------------------------------------------
    it('[C1] Camino 1,2,3,4,F — vacante en sessionStorage + API next() → list=[data], console.log datos', () => {
        sessionStorage.setItem('vacante', 'vacante-uuid');
        const postulantes: Postulante[] = [
            { id: 'p-1', name: 'Juan', lastname: 'Pérez' } as Postulante,
            { id: 'p-2', name: 'Ana', lastname: 'Gómez' } as Postulante,
        ];
        matchSpy.getPostulantes.and.returnValue(of(postulantes));

        component.getCards();

        expect(matchSpy.getPostulantes).toHaveBeenCalledWith('vacante-uuid');

        expect(component.list).toEqual(postulantes);

        expect(consoleSpy).toHaveBeenCalledWith('empresa', postulantes);

        expect(consoleSpy).toHaveBeenCalledWith(component.list);

        expect(alertsEmitted.length).toBe(0);
    });

    // ---------------------------------------------------------------------------
    // Camino 1,2,3,4,11,F
    // sessionStorage SIN 'vacante' → vacante = null → alerts.warning + return
    // ---------------------------------------------------------------------------
    it('[C1] Camino 1,2,3,4,11,F — sessionStorage sin vacante → alerts.warning("Selecciona una vacante") sin llamada HTTP', () => {
        // sessionStorage vacío → getItem('vacante') = null
        component.getCards();

        expect(matchSpy.getPostulantes).not.toHaveBeenCalled();
        expect(alertsEmitted.length).toBe(1);
        expect(alertsEmitted[0].type).toBe('warning');
        expect(alertsEmitted[0].message).toBe('Selecciona una vacante');
    });


    // ---------------------------------------------------------------------------
    // [C2] Camino 1,5,F — vacante en sessionStorage pero API retorna error
    // → console.log(err) + alerts.info('No hay más postulantes para la vacante')
    // ---------------------------------------------------------------------------
    it('[C2] Camino 1,5,F — vacante en sessionStorage + API error() → console.log(err) + alerts.info', () => {
        sessionStorage.setItem('vacante', 'vacante-uuid');
        const error = new Error('fallo de red');
        matchSpy.getPostulantes.and.returnValue(throwError(() => error));

        component.getCards();

        expect(consoleSpy).toHaveBeenCalledWith(error);

        expect(alertsEmitted.length).toBe(1);
        expect(alertsEmitted[0].type).toBe('info');
        expect(alertsEmitted[0].message).toBe('No hay mas postulantes para la vacante');

        expect(component.list).toEqual([]);
    });

    // ---------------------------------------------------------------------------
    // [C3] Camino sin vacante — sessionStorage vacío
    // → alerts.warning('Selecciona una vacante'), sin llamada HTTP
    // ---------------------------------------------------------------------------
    it('[C3] Camino sin vacante — sessionStorage vacío → alerts.warning("Selecciona una vacante"), sin HTTP', () => {
        component.getCards();

        expect(alertsEmitted.length).toBe(1);
        expect(alertsEmitted[0].type).toBe('warning');
        expect(alertsEmitted[0].message).toBe('Selecciona una vacante');

        expect(matchSpy.getPostulantes).not.toHaveBeenCalled();

        expect(component.list).toEqual([]);
    });

    it('getCards() — list queda vacía cuando la API retorna array vacío', () => {
        sessionStorage.setItem('vacante', 'vacante-uuid');
        matchSpy.getPostulantes.and.returnValue(of([]));

        component.getCards();

        expect(component.list).toEqual([]);
        expect(alertsEmitted.length).toBe(0);
    });

    it('getCards() — el id de vacante pasado a getPostulantes es exactamente el almacenado en sessionStorage', () => {
        sessionStorage.setItem('vacante', 'mi-vacante-especifica-uuid');
        matchSpy.getPostulantes.and.returnValue(of([]));

        component.getCards();

        const idUsado = matchSpy.getPostulantes.calls.mostRecent().args[0];
        expect(idUsado).toBe('mi-vacante-especifica-uuid');
    });

    it('getCards() — list no se modifica cuando no hay vacante en sessionStorage', () => {
        component.list = [{ id: 'p-existente' } as Postulante];

        component.getCards();

        expect(component.list).toEqual([{ id: 'p-existente' } as Postulante]);
    });
});
