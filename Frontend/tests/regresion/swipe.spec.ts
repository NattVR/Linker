// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { of, throwError } from 'rxjs';

// import { Swipe } from '../../src/app/features/match/swipe/swipe';
// import { Match } from '../../src/app/shared/services/match';
// import { Auth } from '../../src/app/shared/services/auth';
// import { Alerts } from '../../src/app/shared/services/alerts';
// import { FilterService } from '../../src/app/services/filter/filter-service';

// describe('Swipe regresion', () => {
//   let fixture: ComponentFixture<Swipe>;
//   let component: Swipe;
//   let matchSpy: jasmine.SpyObj<Match>;
//   let authSpy: jasmine.SpyObj<Auth>;
//   let alertsSpy: jasmine.SpyObj<Alerts>;
//   let filterSpy: jasmine.SpyObj<FilterService>;

//   function buildVacante(index: number): Vacante {
//     return {
//       id_vacante: `vac-${index}`,
//       titulo: `Vacante ${index}`,
//       tipo_trabajo: 'Full-time',
//       modalidad: 'Remoto',
//       salario: 3500000,
//       ubicacion: 'Bogotá',
//       habilidades: ['Angular'],
//       idiomas: ['Español'],
//       empresa: {
//         id: `empresa-${index}`,
//         id_perfil: `perfil-empresa-${index}`,
//         name_empresa: `Empresa ${index}`,
//       },
//     };
//   }

//   function createPointerEvent(clientX: number): PointerEvent {
//     return {
//       clientX,
//       pointerId: 1,
//       currentTarget: {
//         setPointerCapture: jasmine.createSpy('setPointerCapture'),
//         releasePointerCapture: jasmine.createSpy('releasePointerCapture'),
//       },
//     } as unknown as PointerEvent;
//   }

//   function renderCards(count = 3): void {
//     component.list = Array.from({ length: count }, (_, i) => buildVacante(i + 1));
//     fixture.detectChanges();
//   }

//   beforeEach(async () => {
//     matchSpy = jasmine.createSpyObj<Match>('Match', ['onAction', 'getVacantes']);
//     authSpy = jasmine.createSpyObj<Auth>('Auth', ['getUserType']);
//     alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['info', 'error']);
//     filterSpy = jasmine.createSpyObj<FilterService>('FilterService', ['Switch']);

//     authSpy.getUserType.and.returnValue(false);
//     matchSpy.onAction.and.returnValue(of({ ok: true }));
//     matchSpy.getVacantes.and.returnValue(
//       of(Array.from({ length: 5 }, (_, i) => buildVacante(i + 1)))
//     );

//     spyOn(sessionStorage, 'getItem').and.callFake((key: string): string | null => {
//       if (key === 'perfilId') return 'postulante-1';
//       return null;
//     });
//     spyOn(console, 'log');
//     spyOn(console, 'warn');

//     await TestBed.configureTestingModule({
//       imports: [Swipe],
//       providers: [
//         { provide: Match, useValue: matchSpy },
//         { provide: Auth, useValue: authSpy },
//         { provide: Alerts, useValue: alertsSpy },
//         { provide: FilterService, useValue: filterSpy },
//       ],
//     }).compileComponents();

//     fixture = TestBed.createComponent(Swipe);
//     component = fixture.componentInstance;
//     fixture.detectChanges();
//   });

//   it('loads vacantes list via getCards', () => {
//     component.getCards();
//     expect(matchSpy.getVacantes).toHaveBeenCalled();
//     expect(component.list.length).toBe(5);
//   });

//   it('shows info alert when getCards fails', () => {
//     matchSpy.getVacantes.and.returnValue(throwError(() => new Error('Sin vacantes')));
//     component.getCards();
//     expect(alertsSpy.info).toHaveBeenCalledWith('No hay mas vacantes disponibles por el momento');
//   });

//   it('list is empty by default before getCards is called', () => {
//     component.list = [];
//     expect(component.list.length).toBe(0);
//   });

//   it('sets isDragging to true on pointer down', () => {
//     renderCards();
//     component.onPointerDown(createPointerEvent(100));
//     expect(component.isDragging).toBeTrue();
//   });

//   it('records start position on pointer down', () => {
//     renderCards();
//     component.onPointerDown(createPointerEvent(150));
//     expect(component.start).toBe(150);
//   });

//   it('updates current_position on pointer move', () => {
//     renderCards();
//     component.onPointerDown(createPointerEvent(100));
//     component.onPointerMove(createPointerEvent(250));
//     expect(component.current_position).toBe(150);
//   });

//   it('does not update position if not dragging', () => {
//     renderCards();
//     component.isDragging = false;
//     component.onPointerMove(createPointerEvent(300));
//     expect(component.current_position).toBe(0);
//   });

//   it('resets position on small move (< 110px)', () => {
//     renderCards();
//     component.onPointerDown(createPointerEvent(100));
//     component.onPointerMove(createPointerEvent(150)); // 50px
//     component.onPointerUp(buildVacante(1));
//     expect(component.current_position).toBe(0);
//     expect(component.isDragging).toBeFalse();
//   });

//   it('does not call onAction on small move', () => {
//     renderCards();
//     component.onPointerDown(createPointerEvent(100));
//     component.onPointerMove(createPointerEvent(150));
//     component.onPointerUp(buildVacante(1));
//     expect(matchSpy.onAction).not.toHaveBeenCalled();
//   });

//   it('does not remove card on small move', () => {
//     renderCards(3);
//     component.onPointerDown(createPointerEvent(100));
//     component.onPointerMove(createPointerEvent(150));
//     component.onPointerUp(component.list[0]);
//     expect(component.list.length).toBe(3);
//   });

//   it('sends like action on right swipe (> 110px)', () => {
//     renderCards();
//     component.onPointerDown(createPointerEvent(100));
//     component.current_position = 200;
//     component.isDragging = true;
//     const vacante = component.list[0];
//     component.onPointerUp(vacante);

//     expect(matchSpy.onAction).toHaveBeenCalledWith(
//       jasmine.objectContaining({ accion_postulante: 'like' })
//     );
//   });

//   it('removes first card from list on like', () => {
//     renderCards(3);
//     component.current_position = 200;
//     component.isDragging = true;
//     component.onPointerUp(component.list[0]);
//     expect(component.list.length).toBe(2);
//   });

//   it('sends dislike action on left swipe (< -110px)', () => {
//     renderCards();
//     component.current_position = -200;
//     component.isDragging = true;
//     const vacante = component.list[0];
//     component.onPointerUp(vacante);

//     expect(matchSpy.onAction).toHaveBeenCalledWith(
//       jasmine.objectContaining({ accion_postulante: 'dislike' })
//     );
//   });

//   it('removes first card from list on dislike', () => {
//     renderCards(3);
//     component.current_position = -200;
//     component.isDragging = true;
//     component.onPointerUp(component.list[0]);
//     expect(component.list.length).toBe(2);
//   });

//   it('calls filter Switch on filterActivated', () => {
//     component.filterActivated();
//     expect(filterSpy.Switch).toHaveBeenCalled();
//   });

//   it('does nothing on pointer up if not dragging', () => {
//     renderCards(3);
//     component.isDragging = false;
//     component.onPointerUp(component.list[0]);
//     expect(matchSpy.onAction).not.toHaveBeenCalled();
//     expect(component.list.length).toBe(3);
//   });
// });