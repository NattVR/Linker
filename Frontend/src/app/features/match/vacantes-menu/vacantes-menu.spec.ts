/*
 * Linker - Proyecto Universitario
 * Copyright (C) 2024 Linker. All rights reserved.
 */
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';

import { VacantesMenu } from './vacantes-menu';
import { Match } from '../../../shared/services/match';
import { Auth } from '../../../shared/services/auth';
import { LoggerService } from '../../../shared/services/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks y helpers
// ─────────────────────────────────────────────────────────────────────────────

const VACANTE_MOCK: Vacante[] = [
    {
        id_vacante: 'uuid-001',
        titulo: 'Desarrollador Angular',
        salario: 3000000,
        ubicacion: 'Bogotá',
        modalidad: 'Remoto',
        tipo_trabajo: 'Full-time',
    } as Vacante,
];

function makeVacante(overrides: Partial<Vacante> = {}): Vacante {
    return {
        id_vacante: 'vacante-uuid-001',
        titulo: 'Desarrollador Angular',
        salario: 3000000,
        ubicacion: 'Bogotá',
        modalidad: 'Remoto',
        tipo_trabajo: 'Full-time',
        ...overrides,
    } as Vacante;
}

async function buildTestBed(
    matchSpy: jasmine.SpyObj<Match>,
    loggerSpy: jasmine.SpyObj<LoggerService>
) {
    await TestBed.configureTestingModule({
        imports: [VacantesMenu],
        providers: [
            provideRouter([]),
            { provide: Match, useValue: matchSpy },
            { provide: Auth, useValue: { getUserType: () => 'empresa' } },
            { provide: LoggerService, useValue: loggerSpy },
        ],
    }).compileComponents();
}

// ═════════════════════════════════════════════════════════════════════════════
// Suite 1 — seleccionarVacante()
// ═════════════════════════════════════════════════════════════════════════════

describe('VacantesMenu — seleccionarVacante()', () => {
    let component: VacantesMenu;
    let fixture: ComponentFixture<VacantesMenu>;
    let matchSpy: jasmine.SpyObj<Match>;
    let loggerSpy: jasmine.SpyObj<LoggerService>;

    beforeEach(async () => {
        matchSpy = jasmine.createSpyObj('Match', ['getVacantesForEmpresa', 'getPostulantes']);
        loggerSpy = jasmine.createSpyObj('LoggerService', ['log', 'error']);
        matchSpy.getVacantesForEmpresa.and.returnValue(of([]));

        await buildTestBed(matchSpy, loggerSpy);

        fixture = TestBed.createComponent(VacantesMenu);
        component = fixture.componentInstance;
        fixture.detectChanges();
        sessionStorage.clear();
    });

    afterEach(() => sessionStorage.clear());

    it('[C1] Vacante válida → vacanteSeleccionada, sessionStorage, mostrarLista=false, logger.log', () => {
        // Arrange
        const vacante = makeVacante({ id_vacante: 'uuid-vacante-test' });
        component.mostrarLista = true;

        // Act
        component.seleccionarVacante(vacante);

        // Assert
        expect(component.vacanteSeleccionada).toEqual(vacante);
        expect(sessionStorage.getItem('vacante')).toBe('uuid-vacante-test');
        expect(component.mostrarLista).toBeFalse();
        expect(loggerSpy.log).toHaveBeenCalledWith(
            'Vacante seleccionada:' + JSON.stringify(vacante)
        );
    });

    it('[C2] id_vacante undefined → sessionStorage guarda string vacío', () => {
        // Arrange + Act
        component.seleccionarVacante({ titulo: 'Sin ID' } as Vacante);

        // Assert
        expect(sessionStorage.getItem('vacante')).toBe('');
    });

    it('[C3] mostrarLista queda false independientemente del valor previo', () => {
        // Arrange
        const vacante = makeVacante();

        // Act + Assert — desde false
        component.mostrarLista = false;
        component.seleccionarVacante(vacante);
        expect(component.mostrarLista).toBeFalse();

        // Act + Assert — desde true
        component.mostrarLista = true;
        component.seleccionarVacante(vacante);
        expect(component.mostrarLista).toBeFalse();
    });

    it('[C4] Llamadas sucesivas sobreescriben vacanteSeleccionada y sessionStorage', () => {
        // Arrange + Act
        component.seleccionarVacante(makeVacante({ id_vacante: 'primera-uuid' }));
        expect(sessionStorage.getItem('vacante')).toBe('primera-uuid');

        component.seleccionarVacante(makeVacante({ id_vacante: 'segunda-uuid' }));

        // Assert
        expect(sessionStorage.getItem('vacante')).toBe('segunda-uuid');
        expect(component.vacanteSeleccionada?.id_vacante).toBe('segunda-uuid');
    });

    it('[C5] Todos los campos quedan intactos en vacanteSeleccionada', () => {
        // Arrange
        const vacante = makeVacante({
            id_vacante: 'uuid-completo',
            titulo: 'QA Engineer',
            salario: 4000000,
            ubicacion: 'Medellín',
            modalidad: 'Híbrido',
        });

        // Act
        component.seleccionarVacante(vacante);

        // Assert
        expect(component.vacanteSeleccionada?.titulo).toBe('QA Engineer');
        expect(component.vacanteSeleccionada?.salario).toBe(4000000);
        expect(component.vacanteSeleccionada?.ubicacion).toBe('Medellín');
        expect(component.vacanteSeleccionada?.modalidad).toBe('Híbrido');
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// Suite 2 — getVacantes()
// ═════════════════════════════════════════════════════════════════════════════

describe('VacantesMenu — getVacantes()', () => {
    let component: VacantesMenu;
    let fixture: ComponentFixture<VacantesMenu>;
    let matchSpy: jasmine.SpyObj<Match>;
    let loggerSpy: jasmine.SpyObj<LoggerService>;

    beforeEach(async () => {
        matchSpy = jasmine.createSpyObj('Match', ['getVacantesForEmpresa', 'getPostulantes']);
        loggerSpy = jasmine.createSpyObj('LoggerService', ['log', 'error']);
        matchSpy.getVacantesForEmpresa.and.returnValue(of([]));

        await buildTestBed(matchSpy, loggerSpy);

        fixture = TestBed.createComponent(VacantesMenu);
        component = fixture.componentInstance;
        fixture.detectChanges();
        sessionStorage.clear();
    });

    afterEach(() => sessionStorage.clear());

    it('[GV-01] Respuesta exitosa con vacantes → vacantes asignadas y logger.log llamado', () => {
        // Arrange
        sessionStorage.setItem('perfilId', 'perfil-uuid');
        matchSpy.getVacantesForEmpresa.and.returnValue(of(VACANTE_MOCK));

        // Act
        component.getVacantes();

        // Assert
        expect(component.vacantes).toEqual(VACANTE_MOCK);
        expect(matchSpy.getVacantesForEmpresa).toHaveBeenCalled();
        expect(loggerSpy.log).toHaveBeenCalled();
    });

    it('[GV-02] Respuesta exitosa vacía → vacantes = [] y logger.log llamado', () => {
        // Arrange
        matchSpy.getVacantesForEmpresa.and.returnValue(of([]));

        // Act
        component.getVacantes();

        // Assert
        expect(component.vacantes).toEqual([]);
        expect(loggerSpy.log).toHaveBeenCalled();
    });

    it('[GV-03] Error en subscribe → logger.log("no hay vacantes")', () => {
        // Arrange
        matchSpy.getVacantesForEmpresa.and.returnValue(
            throwError(() => new Error('network error'))
        );

        // Act
        component.getVacantes();

        // Assert
        expect(loggerSpy.log).toHaveBeenCalledWith('no hay vacantes');
    });

    it('[GV-04] logger.log llamado con perfilId del sessionStorage antes del subscribe', () => {
        // Arrange
        sessionStorage.setItem('perfilId', 'mi-perfil-id');
        matchSpy.getVacantesForEmpresa.and.returnValue(of([]));

        // Act
        component.getVacantes();

        // Assert
        expect(loggerSpy.log).toHaveBeenCalledWith('mi-perfil-id');
    });

    it('[GV-05] Sin perfilId en sessionStorage → logger.log llamado con string vacío', () => {
        // Arrange
        matchSpy.getVacantesForEmpresa.and.returnValue(of([]));

        // Act
        component.getVacantes();

        // Assert
        expect(loggerSpy.log).toHaveBeenCalledWith('');
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// Suite 3 — toggleLista()
// ═════════════════════════════════════════════════════════════════════════════

describe('VacantesMenu — toggleLista()', () => {
    let component: VacantesMenu;
    let fixture: ComponentFixture<VacantesMenu>;
    let matchSpy: jasmine.SpyObj<Match>;
    let loggerSpy: jasmine.SpyObj<LoggerService>;

    beforeEach(async () => {
        matchSpy = jasmine.createSpyObj('Match', ['getVacantesForEmpresa', 'getPostulantes']);
        loggerSpy = jasmine.createSpyObj('LoggerService', ['log', 'error']);
        matchSpy.getVacantesForEmpresa.and.returnValue(of([]));

        await buildTestBed(matchSpy, loggerSpy);

        fixture = TestBed.createComponent(VacantesMenu);
        component = fixture.componentInstance;
        fixture.detectChanges();
        sessionStorage.clear();
    });

    afterEach(() => sessionStorage.clear());

    it('[TL-01] vacantes=[] → toggleLista llama a getVacantes y alterna mostrarLista a true', () => {
        // Arrange
        component.mostrarLista = false;
        component.vacantes = [];
        matchSpy.getVacantesForEmpresa.and.returnValue(of(VACANTE_MOCK));

        // Act
        component.toggleLista();

        // Assert
        expect(component.mostrarLista).toBeTrue();
        expect(matchSpy.getVacantesForEmpresa).toHaveBeenCalled();
    });

    it('[TL-02] vacantes con datos → toggleLista NO llama a getVacantes', () => {
        // Arrange
        component.mostrarLista = false;
        component.vacantes = VACANTE_MOCK;
        matchSpy.getVacantesForEmpresa.calls.reset();

        // Act
        component.toggleLista();

        // Assert
        expect(component.mostrarLista).toBeTrue();
        expect(matchSpy.getVacantesForEmpresa).not.toHaveBeenCalled();
    });

    it('[TL-03] toggleLista alterna de true a false sin llamar a getVacantes si hay vacantes', () => {
        // Arrange
        component.mostrarLista = true;
        component.vacantes = VACANTE_MOCK;
        matchSpy.getVacantesForEmpresa.calls.reset();

        // Act
        component.toggleLista();

        // Assert
        expect(component.mostrarLista).toBeFalse();
        expect(matchSpy.getVacantesForEmpresa).not.toHaveBeenCalled();
    });

    it('[TL-04] vacantes=[], error en getVacantes → logger.log("no hay vacantes")', () => {
        // Arrange
        component.vacantes = [];
        matchSpy.getVacantesForEmpresa.and.returnValue(
            throwError(() => new Error('error'))
        );

        // Act
        component.toggleLista();

        // Assert
        expect(loggerSpy.log).toHaveBeenCalledWith('no hay vacantes');
    });

    it('[TL-05] Dos toggles consecutivos con vacantes → mostrarLista vuelve a false', () => {
        // Arrange
        component.mostrarLista = false;
        component.vacantes = VACANTE_MOCK;

        // Act
        component.toggleLista();
        component.toggleLista();

        // Assert
        expect(component.mostrarLista).toBeFalse();
    });
});