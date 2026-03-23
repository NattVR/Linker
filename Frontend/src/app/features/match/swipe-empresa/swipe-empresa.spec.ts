import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SwipeEmpresa } from './swipe-empresa';
import { Match } from '../../../shared/services/match';
import { Auth } from '../../../shared/services/auth';
import { Alerts } from '../../../shared/services/alerts';

describe('SwipeEmpresa', () => {
  let component: SwipeEmpresa;
  let fixture: ComponentFixture<SwipeEmpresa>;
  let matchSpy: jasmine.SpyObj<Match>;
  let authSpy: jasmine.SpyObj<Auth>;
  let alertsSpy: jasmine.SpyObj<Alerts>;
  let sessionStorageGetItemSpy: jasmine.Spy;
  let sessionValues: Record<string, string | null>;

  function buildPostulante(overrides: Partial<Postulante> = {}): Postulante {
    return {
      id: 'post-1',
      name: 'Juan',
      lastname: 'Perez',
      anos_experiencia: 3,
      curriculum: '#',
      foto: 'https://example.com/foto.jpg',
      ubicacion: 'Bogota',
      habilidades: ['Angular'],
      idiomas: ['Espanol'],
      ...overrides,
    };
  }

  function renderCards(postulantes: Postulante[]): HTMLDivElement[] {
    component.list = postulantes;
    fixture.detectChanges();

    return Array.from(
      fixture.nativeElement.querySelectorAll('.cards')
    ) as HTMLDivElement[];
  }

  function getTopCard(): HTMLDivElement {
    return fixture.nativeElement.querySelector('.cards') as HTMLDivElement;
  }

  function createPointerTarget(): jasmine.SpyObj<HTMLElement> {
    return jasmine.createSpyObj<HTMLElement>('pointerTarget', [
      'setPointerCapture',
      'releasePointerCapture',
    ]);
  }

  function createPointerEvent(
    clientX: number,
    currentTarget: unknown
  ): PointerEvent {
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
    matchSpy.getPostulantes.and.returnValue(of([]));

    spyOn(console, 'log');

    await TestBed.configureTestingModule({
      imports: [SwipeEmpresa],
      providers: [
        { provide: Match, useValue: matchSpy },
        { provide: Auth, useValue: authSpy },
        { provide: Alerts, useValue: alertsSpy },
      ],
    }).compileComponents();

    sessionValues = {
      vacante: 'vac-1',
      perfilId: 'emp-1',
    };

    sessionStorageGetItemSpy = spyOn(sessionStorage, 'getItem').and.callFake(
      (key: string): string | null => sessionValues[key] ?? null
    );

    fixture = TestBed.createComponent(SwipeEmpresa);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should expose the authenticated user type', () => {
    // Arrange

    // Act

    // Assert
    expect(component.userType).toBeTrue();
    expect(authSpy.getUserType).toHaveBeenCalled();
  });

  it('should render the refresh button when there are no cards and load postulantes on click', () => {
    // Arrange
    const postulantes = [
      buildPostulante({ id: 'post-1', name: 'Ana' }),
      buildPostulante({ id: 'post-2', name: 'Luis' }),
    ];
    matchSpy.getPostulantes.and.returnValue(of(postulantes));
    const refreshButton = fixture.nativeElement.querySelector('.btn-refresh') as HTMLButtonElement;

    // Act
    refreshButton.click();
    fixture.detectChanges();

    // Assert
    expect(refreshButton).not.toBeNull();
    expect(sessionStorageGetItemSpy).toHaveBeenCalledWith('vacante');
    expect(matchSpy.getPostulantes).toHaveBeenCalledWith('vac-1');
    expect(component.list).toEqual(postulantes);
    expect(fixture.nativeElement.querySelectorAll('.cards').length).toBe(2);
  });

  it('should render stacked cards with the first one marked as the top card', () => {
    // Arrange
    const cards = renderCards([
      buildPostulante({ id: 'post-1', name: 'Ana' }),
      buildPostulante({ id: 'post-2', name: 'Luis' }),
    ]);

    // Act

    // Assert
    expect(cards.length).toBe(2);
    expect(cards[0].classList.contains('top-card')).toBeTrue();
    expect(cards[0].style.zIndex).toBe('2');
    expect(cards[1].classList.contains('top-card')).toBeFalse();
    expect(cards[1].style.zIndex).toBe('1');
  });

  it('should start dragging from the first card on pointer down', () => {
    // Arrange
    renderCards([buildPostulante()]);
    const topCard = getTopCard();
    const target = createPointerTarget();

    // Act
    component.onPointerDown(createPointerEvent(140, target));

    // Assert
    expect(component.start).toBe(140);
    expect(component.isDragging).toBeTrue();
    expect(topCard.style.transition).toBe('none');
    expect(target.setPointerCapture).toHaveBeenCalledWith(1);
  });

  it('should ignore pointer down while an interaction is being processed', () => {
    // Arrange
    renderCards([buildPostulante()]);
    const topCard = getTopCard();
    const target = createPointerTarget();
    topCard.style.transition = 'initial';
    (component as any).isProcessing = true;

    // Act
    component.onPointerDown(createPointerEvent(140, target));

    // Assert
    expect(component.start).toBe(0);
    expect(component.isDragging).toBeFalse();
    expect(topCard.style.transition).toBe('initial');
    expect(target.setPointerCapture).not.toHaveBeenCalled();
  });

  it('should ignore pointer move when dragging has not started', () => {
    // Arrange
    renderCards([buildPostulante()]);
    const topCard = getTopCard();
    topCard.style.transform = 'initial';

    // Act
    component.onPointerMove(createPointerEvent(180, createPointerTarget()));

    // Assert
    expect(component.current_position).toBe(0);
    expect(topCard.style.transform).toBe('initial');
  });

  it('should ignore pointer move while processing an interaction', () => {
    // Arrange
    renderCards([buildPostulante()]);
    const topCard = getTopCard();
    component.isDragging = true;
    component.start = 100;
    topCard.style.transform = 'initial';
    (component as any).isProcessing = true;

    // Act
    component.onPointerMove(createPointerEvent(180, createPointerTarget()));

    // Assert
    expect(component.current_position).toBe(0);
    expect(topCard.style.transform).toBe('initial');
  });

  it('should update the card transform and opacity while dragging', () => {
    // Arrange
    renderCards([buildPostulante()]);
    const topCard = getTopCard();
    component.isDragging = true;
    component.start = 100;

    // Act
    component.onPointerMove(createPointerEvent(180, createPointerTarget()));

    // Assert
    expect(component.current_position).toBe(80);
    expect(topCard.style.transform).toContain('translateX(80px)');
    expect(topCard.style.transform).toContain('rotate(4deg)');
    expect(Number(topCard.style.opacity)).toBeCloseTo(0.84, 2);
  });

  it('should reset the card when the swipe threshold is not reached', () => {
    // Arrange
    const [postulanteCard] = renderCards([buildPostulante()]);
    const target = createPointerTarget();
    component.isDragging = true;
    component.current_position = 80;

    // Act
    component.onPointerUp(createPointerEvent(180, target), buildPostulante());

    // Assert
    expect(postulanteCard.style.transition).toBe(
      'transform 0.4s cubic-bezier(0.25, 1.25, 0.5, 1)'
    );
    expect(postulanteCard.style.transform).toBe('translateX(0px) rotate(0deg)');
    expect(postulanteCard.style.opacity).toBe('1');
    expect(target.releasePointerCapture).toHaveBeenCalledWith(1);
    expect(component.isDragging).toBeFalse();
    expect(component.current_position).toBe(0);
    expect((component as any).isProcessing).toBeFalse();
    expect(matchSpy.onAction).not.toHaveBeenCalled();
  });

  it('should ignore pointer up when dragging has not started', () => {
    // Arrange
    renderCards([buildPostulante()]);
    const target = createPointerTarget();
    component.current_position = 160;

    // Act
    component.onPointerUp(createPointerEvent(260, target), buildPostulante());

    // Assert
    expect(target.releasePointerCapture).not.toHaveBeenCalled();
    expect(matchSpy.onAction).not.toHaveBeenCalled();
  });

  it('should ignore pointer up while an interaction is already being processed', () => {
    // Arrange
    renderCards([buildPostulante()]);
    const target = createPointerTarget();
    component.isDragging = true;
    component.current_position = 160;
    (component as any).isProcessing = true;

    // Act
    component.onPointerUp(createPointerEvent(260, target), buildPostulante());

    // Assert
    expect(target.releasePointerCapture).not.toHaveBeenCalled();
    expect(matchSpy.onAction).not.toHaveBeenCalled();
  });

  it('should send a like interaction and remove the current card on a right swipe', () => {
    // Arrange
    const postulante = buildPostulante({ id: 'post-like' });
    const siguiente = buildPostulante({ id: 'post-next' });
    renderCards([postulante, siguiente]);
    const target = createPointerTarget();
    component.isDragging = true;
    component.current_position = 160;
    sessionValues['vacante'] = 'vac-actualizada';
    sessionValues['perfilId'] = 'emp-actualizada';

    // Act
    component.onPointerUp(createPointerEvent(260, target), postulante);

    // Assert
    expect(target.releasePointerCapture).toHaveBeenCalledWith(1);
    expect(matchSpy.onAction).toHaveBeenCalledWith({
      accion_empresa: 'like',
      vacante: 'vac-actualizada',
      postulante: 'post-like',
      empresa: 'emp-actualizada',
    });
    expect(alertsSpy.info).toHaveBeenCalledWith('Interaccion registrada');
    expect(component.list).toEqual([siguiente]);
    expect(component.isDragging).toBeFalse();
    expect(component.current_position).toBe(0);
    expect((component as any).isProcessing).toBeFalse();
  });

  it('should send a dislike interaction and remove the current card on a left swipe', () => {
    // Arrange
    const postulante = buildPostulante({ id: 'post-dislike' });
    const siguiente = buildPostulante({ id: 'post-next' });
    renderCards([postulante, siguiente]);
    const target = createPointerTarget();
    component.isDragging = true;
    component.current_position = -160;

    // Act
    component.onPointerUp(createPointerEvent(40, target), postulante);

    // Assert
    expect(target.releasePointerCapture).toHaveBeenCalledWith(1);
    expect(matchSpy.onAction).toHaveBeenCalledWith({
      accion_empresa: 'dislike',
      vacante: 'vac-1',
      postulante: 'post-dislike',
      empresa: 'emp-1',
    });
    expect(alertsSpy.info).toHaveBeenCalledWith('Interaccion registrada');
    expect(component.list).toEqual([siguiente]);
    expect(component.isDragging).toBeFalse();
    expect(component.current_position).toBe(0);
    expect((component as any).isProcessing).toBeFalse();
  });

  it('should show an error and keep the current card when sending the interaction fails', () => {
    // Arrange
    const postulante = buildPostulante({ id: 'post-error' });
    const siguiente = buildPostulante({ id: 'post-next' });
    renderCards([postulante, siguiente]);
    const target = createPointerTarget();
    component.isDragging = true;
    component.current_position = -160;
    matchSpy.onAction.and.returnValue(throwError(() => new Error('fallo de red')));

    // Act
    component.onPointerUp(createPointerEvent(40, target), postulante);

    // Assert
    expect(target.releasePointerCapture).toHaveBeenCalledWith(1);
    expect(matchSpy.onAction).toHaveBeenCalledWith({
      accion_empresa: 'dislike',
      vacante: 'vac-1',
      postulante: 'post-error',
      empresa: 'emp-1',
    });
    expect(alertsSpy.error).toHaveBeenCalledWith('Error al enviar dislike');
    expect(component.list).toEqual([postulante, siguiente]);
    expect((component as any).isProcessing).toBeFalse();
  });

  it('should show an info alert when loading postulantes fails', () => {
    // Arrange
    matchSpy.getPostulantes.and.returnValue(
      throwError(() => new Error('fallo de red'))
    );

    // Act
    component.getCards();

    // Assert
    expect(matchSpy.getPostulantes).toHaveBeenCalledWith('vac-1');
    expect(alertsSpy.info).toHaveBeenCalledWith('No hay mas postulantes para la vacante');
    expect(component.list).toEqual([]);
  });

  it('should not request postulantes when there is no vacante in session', () => {
    // Arrange
    const postulante = buildPostulante({ id: 'post-existente' });
    sessionValues['vacante'] = null;
    component.list = [postulante];

    // Act
    component.getCards();

    // Assert
    expect(matchSpy.getPostulantes).not.toHaveBeenCalled();
    expect(component.list).toEqual([postulante]);
  });
});
