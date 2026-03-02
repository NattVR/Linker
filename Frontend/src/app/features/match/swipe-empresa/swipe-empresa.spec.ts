// =============================================================================
// Seleccionar Vacante | Frontend — getVacantes() → getCards()
// =============================================================================

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { SwipeEmpresa } from './swipe-empresa';
import { Match } from '../../../shared/services/match';
import { Auth } from '../../../shared/services/auth';
import { Alerts } from '../../../shared/services/alerts';
import { Perfil } from '../../../shared/services/perfil';
import { FilterService } from '../../../services/filter/filter-service';


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