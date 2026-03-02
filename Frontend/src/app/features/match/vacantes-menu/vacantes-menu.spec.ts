// =============================================================================
// Seleccionar Vacante | Frontend — seleccionarVacante()
// =============================================================================

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpClientTestingModule }   from '@angular/common/http/testing';
import { of }                        from 'rxjs';
import { VacantesMenu }              from './vacantes-menu';
import { Match }                     from '../../../shared/services/match';
import { Auth }                      from '../../../shared/services/auth';

function makeVacante(overrides: Partial<Vacante> = {}): Vacante {
    return {
        id_vacante:   'vacante-uuid-001',
        titulo:       'Desarrollador Angular',
        salario:      3000000,          // number, no string
        ubicacion:    'Bogotá',
        modalidad:    'Remoto',
        tipo_trabajo: 'Full-time',
        ...overrides,
    } as Vacante;
}

describe('Seleccionar Vacante | VacantesMenu.seleccionarVacante()', () => {
    let component:  VacantesMenu;
    let fixture:    ComponentFixture<VacantesMenu>;
    let matchSpy:   jasmine.SpyObj<Match>;
    let consoleSpy: jasmine.Spy;

    beforeEach(async () => {
        matchSpy = jasmine.createSpyObj('Match', ['getVacantesForEmpresa', 'getPostulantes']);
        matchSpy.getVacantesForEmpresa.and.returnValue(of([]));

        await TestBed.configureTestingModule({
            imports:   [VacantesMenu, HttpClientTestingModule],
            providers: [
                { provide: Match, useValue: matchSpy },
                { provide: Auth,  useValue: { getUserType: () => 'empresa' } },
            ],
        }).compileComponents();

        fixture   = TestBed.createComponent(VacantesMenu);
        component = fixture.componentInstance;
        fixture.detectChanges();

        consoleSpy = spyOn(console, 'log').and.callThrough();
        sessionStorage.clear();
    });

    afterEach(() => sessionStorage.clear());

    // ---------------------------------------------------------------------------
    // [C1] Camino 1,2,3,4,F — único camino (método lineal sin bifurcaciones)
    // vacante válida → vacanteSeleccionada asignada + sessionStorage actualizado
    //                + mostrarLista=false + console.log ejecutado
    // ---------------------------------------------------------------------------
    it('[C1] Camino 1,2,3,4,F — vacante válida con id_vacante → sessionStorage actualizado, mostrarLista=false, console.log', () => {
        const vacante = makeVacante({ id_vacante: 'uuid-vacante-test' });
        component.mostrarLista = true;

        component.seleccionarVacante(vacante);

        expect(component.vacanteSeleccionada).toEqual(vacante);

        expect(sessionStorage.getItem('vacante')).toBe('uuid-vacante-test');

        expect(component.mostrarLista).toBeFalse();

        expect(consoleSpy).toHaveBeenCalledWith('Vacante seleccionada:', vacante);
    });

    it('seleccionarVacante() — id_vacante undefined → sessionStorage guarda string vacío (operador || "")', () => {
        component.seleccionarVacante({ titulo: 'Sin ID' } as any);

        expect(sessionStorage.getItem('vacante')).toBe('');
    });

    it('seleccionarVacante() — mostrarLista queda false sin importar su valor previo', () => {
        const vacante = makeVacante();

        component.mostrarLista = false;
        component.seleccionarVacante(vacante);
        expect(component.mostrarLista).toBeFalse();

        component.mostrarLista = true;
        component.seleccionarVacante(vacante);
        expect(component.mostrarLista).toBeFalse();
    });

    it('seleccionarVacante() — llamadas sucesivas sobreescriben vacanteSeleccionada y sessionStorage', () => {
        component.seleccionarVacante(makeVacante({ id_vacante: 'primera-uuid' }));
        expect(sessionStorage.getItem('vacante')).toBe('primera-uuid');

        component.seleccionarVacante(makeVacante({ id_vacante: 'segunda-uuid' }));
        expect(sessionStorage.getItem('vacante')).toBe('segunda-uuid');
        expect(component.vacanteSeleccionada?.id_vacante).toBe('segunda-uuid');
    });

    it('seleccionarVacante() — todos los campos del objeto quedan intactos en vacanteSeleccionada', () => {
        const vacante = makeVacante({
            id_vacante:   'uuid-completo',
            titulo:       'QA Engineer',
            salario:      4000000,
            ubicacion:    'Medellín',
            modalidad:    'Híbrido',
        });

        component.seleccionarVacante(vacante);

        expect(component.vacanteSeleccionada?.titulo).toBe('QA Engineer');
        expect(component.vacanteSeleccionada?.salario).toBe(4000000);
        expect(component.vacanteSeleccionada?.ubicacion).toBe('Medellín');
        expect(component.vacanteSeleccionada?.modalidad).toBe('Híbrido');
    });
});