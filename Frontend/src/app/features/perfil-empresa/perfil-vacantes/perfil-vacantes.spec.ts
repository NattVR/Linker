/*
 * Linker - Proyecto Universitario
 * Copyright (C) 2024 Linker. All rights reserved.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { provideRouter } from '@angular/router';

import { PerfilVacantes } from './perfil-vacantes';
import { Match } from '../../../shared/services/match';
import { Perfil } from '../../../shared/services/perfil';
import { LoggerService } from '../../../shared/services/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks globales
// ─────────────────────────────────────────────────────────────────────────────

const CATALOGO_MOCK = {
    habilidades: [
        { id_habilidad: 'hab-1', nombre_habilidad: 'Angular' },
        { id_habilidad: 'hab-2', nombre_habilidad: 'TypeScript' },
    ],
    idiomas: [
        { id_idioma: 'id-1', nombre: 'Español' },
        { id_idioma: 'id-2', nombre: 'Inglés' },
    ],
};

const VACANTE_MOCK: Vacante[] = [
    {
        id_vacante: '1',
        titulo: 'Desarrollador Frontend',
        tipo_trabajo: 'Tiempo completo',
        modalidad: 'Remoto',
        salario: 3500000,
        ubicacion: 'Medellin',
        empresa: {
            id_perfil: 'emp-1',
            name_empresa: 'Tech Solutions',
            ubicacion: 'Medellin',
            descripcion: 'Empresa de tecnologia',
            sector: 'Software',
            NIT: '9001234567',
        },
        habilidades: ['Angular', 'TypeScript'],
        idiomas: ['Español', 'Inglés'],
    },
];

function makeVacante(overrides: Partial<{
    id_vacante: string;
    titulo: string;
    salario: string;
    ubicacion: string;
    modalidad: string;
    tipo_trabajo: string;
    habilidades: string[];
    idiomas: string[];
}> = {}): Vacante {
    return {
        id_vacante: overrides.id_vacante ?? 'v-uuid-1',
        titulo: overrides.titulo ?? 'Dev Angular',
        salario: overrides.salario ?? '3000000',
        ubicacion: overrides.ubicacion ?? 'Bogotá',
        modalidad: overrides.modalidad ?? 'Remoto',
        tipo_trabajo: overrides.tipo_trabajo ?? 'Full-time',
        habilidades: overrides.habilidades ?? [],
        idiomas: overrides.idiomas ?? [],
    } as unknown as Vacante;
}

function fillVacanteForm(component: PerfilVacantes, overrides: Partial<{
    titulo: string;
    salario: string;
    ubicacion: string;
    modalidad: string;
    tipo_trabajo: string;
}> = {}) {
    component.nuevaVacante.patchValue({
        titulo: overrides.titulo ?? 'Desarrollador Angular',
        salario: overrides.salario ?? '3000000',
        ubicacion: overrides.ubicacion ?? 'Bogotá',
        modalidad: overrides.modalidad ?? 'Remoto',
        tipo_trabajo: overrides.tipo_trabajo ?? 'Full-time',
        empresa: '',
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory del módulo de pruebas
// ─────────────────────────────────────────────────────────────────────────────

async function buildTestBed(
    perfilSpy: jasmine.SpyObj<Perfil>,
    matchSpy: jasmine.SpyObj<Match>,
    loggerSpy: jasmine.SpyObj<LoggerService>
) {
    await TestBed.configureTestingModule({
        imports: [PerfilVacantes, ReactiveFormsModule],
        providers: [
            FormBuilder,
            provideRouter([]),
            { provide: Perfil, useValue: perfilSpy },
            { provide: Match, useValue: matchSpy },
            { provide: LoggerService, useValue: loggerSpy },
        ],
    }).compileComponents();
}

// ═════════════════════════════════════════════════════════════════════════════
// Suite 1 — cargarVacantes()
// ═════════════════════════════════════════════════════════════════════════════

describe('PerfilVacantes — cargarVacantes()', () => {
    let component: PerfilVacantes;
    let fixture: ComponentFixture<PerfilVacantes>;
    let perfilSpy: jasmine.SpyObj<Perfil>;
    let matchSpy: jasmine.SpyObj<Match>;
    let loggerSpy: jasmine.SpyObj<LoggerService>;

    beforeEach(async () => {
        perfilSpy = jasmine.createSpyObj<Perfil>('Perfil', [
            'getHabilidades', 'getIdiomas', 'updateVacante',
            'createVacante', 'getCatalogosPostulante',
        ]);
        matchSpy = jasmine.createSpyObj<Match>('Match', ['getVacantesForEmpresa']);
        loggerSpy = jasmine.createSpyObj<LoggerService>('LoggerService', ['log', 'error']);

        matchSpy.getVacantesForEmpresa.and.returnValue(of([]));

        await buildTestBed(perfilSpy, matchSpy, loggerSpy);

        fixture = TestBed.createComponent(PerfilVacantes);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    // it('[CV-01] Respuesta exitosa con datos → vacantes cargadas y logger.log llamado', () => {
    //     // Arrange
    //     matchSpy.getVacantesForEmpresa.and.returnValue(of(VACANTE_MOCK));

    //     // Act
    //     component.cargarVacantes();

    //     // Assert
    //     expect(component.vacantes).toEqual(VACANTE_MOCK);
    //     expect(matchSpy.getVacantesForEmpresa).toHaveBeenCalled();
    //     expect(loggerSpy.log).toHaveBeenCalled();
    // });

    // it('[CV-02] Respuesta exitosa vacía → vacantes = [] y logger.log llamado', () => {
    //     // Arrange
    //     matchSpy.getVacantesForEmpresa.and.returnValue(of([]));

    //     // Act
    //     component.cargarVacantes();

    //     // Assert
    //     expect(component.vacantes).toEqual([]);
    //     expect(loggerSpy.log).toHaveBeenCalled();
    // });

    // it('[CV-03] Error HTTP → alert + logger.log con mensaje de error', () => {
    //     // Arrange
    //     spyOn(window, 'alert');
    //     matchSpy.getVacantesForEmpresa.and.returnValue(
    //         throwError(() => new Error('network error'))
    //     );

    //     // Act
    //     component.cargarVacantes();

    //     // Assert
    //     expect(window.alert).toHaveBeenCalledWith('Error al cargar vacantes');
    //     expect(loggerSpy.log).toHaveBeenCalled();
    // });
});

// ═════════════════════════════════════════════════════════════════════════════
// Suite 2 — publicarVacante()
// ═════════════════════════════════════════════════════════════════════════════

describe('HU8RF9 — Publicar Vacante | PerfilVacantes.publicarVacante()', () => {
    let component: PerfilVacantes;
    let fixture: ComponentFixture<PerfilVacantes>;
    let perfilSpy: jasmine.SpyObj<Perfil>;
    let matchSpy: jasmine.SpyObj<Match>;
    let loggerSpy: jasmine.SpyObj<LoggerService>;

    beforeEach(async () => {
        perfilSpy = jasmine.createSpyObj<Perfil>('Perfil', [
            'createVacante', 'updateVacante', 'getHabilidades',
            'getIdiomas', 'getCatalogosPostulante',
        ]);
        matchSpy = jasmine.createSpyObj<Match>('Match', ['getVacantesForEmpresa']);
        loggerSpy = jasmine.createSpyObj<LoggerService>('LoggerService', ['log', 'error']);

        matchSpy.getVacantesForEmpresa.and.returnValue(of([]));

        await buildTestBed(perfilSpy, matchSpy, loggerSpy);

        fixture = TestBed.createComponent(PerfilVacantes);
        component = fixture.componentInstance;
        fixture.detectChanges();

        sessionStorage.clear();
    });

    afterEach(() => sessionStorage.clear());

    // ── Bloque A — Sin perfilId en sessionStorage ──────────────────────────────

    it('[C1] Sin perfilId → logger.error y return sin HTTP', () => {
        // Arrange
        fillVacanteForm(component);

        // Act
        component.publicarVacante();

        // Assert
        expect(loggerSpy.error).toHaveBeenCalledWith(
            'No se pudo obtener el perfilId de sessionStorage.'
        );
        expect(perfilSpy.createVacante).not.toHaveBeenCalled();
        expect(perfilSpy.updateVacante).not.toHaveBeenCalled();
    });

    // ── Bloque B — modoEdicion = true (updateVacante) ─────────────────────────

    it('[C2] habilidades[], idiomas[], modoEdicion=true → updateVacante next → resetFormulario', () => {
        // Arrange
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.modoEdicion = true;
        component.vacanteEditandoId = 'vacante-uuid';
        perfilSpy.updateVacante.and.returnValue(of({ id_vacante: 'vacante-uuid' }));

        // Act
        component.publicarVacante();

        // Assert
        expect(perfilSpy.updateVacante).toHaveBeenCalledWith(
            'vacante-uuid',
            jasmine.objectContaining({ empresa: 'empresa-uuid' })
        );
        expect(loggerSpy.log).toHaveBeenCalled();
        expect(component.modoEdicion).toBeFalse();
        expect(component.activeTab).toBe('list');
    });

    it('[C3] modoEdicion=true → updateVacante error → logger.error', () => {
        // Arrange
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.modoEdicion = true;
        component.vacanteEditandoId = 'vacante-uuid';
        perfilSpy.updateVacante.and.returnValue(throwError(() => new Error('update error')));

        // Act
        component.publicarVacante();

        // Assert
        expect(perfilSpy.updateVacante).toHaveBeenCalled();
        expect(loggerSpy.error).toHaveBeenCalledWith(jasmine.any(Error));
    });

    it('[C2b] modoEdicion=true pero vacanteEditandoId=null → createVacante (no updateVacante)', () => {
        // Arrange
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.modoEdicion = true;
        component.vacanteEditandoId = null; // condición && falla
        perfilSpy.createVacante.and.returnValue(of({}));

        // Act
        component.publicarVacante();

        // Assert
        expect(perfilSpy.updateVacante).not.toHaveBeenCalled();
        expect(perfilSpy.createVacante).toHaveBeenCalled();
    });

    it('[C2c] modoEdicion=false y vacanteEditandoId definido → createVacante (no updateVacante)', () => {
        // Arrange
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.modoEdicion = false;
        component.vacanteEditandoId = 'vacante-uuid'; // condición && falla por modoEdicion
        perfilSpy.createVacante.and.returnValue(of({}));

        // Act
        component.publicarVacante();

        // Assert
        expect(perfilSpy.updateVacante).not.toHaveBeenCalled();
        expect(perfilSpy.createVacante).toHaveBeenCalled();
    });

    // ── Bloque C — modoEdicion = false (createVacante) ────────────────────────

    it('[C4] habilidades[], idiomas[], modoEdicion=false → createVacante next → resetFormulario', () => {
        // Arrange
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(of({ id_vacante: 'nueva-uuid' }));

        // Act
        component.publicarVacante();

        // Assert
        expect(perfilSpy.createVacante).toHaveBeenCalledWith(
            jasmine.objectContaining({
                empresa: 'empresa-uuid',
                vacanteHabilidades: [],
                vacantesIdiomas: [],
            })
        );
        expect(loggerSpy.log).toHaveBeenCalled();
        expect(component.modoEdicion).toBeFalse();
        expect(component.activeTab).toBe('list');
    });

    it('[C5] modoEdicion=false → createVacante error → logger.error', () => {
        // Arrange
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(throwError(() => new Error('create error')));

        // Act
        component.publicarVacante();

        // Assert
        expect(perfilSpy.createVacante).toHaveBeenCalled();
        expect(loggerSpy.error).toHaveBeenCalledWith(jasmine.any(Error));
    });

    // ── Bloque D — Con idiomas ────────────────────────────────────────────────

    it('[C6] idiomas=["id-1"], modoEdicion=true → updateVacante next → resetFormulario', () => {
        // Arrange
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.idiomas.push(component.fb.control('id-1'));
        component.modoEdicion = true;
        component.vacanteEditandoId = 'vacante-uuid';
        perfilSpy.updateVacante.and.returnValue(of({}));

        // Act
        component.publicarVacante();

        // Assert
        expect(perfilSpy.updateVacante).toHaveBeenCalledWith(
            'vacante-uuid',
            jasmine.objectContaining({ vacantesIdiomas: ['id-1'] })
        );
        expect(component.activeTab).toBe('list');
    });

    it('[C7] idiomas=["id-1"], modoEdicion=true → updateVacante error → logger.error', () => {
        // Arrange
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.idiomas.push(component.fb.control('id-1'));
        component.modoEdicion = true;
        component.vacanteEditandoId = 'vacante-uuid';
        perfilSpy.updateVacante.and.returnValue(throwError(() => new Error('err')));

        // Act
        component.publicarVacante();

        // Assert
        expect(loggerSpy.error).toHaveBeenCalled();
        expect(component.activeTab).toBe('form');
    });

    it('[C8] idiomas=["id-1"], modoEdicion=false → createVacante next → resetFormulario', () => {
        // Arrange
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.idiomas.push(component.fb.control('id-1'));
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(of({}));

        // Act
        component.publicarVacante();

        // Assert
        expect(perfilSpy.createVacante).toHaveBeenCalledWith(
            jasmine.objectContaining({ vacantesIdiomas: ['id-1'], vacanteHabilidades: [] })
        );
        expect(component.activeTab).toBe('list');
    });

    it('[C9] idiomas=["id-1"], modoEdicion=false → createVacante error → logger.error', () => {
        // Arrange
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.idiomas.push(component.fb.control('id-1'));
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(throwError(() => new Error('err')));

        // Act
        component.publicarVacante();

        // Assert
        expect(loggerSpy.error).toHaveBeenCalled();
    });

    // ── Bloque E — Con habilidades ────────────────────────────────────────────

    it('[C10] habilidades=["hab-1"], modoEdicion=true → updateVacante next → resetFormulario', () => {
        // Arrange
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.habilidades.push(component.fb.control('hab-1'));
        component.modoEdicion = true;
        component.vacanteEditandoId = 'vacante-uuid';
        perfilSpy.updateVacante.and.returnValue(of({}));

        // Act
        component.publicarVacante();

        // Assert
        expect(perfilSpy.updateVacante).toHaveBeenCalledWith(
            'vacante-uuid',
            jasmine.objectContaining({ vacanteHabilidades: ['hab-1'], vacantesIdiomas: [] })
        );
        expect(component.activeTab).toBe('list');
    });

    it('[C11] habilidades=["hab-1"], modoEdicion=true → updateVacante error → logger.error', () => {
        // Arrange
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.habilidades.push(component.fb.control('hab-1'));
        component.modoEdicion = true;
        component.vacanteEditandoId = 'vacante-uuid';
        perfilSpy.updateVacante.and.returnValue(throwError(() => new Error('err')));

        // Act
        component.publicarVacante();

        // Assert
        expect(loggerSpy.error).toHaveBeenCalled();
    });

    it('[C12] habilidades=["hab-1"], modoEdicion=false → createVacante next → resetFormulario', () => {
        // Arrange
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.habilidades.push(component.fb.control('hab-1'));
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(of({}));

        // Act
        component.publicarVacante();

        // Assert
        expect(perfilSpy.createVacante).toHaveBeenCalledWith(
            jasmine.objectContaining({ vacanteHabilidades: ['hab-1'], vacantesIdiomas: [] })
        );
        expect(component.activeTab).toBe('list');
    });

    it('[C13] habilidades=["hab-1"], modoEdicion=false → createVacante error → logger.error', () => {
        // Arrange
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.habilidades.push(component.fb.control('hab-1'));
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(throwError(() => new Error('err')));

        // Act
        component.publicarVacante();

        // Assert
        expect(loggerSpy.error).toHaveBeenCalled();
    });

    // ── Bloque F — Con habilidades + idiomas ──────────────────────────────────

    it('[C14] habilidades+idiomas, modoEdicion=true → updateVacante next → resetFormulario', () => {
        // Arrange
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.habilidades.push(component.fb.control('hab-1'));
        component.idiomas.push(component.fb.control('id-1'));
        component.modoEdicion = true;
        component.vacanteEditandoId = 'vacante-uuid';
        perfilSpy.updateVacante.and.returnValue(of({}));

        // Act
        component.publicarVacante();

        // Assert
        expect(perfilSpy.updateVacante).toHaveBeenCalledWith(
            'vacante-uuid',
            jasmine.objectContaining({ vacanteHabilidades: ['hab-1'], vacantesIdiomas: ['id-1'] })
        );
        expect(component.activeTab).toBe('list');
    });

    it('[C15] habilidades+idiomas, modoEdicion=true → updateVacante error → logger.error', () => {
        // Arrange
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.habilidades.push(component.fb.control('hab-1'));
        component.idiomas.push(component.fb.control('id-1'));
        component.modoEdicion = true;
        component.vacanteEditandoId = 'vacante-uuid';
        perfilSpy.updateVacante.and.returnValue(throwError(() => new Error('err')));

        // Act
        component.publicarVacante();

        // Assert
        expect(loggerSpy.error).toHaveBeenCalled();
    });

    it('[C16] habilidades+idiomas, modoEdicion=false → createVacante next → resetFormulario', () => {
        // Arrange
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.habilidades.push(component.fb.control('hab-1'));
        component.idiomas.push(component.fb.control('id-1'));
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(of({}));

        // Act
        component.publicarVacante();

        // Assert
        expect(perfilSpy.createVacante).toHaveBeenCalledWith(
            jasmine.objectContaining({ vacanteHabilidades: ['hab-1'], vacantesIdiomas: ['id-1'] })
        );
        expect(component.activeTab).toBe('list');
    });

    it('[C17] habilidades+idiomas, modoEdicion=false → createVacante error → logger.error', () => {
        // Arrange
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.habilidades.push(component.fb.control('hab-1'));
        component.idiomas.push(component.fb.control('id-1'));
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(throwError(() => new Error('err')));

        // Act
        component.publicarVacante();

        // Assert
        expect(loggerSpy.error).toHaveBeenCalled();
    });

    // ── Bloque G — Casos de prueba CP ─────────────────────────────────────────

    it('[CP-040] Datos válidos completos → createVacante ejecutado y resetFormulario', () => {
        // Arrange
        sessionStorage.setItem('perfilId', 'empresa-uuid-cp040');
        fillVacanteForm(component, {
            titulo: 'Desarrollador Full Stack',
            salario: '5000000',
            ubicacion: 'Medellín',
            modalidad: 'Híbrido',
            tipo_trabajo: 'Full-time',
        });
        component.habilidades.push(component.fb.control('hab-uuid-1'));
        component.idiomas.push(component.fb.control('idioma-uuid-1'));
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(of({ id_vacante: 'uuid-nueva' }));

        // Act
        component.publicarVacante();

        // Assert
        expect(perfilSpy.createVacante).toHaveBeenCalledWith(
            jasmine.objectContaining({
                titulo: 'Desarrollador Full Stack',
                empresa: 'empresa-uuid-cp040',
                vacanteHabilidades: ['hab-uuid-1'],
                vacantesIdiomas: ['idioma-uuid-1'],
            })
        );
        expect(loggerSpy.log).toHaveBeenCalled();
        expect(component.activeTab).toBe('list');
    });

    it('[CP-041] Campos vacíos — [BUG] sin validación, createVacante llamado igualmente', () => {
        // Arrange
        sessionStorage.setItem('perfilId', 'empresa-uuid-cp041');
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(of({}));

        // Act
        component.publicarVacante();

        // Assert
        expect(perfilSpy.createVacante).toHaveBeenCalledWith(
            jasmine.objectContaining({ titulo: '', ubicacion: '', salario: '' })
        );
    });

    it('[CP-042] Caracteres especiales — [BUG] se envían sin validación', () => {
        // Arrange
        sessionStorage.setItem('perfilId', 'empresa-uuid-cp042');
        fillVacanteForm(component, { titulo: '!@#$%^&*()', salario: '@@@@' });
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(of({}));

        // Act
        component.publicarVacante();

        // Assert
        expect(perfilSpy.createVacante).toHaveBeenCalledWith(
            jasmine.objectContaining({ titulo: '!@#$%^&*()', salario: '@@@@' })
        );
    });

    it('[CP-043a] Salario negativo — [BUG] se envía sin validación', () => {
        // Arrange
        sessionStorage.setItem('perfilId', 'empresa-uuid-cp043a');
        fillVacanteForm(component, { salario: '-500000' });
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(of({}));

        // Act
        component.publicarVacante();

        // Assert
        expect(perfilSpy.createVacante).toHaveBeenCalledWith(
            jasmine.objectContaining({ salario: '-500000' })
        );
    });

    it('[CP-045a] Inyección XSS en título — [BUG] payload enviado sin sanitizar', () => {
        // Arrange
        sessionStorage.setItem('perfilId', 'empresa-uuid-cp045a');
        const xssPayload = '<script>alert("xss")</script>';
        fillVacanteForm(component, { titulo: xssPayload });
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(of({}));

        // Act
        component.publicarVacante();

        // Assert
        expect(perfilSpy.createVacante).toHaveBeenCalledWith(
            jasmine.objectContaining({ titulo: xssPayload })
        );
    });

    it('[OIE-01] obtenerIdEmpresa con perfilId válido → retorna el id sin llamar logger.error', () => {
        sessionStorage.setItem('perfilId', 'mi-empresa-id');
        fillVacanteForm(component);
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(of({}));

        component.publicarVacante();

        expect(loggerSpy.error).not.toHaveBeenCalled();
        expect(perfilSpy.createVacante).toHaveBeenCalledWith(
            jasmine.objectContaining({ empresa: 'mi-empresa-id' })
        );
    });

    it('[PP-01] prepararVacante con habilidades y idiomas con datos → no sobreescribe con []', () => {
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.habilidades.push(component.fb.control('hab-1'));
        component.idiomas.push(component.fb.control('id-1'));
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(of({}));

        component.publicarVacante();

        expect(perfilSpy.createVacante).toHaveBeenCalledWith(
            jasmine.objectContaining({
                vacanteHabilidades: ['hab-1'],
                vacantesIdiomas: ['id-1'],
            })
        );
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// Suite 3 — editarVacante()
// ═════════════════════════════════════════════════════════════════════════════

describe('PerfilVacantes — editarVacante()', () => {
    let component: PerfilVacantes;
    let fixture: ComponentFixture<PerfilVacantes>;
    let perfilSpy: jasmine.SpyObj<Perfil>;
    let matchSpy: jasmine.SpyObj<Match>;
    let loggerSpy: jasmine.SpyObj<LoggerService>;

    beforeEach(async () => {
        perfilSpy = jasmine.createSpyObj<Perfil>('Perfil', [
            'createVacante', 'updateVacante', 'getHabilidades',
            'getIdiomas', 'getCatalogosPostulante',
        ]);
        matchSpy = jasmine.createSpyObj<Match>('Match', ['getVacantesForEmpresa']);
        loggerSpy = jasmine.createSpyObj<LoggerService>('LoggerService', ['log', 'error']);

        matchSpy.getVacantesForEmpresa.and.returnValue(of([]));
        perfilSpy.getCatalogosPostulante.and.returnValue(of(CATALOGO_MOCK) as never);

        await buildTestBed(perfilSpy, matchSpy, loggerSpy);

        fixture = TestBed.createComponent(PerfilVacantes);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => sessionStorage.clear());

    it('[C1] Habilidades e idiomas válidos → push en ambos FormArrays', () => {
        // Arrange
        const v = makeVacante({ habilidades: ['Angular'], idiomas: ['Español'] });

        // Act
        component.editarVacante(v);

        // Assert
        expect(component.modoEdicion).toBeTrue();
        expect(component.vacanteEditandoId).toBe('v-uuid-1');
        expect(component.habilidades.length).toBe(1);
        expect(component.habilidades.at(0).value).toBe('hab-1');
        expect(component.idiomas.length).toBe(1);
        expect(component.idiomas.at(0).value).toBe('id-1');
    });

    it('[C2] Habilidad válida, idioma no encontrado → solo push habilidad', () => {
        // Arrange
        const v = makeVacante({ habilidades: ['Angular'], idiomas: ['Klingon'] });

        // Act
        component.editarVacante(v);

        // Assert
        expect(component.habilidades.length).toBe(1);
        expect(component.idiomas.length).toBe(0);
    });

    it('[C3] Habilidad no encontrada, idioma válido → solo push idioma', () => {
        // Arrange
        const v = makeVacante({ habilidades: ['Cobol'], idiomas: ['Español'] });

        // Act
        component.editarVacante(v);

        // Assert
        expect(component.habilidades.length).toBe(0);
        expect(component.idiomas.length).toBe(1);
        expect(component.idiomas.at(0).value).toBe('id-1');
    });

    it('[C4] Ni habilidad ni idioma encontrados → FormArrays vacíos', () => {
        // Arrange
        const v = makeVacante({ habilidades: ['Cobol'], idiomas: ['Klingon'] });

        // Act
        component.editarVacante(v);

        // Assert
        expect(component.habilidades.length).toBe(0);
        expect(component.idiomas.length).toBe(0);
    });

    it('[C5] Habilidades vacías, idioma válido → solo push idioma', () => {
        // Arrange
        const v = makeVacante({ habilidades: [], idiomas: ['Español'] });

        // Act
        component.editarVacante(v);

        // Assert
        expect(component.habilidades.length).toBe(0);
        expect(component.idiomas.length).toBe(1);
    });

    it('[C6] Habilidades vacías, idioma no encontrado → FormArrays vacíos', () => {
        // Arrange
        const v = makeVacante({ habilidades: [], idiomas: ['Klingon'] });

        // Act
        component.editarVacante(v);

        // Assert
        expect(component.habilidades.length).toBe(0);
        expect(component.idiomas.length).toBe(0);
    });

    it('[C7] Habilidad válida, idiomas vacíos → solo push habilidad', () => {
        // Arrange
        const v = makeVacante({ habilidades: ['Angular'], idiomas: [] });

        // Act
        component.editarVacante(v);

        // Assert
        expect(component.habilidades.length).toBe(1);
        expect(component.idiomas.length).toBe(0);
    });

    it('[C8] Habilidad no encontrada, idiomas vacíos → FormArrays vacíos', () => {
        // Arrange
        const v = makeVacante({ habilidades: ['Cobol'], idiomas: [] });

        // Act
        component.editarVacante(v);

        // Assert
        expect(component.habilidades.length).toBe(0);
        expect(component.idiomas.length).toBe(0);
    });

    it('[C9] Habilidades e idiomas vacíos → FormArrays vacíos', () => {
        // Arrange
        const v = makeVacante({ habilidades: [], idiomas: [] });

        // Act
        component.editarVacante(v);

        // Assert
        expect(component.habilidades.length).toBe(0);
        expect(component.idiomas.length).toBe(0);
    });

    it('[C10] Tab cambia a form y modoEdicion=true al editar', () => {
        // Arrange
        const v = makeVacante();
        component.activeTab = 'list';

        // Act
        component.editarVacante(v);

        // Assert
        expect(component.activeTab).toBe('form');
        expect(component.modoEdicion).toBeTrue();
        expect(component.vacanteEditandoId).toBe('v-uuid-1');
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// Suite 4 — Habilidades e Idiomas (toggle, agregar, eliminar)
// ═════════════════════════════════════════════════════════════════════════════

describe('PerfilVacantes — Habilidades e Idiomas', () => {
    let component: PerfilVacantes;
    let fixture: ComponentFixture<PerfilVacantes>;
    let perfilSpy: jasmine.SpyObj<Perfil>;
    let matchSpy: jasmine.SpyObj<Match>;
    let loggerSpy: jasmine.SpyObj<LoggerService>;

    beforeEach(async () => {
        perfilSpy = jasmine.createSpyObj<Perfil>('Perfil', [
            'getHabilidades', 'getIdiomas', 'createVacante',
            'updateVacante', 'getCatalogosPostulante',
        ]);
        matchSpy = jasmine.createSpyObj<Match>('Match', ['getVacantesForEmpresa']);
        loggerSpy = jasmine.createSpyObj<LoggerService>('LoggerService', ['log', 'error']);

        matchSpy.getVacantesForEmpresa.and.returnValue(of([]));
        perfilSpy.getHabilidades.and.returnValue(of(CATALOGO_MOCK.habilidades as unknown as Habilidad[]));
        perfilSpy.getIdiomas.and.returnValue(of(CATALOGO_MOCK.idiomas as unknown as Idioma[]));

        await buildTestBed(perfilSpy, matchSpy, loggerSpy);

        fixture = TestBed.createComponent(PerfilVacantes);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('[HAB-01] agregarSelectHabilidad → agrega control y muestra false', () => {
        // Arrange
        const prevLength = component.habilidades.length;

        // Act
        component.agregarSelectHabilidad();

        // Assert
        expect(component.habilidades.length).toBe(prevLength + 1);
        expect(component.mostrarListaHabilidad[prevLength]).toBeFalse();
    });

    it('[HAB-02] eliminarSelectHabilidad → elimina control en índice correcto', () => {
        // Arrange
        component.agregarSelectHabilidad();
        component.agregarSelectHabilidad();

        // Act
        component.eliminarSelectHabilidad(0);

        // Assert
        expect(component.habilidades.length).toBe(1);
        expect(component.mostrarListaHabilidad.length).toBe(1);
    });

    it('[HAB-03] toggleListaHabilidad → carga habilidades y alterna visibilidad', () => {
        // Arrange
        component.agregarSelectHabilidad();

        // Act
        component.toggleListaHabilidad(0);

        // Assert
        expect(perfilSpy.getHabilidades).toHaveBeenCalled();
        expect(component.mostrarListaHabilidad[0]).toBeTrue();
    });

    it('[HAB-04] seleccionarHabilidad → asigna id y cierra lista', () => {
        // Arrange
        component.agregarSelectHabilidad();
        component.mostrarListaHabilidad[0] = true;
        const habilidad = CATALOGO_MOCK.habilidades[0] as unknown as Habilidad;

        // Act
        component.seleccionarHabilidad(0, habilidad);

        // Assert
        expect(component.habilidades.at(0).value).toBe('hab-1');
        expect(component.mostrarListaHabilidad[0]).toBeFalse();
    });

    it('[IDI-01] agregarSelectIdioma → agrega control y muestra false', () => {
        // Arrange
        const prevLength = component.idiomas.length;

        // Act
        component.agregarSelectIdioma();

        // Assert
        expect(component.idiomas.length).toBe(prevLength + 1);
        expect(component.mostrarListaIdioma[prevLength]).toBeFalse();
    });

    it('[IDI-02] eliminarSelectIdioma → elimina control en índice correcto', () => {
        // Arrange
        component.agregarSelectIdioma();
        component.agregarSelectIdioma();

        // Act
        component.eliminarSelectIdioma(0);

        // Assert
        expect(component.idiomas.length).toBe(1);
        expect(component.mostrarListaIdioma.length).toBe(1);
    });

    it('[IDI-03] toggleListaIdioma → carga idiomas y alterna visibilidad', () => {
        // Arrange
        component.agregarSelectIdioma();

        // Act
        component.toggleListaIdioma(0);

        // Assert
        expect(perfilSpy.getIdiomas).toHaveBeenCalled();
        expect(component.mostrarListaIdioma[0]).toBeTrue();
    });

    it('[IDI-04] seleccionarIdioma → asigna id y cierra lista', () => {
        // Arrange
        component.agregarSelectIdioma();
        component.mostrarListaIdioma[0] = true;
        const idioma = CATALOGO_MOCK.idiomas[0] as unknown as Idioma;

        // Act
        component.seleccionarIdioma(0, idioma);

        // Assert
        expect(component.idiomas.at(0).value).toBe('id-1');
        expect(component.mostrarListaIdioma[0]).toBeFalse();
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// Suite 5 — eliminarVacante() y setActiveTab()
// ═════════════════════════════════════════════════════════════════════════════

describe('PerfilVacantes — eliminarVacante() y setActiveTab()', () => {
    let component: PerfilVacantes;
    let fixture: ComponentFixture<PerfilVacantes>;
    let perfilSpy: jasmine.SpyObj<Perfil>;
    let matchSpy: jasmine.SpyObj<Match>;
    let loggerSpy: jasmine.SpyObj<LoggerService>;

    beforeEach(async () => {
        perfilSpy = jasmine.createSpyObj<Perfil>('Perfil', [
            'getHabilidades', 'getIdiomas', 'createVacante',
            'updateVacante', 'getCatalogosPostulante',
        ]);
        matchSpy = jasmine.createSpyObj<Match>('Match', ['getVacantesForEmpresa']);
        loggerSpy = jasmine.createSpyObj<LoggerService>('LoggerService', ['log', 'error']);

        matchSpy.getVacantesForEmpresa.and.returnValue(of([]));

        await buildTestBed(perfilSpy, matchSpy, loggerSpy);

        fixture = TestBed.createComponent(PerfilVacantes);
        component = fixture.componentInstance;
        component.vacantes = [...VACANTE_MOCK];
        fixture.detectChanges();
    });

    it('[EV-01] Confirmar eliminar → vacante removida de la lista', () => {
        // Arrange
        spyOn(window, 'confirm').and.returnValue(true);

        // Act
        component.eliminarVacante('1');

        // Assert
        expect(component.vacantes.length).toBe(0);
    });

    it('[EV-02] Cancelar eliminar → lista permanece intacta', () => {
        // Arrange
        spyOn(window, 'confirm').and.returnValue(false);

        // Act
        component.eliminarVacante('1');

        // Assert
        expect(component.vacantes.length).toBe(1);
    });

    it('[TAB-01] setActiveTab("list") → activeTab cambia a list', () => {
        // Arrange + Act
        component.setActiveTab('list');

        // Assert
        expect(component.activeTab).toBe('list');
    });

    it('[TAB-02] setActiveTab("form") → activeTab cambia a form', () => {
        // Arrange
        component.activeTab = 'list';

        // Act
        component.setActiveTab('form');

        // Assert
        expect(component.activeTab).toBe('form');
    });
});