import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { PerfilVacantes } from './perfil-vacantes';
import { Match } from '../../../shared/services/match';
import { Perfil } from '../../../shared/services/perfil';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';

//NAT
describe('PerfilVacantes', () => {
  let component: PerfilVacantes;
  let fixture: ComponentFixture<PerfilVacantes>;
  let matchSpy: jasmine.SpyObj<Match>;
  let perfilSpy: jasmine.SpyObj<Perfil>;

  beforeEach(async () => {
    matchSpy = jasmine.createSpyObj<Match>('Match', ['getVacantesForEmpresa']);
    perfilSpy = jasmine.createSpyObj<Perfil>('Perfil', [
      'getHabilidades',
      'getIdiomas',
      'updateVacante',
      'createVacante',
      'getCatalogosPostulante',
    ]);

    await TestBed.configureTestingModule({
      imports: [PerfilVacantes],
      providers: [
        { provide: Match, useValue: matchSpy },
        { provide: Perfil, useValue: perfilSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilVacantes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('cargarVacantes subscribe exitoso', () => {
    const vacantesMock = [
      {
        id_vacante: '1',
        titulo: 'Desarrollador Frontend',
        tipo_trabajo: 'Tiempo completo',
        modalidad: 'Remoto',
        salario: 3500000,
        ubicacion: 'Medellin',
        empresa: {
          id_perfil: 'emp 1',
          name_empresa: 'Tech Solutions',
          ubicacion: 'Medellin',
          descripcion: 'Empresa de tecnologia',
          sector: 'Software',
          NIT: '9001234567',
        },
        habilidades: ['Angular', 'TypeScript'],
        idiomas: ['Espanol', 'Ingles'],
      },
    ];
    matchSpy.getVacantesForEmpresa.and.returnValue(of(vacantesMock));

    component.cargarVacantes();

    expect(component.vacantes).toEqual(vacantesMock);
    expect(matchSpy.getVacantesForEmpresa).toHaveBeenCalled();
  });

  it('cargarVacantes subscribe exitoso []', () => {
    matchSpy.getVacantesForEmpresa.and.returnValue(of([]));

    component.cargarVacantes();

    expect(component.vacantes).toEqual([]);
    expect(matchSpy.getVacantesForEmpresa).toHaveBeenCalled();
  });

  it('cargarVacantes subscribe error', () => {
    spyOn(window, 'alert');
    spyOn(console, 'log');
    matchSpy.getVacantesForEmpresa.and.returnValue(
      throwError(() => new Error('network error'))
    );

    component.cargarVacantes();

    expect(matchSpy.getVacantesForEmpresa).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Error al cargar vacantes');
    expect(console.log).toHaveBeenCalledWith(
      'error al cargar vacantes',
      jasmine.any(Error)
    );
  });
});


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

describe('HU8RF9 — Publicar Vacante | PerfilVacantes.publicarVacante()', () => {
    let component: PerfilVacantes;
    let fixture: ComponentFixture<PerfilVacantes>;
    let perfilSpy: jasmine.SpyObj<Perfil>;
    let matchSpy: jasmine.SpyObj<Match>;
    let consoleSpy: jasmine.Spy;
    let consoleErrorSpy: jasmine.Spy;

    beforeEach(async () => {
        perfilSpy = jasmine.createSpyObj('Perfil', [
            'createVacante',
            'updateVacante',
            'getHabilidades',
            'getIdiomas',
            'getCatalogosPostulante',
        ]);
        matchSpy = jasmine.createSpyObj('Match', ['getVacantesForEmpresa']);
        matchSpy.getVacantesForEmpresa.and.returnValue(of([]));
        perfilSpy.getHabilidades.and.returnValue(of([]));
        perfilSpy.getIdiomas.and.returnValue(of([]));

        await TestBed.configureTestingModule({
            imports: [PerfilVacantes, ReactiveFormsModule, HttpClientTestingModule],
            providers: [
                FormBuilder,
                { provide: Perfil, useValue: perfilSpy },
                { provide: Match, useValue: matchSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PerfilVacantes);
        component = fixture.componentInstance;
        fixture.detectChanges();

        consoleSpy = spyOn(console, 'log').and.callThrough();
        consoleErrorSpy = spyOn(console, 'error').and.callThrough();

        sessionStorage.clear();
    });

    afterEach(() => sessionStorage.clear());

    it('[C1] Camino 1,2,3,4,5,F — sessionStorage sin perfilId → console.error y return sin HTTP', () => {
        fillVacanteForm(component);

        component.publicarVacante();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'No se pudo obtener el perfilId de sessionStorage.'
        );
        expect(perfilSpy.createVacante).not.toHaveBeenCalled();
        expect(perfilSpy.updateVacante).not.toHaveBeenCalled();
    });

    it('[C2] Camino …12,13,14,15,F — habilidades[], idiomas[], modoEdicion=true → updateVacante next → resetFormulario', () => {
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.modoEdicion = true;
        component.vacanteEditandoId = 'vacante-uuid';
        perfilSpy.updateVacante.and.returnValue(of({ id_vacante: 'vacante-uuid' }));

        component.publicarVacante();

        expect(perfilSpy.updateVacante).toHaveBeenCalledWith(
            'vacante-uuid',
            jasmine.objectContaining({ empresa: 'empresa-uuid' })
        );
        expect(consoleSpy).toHaveBeenCalledWith('Vacante actualizada:', jasmine.anything());
        expect(component.modoEdicion).toBeFalse();
        expect(component.activeTab).toBe('list');
    });

    it('[C3] Camino …12,13,16,F — modoEdicion=true → updateVacante error → console.error', () => {
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.modoEdicion = true;
        component.vacanteEditandoId = 'vacante-uuid';
        perfilSpy.updateVacante.and.returnValue(throwError(() => new Error('update error')));

        component.publicarVacante();

        expect(perfilSpy.updateVacante).toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalledWith(jasmine.any(Error));
    });

    it('[C4] Camino …12,17,18,19,F — habilidades[], idiomas[], modoEdicion=false → createVacante next → resetFormulario', () => {
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(of({ id_vacante: 'nueva-uuid' }));

        component.publicarVacante();

        expect(perfilSpy.createVacante).toHaveBeenCalledWith(
            jasmine.objectContaining({
                empresa: 'empresa-uuid',
                vacanteHabilidades: [],
                vacantesIdiomas: [],
            })
        );
        expect(consoleSpy).toHaveBeenCalledWith('Vacante guardada correctamente:', jasmine.anything());
        expect(component.modoEdicion).toBeFalse();
        expect(component.activeTab).toBe('list');
    });

    it('[C5] Camino …12,17,20,F — modoEdicion=false → createVacante error → console.error', () => {
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(throwError(() => new Error('create error')));

        component.publicarVacante();

        expect(perfilSpy.createVacante).toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalledWith(jasmine.any(Error));
    });

    it('[C6] idiomas=["id-1"], habilidades=[], modoEdicion=true → updateVacante next → resetFormulario', () => {
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.idiomas.push(component.fb.control('id-1'));
        component.modoEdicion = true;
        component.vacanteEditandoId = 'vacante-uuid';
        perfilSpy.updateVacante.and.returnValue(of({}));

        component.publicarVacante();

        expect(perfilSpy.updateVacante).toHaveBeenCalledWith(
            'vacante-uuid',
            jasmine.objectContaining({ vacantesIdiomas: ['id-1'] })
        );
        expect(component.activeTab).toBe('list');
    });

    it('[C7] idiomas=["id-1"], habilidades=[], modoEdicion=true → updateVacante error → console.error', () => {
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.idiomas.push(component.fb.control('id-1'));
        component.modoEdicion = true;
        component.vacanteEditandoId = 'vacante-uuid';
        perfilSpy.updateVacante.and.returnValue(throwError(() => new Error('err')));

        component.publicarVacante();

        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(component.activeTab).toBe('form');
    });

    it('[C8] idiomas=["id-1"], habilidades=[], modoEdicion=false → createVacante next → resetFormulario', () => {
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.idiomas.push(component.fb.control('id-1'));
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(of({}));

        component.publicarVacante();

        expect(perfilSpy.createVacante).toHaveBeenCalledWith(
            jasmine.objectContaining({ vacantesIdiomas: ['id-1'], vacanteHabilidades: [] })
        );
        expect(component.activeTab).toBe('list');
    });

    it('[C9] idiomas=["id-1"], habilidades=[], modoEdicion=false → createVacante error → console.error', () => {
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.idiomas.push(component.fb.control('id-1'));
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(throwError(() => new Error('err')));

        component.publicarVacante();

        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('[C10] habilidades=["hab-1"], idiomas=[], modoEdicion=true → updateVacante next → resetFormulario', () => {
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.habilidades.push(component.fb.control('hab-1'));
        component.modoEdicion = true;
        component.vacanteEditandoId = 'vacante-uuid';
        perfilSpy.updateVacante.and.returnValue(of({}));

        component.publicarVacante();

        expect(perfilSpy.updateVacante).toHaveBeenCalledWith(
            'vacante-uuid',
            jasmine.objectContaining({ vacanteHabilidades: ['hab-1'], vacantesIdiomas: [] })
        );
        expect(component.activeTab).toBe('list');
    });

    it('[C11] habilidades=["hab-1"], idiomas=[], modoEdicion=true → updateVacante error → console.error', () => {
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.habilidades.push(component.fb.control('hab-1'));
        component.modoEdicion = true;
        component.vacanteEditandoId = 'vacante-uuid';
        perfilSpy.updateVacante.and.returnValue(throwError(() => new Error('err')));

        component.publicarVacante();

        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('[C12] habilidades=["hab-1"], idiomas=[], modoEdicion=false → createVacante next → resetFormulario', () => {
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.habilidades.push(component.fb.control('hab-1'));
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(of({}));

        component.publicarVacante();

        expect(perfilSpy.createVacante).toHaveBeenCalledWith(
            jasmine.objectContaining({ vacanteHabilidades: ['hab-1'], vacantesIdiomas: [] })
        );
        expect(component.activeTab).toBe('list');
    });

    it('[C13] habilidades=["hab-1"], idiomas=[], modoEdicion=false → createVacante error → console.error', () => {
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.habilidades.push(component.fb.control('hab-1'));
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(throwError(() => new Error('err')));

        component.publicarVacante();

        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('[C14] habilidades=["hab-1"], idiomas=["id-1"], modoEdicion=true → updateVacante next → resetFormulario', () => {
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.habilidades.push(component.fb.control('hab-1'));
        component.idiomas.push(component.fb.control('id-1'));
        component.modoEdicion = true;
        component.vacanteEditandoId = 'vacante-uuid';
        perfilSpy.updateVacante.and.returnValue(of({}));

        component.publicarVacante();

        expect(perfilSpy.updateVacante).toHaveBeenCalledWith(
            'vacante-uuid',
            jasmine.objectContaining({ vacanteHabilidades: ['hab-1'], vacantesIdiomas: ['id-1'] })
        );
        expect(component.activeTab).toBe('list');
    });

    it('[C15] habilidades=["hab-1"], idiomas=["id-1"], modoEdicion=true → updateVacante error → console.error', () => {
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.habilidades.push(component.fb.control('hab-1'));
        component.idiomas.push(component.fb.control('id-1'));
        component.modoEdicion = true;
        component.vacanteEditandoId = 'vacante-uuid';
        perfilSpy.updateVacante.and.returnValue(throwError(() => new Error('err')));

        component.publicarVacante();

        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('[C16] habilidades=["hab-1"], idiomas=["id-1"], modoEdicion=false → createVacante next → resetFormulario', () => {
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.habilidades.push(component.fb.control('hab-1'));
        component.idiomas.push(component.fb.control('id-1'));
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(of({}));

        component.publicarVacante();

        expect(perfilSpy.createVacante).toHaveBeenCalledWith(
            jasmine.objectContaining({ vacanteHabilidades: ['hab-1'], vacantesIdiomas: ['id-1'] })
        );
        expect(component.activeTab).toBe('list');
    });

    it('[C17] habilidades=["hab-1"], idiomas=["id-1"], modoEdicion=false → createVacante error → console.error', () => {
        sessionStorage.setItem('perfilId', 'empresa-uuid');
        fillVacanteForm(component);
        component.habilidades.push(component.fb.control('hab-1'));
        component.idiomas.push(component.fb.control('id-1'));
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(throwError(() => new Error('err')));

        component.publicarVacante();

        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('[CP-040] Registro exitoso — campos correctos y completos → createVacante ejecutado y resetFormulario', () => {
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

        component.publicarVacante();

        expect(perfilSpy.createVacante).toHaveBeenCalledWith(
            jasmine.objectContaining({
                titulo: 'Desarrollador Full Stack',
                salario: '5000000',
                ubicacion: 'Medellín',
                modalidad: 'Híbrido',
                tipo_trabajo: 'Full-time',
                empresa: 'empresa-uuid-cp040',
                vacanteHabilidades: ['hab-uuid-1'],
                vacantesIdiomas: ['idioma-uuid-1'],
            })
        );
        expect(consoleSpy).toHaveBeenCalledWith('Vacante guardada correctamente:', jasmine.anything());
        expect(component.modoEdicion).toBeFalse();
        expect(component.activeTab).toBe('list');
    });

    it('[CP-041] Campos vacíos — [BUG] sin validación de requeridos, createVacante es llamado igualmente', () => {
        sessionStorage.setItem('perfilId', 'empresa-uuid-cp041');
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(of({}));

        component.publicarVacante();

        expect(perfilSpy.createVacante).toHaveBeenCalledWith(
            jasmine.objectContaining({ titulo: '', ubicacion: '', salario: '' })
        );
    });

    it('[CP-042] Números y caracteres especiales en texto — [BUG] se envían sin validación de tipo', () => {
        sessionStorage.setItem('perfilId', 'empresa-uuid-cp042');
        fillVacanteForm(component, {
            titulo: '!@#$%^&*() 12345',
            ubicacion: '!!!@@@ 999',
            salario: '@@@@',
            modalidad: '!!!',
            tipo_trabajo: '999',
        });
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(of({}));

        component.publicarVacante();

        expect(perfilSpy.createVacante).toHaveBeenCalledWith(
            jasmine.objectContaining({ titulo: '!@#$%^&*() 12345', salario: '@@@@' })
        );
    });

    it('[CP-043a] Salario negativo — [BUG] se envía sin validación numérica', () => {
        sessionStorage.setItem('perfilId', 'empresa-uuid-cp043a');
        fillVacanteForm(component, { salario: '-500000' });
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(of({}));

        component.publicarVacante();

        expect(perfilSpy.createVacante).toHaveBeenCalledWith(
            jasmine.objectContaining({ salario: '-500000' })
        );
    });

    it('[CP-043b] Salario con caracteres especiales — [BUG] se envía sin validación', () => {
        sessionStorage.setItem('perfilId', 'empresa-uuid-cp043b');
        fillVacanteForm(component, { salario: '$$$###' });
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(of({}));

        component.publicarVacante();

        expect(perfilSpy.createVacante).toHaveBeenCalledWith(
            jasmine.objectContaining({ salario: '$$$###' })
        );
    });

    it('[CP-043c] Salario con texto — [BUG] se envía sin validación numérica', () => {
        sessionStorage.setItem('perfilId', 'empresa-uuid-cp043c');
        fillVacanteForm(component, { salario: 'mucho dinero' });
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(of({}));

        component.publicarVacante();

        expect(perfilSpy.createVacante).toHaveBeenCalledWith(
            jasmine.objectContaining({ salario: 'mucho dinero' })
        );
    });

    it('[CP-044a] Todos los campos completos excepto título — [BUG] createVacante llamado sin título', () => {
        sessionStorage.setItem('perfilId', 'empresa-uuid-cp044a');
        fillVacanteForm(component, { titulo: '' });
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(of({}));

        component.publicarVacante();

        expect(perfilSpy.createVacante).toHaveBeenCalledWith(
            jasmine.objectContaining({ titulo: '', salario: '3000000' })
        );
    });

    it('[CP-044b] Todos los campos completos excepto salario — [BUG] createVacante llamado sin salario', () => {
        sessionStorage.setItem('perfilId', 'empresa-uuid-cp044b');
        fillVacanteForm(component, { salario: '' });
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(of({}));

        component.publicarVacante();

        expect(perfilSpy.createVacante).toHaveBeenCalledWith(
            jasmine.objectContaining({ titulo: 'Desarrollador Angular', salario: '' })
        );
    });

    it('[CP-044c] Todos los campos completos excepto ubicacion — [BUG] createVacante llamado sin ubicacion', () => {
        sessionStorage.setItem('perfilId', 'empresa-uuid-cp044c');
        fillVacanteForm(component, { ubicacion: '' });
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(of({}));

        component.publicarVacante();

        expect(perfilSpy.createVacante).toHaveBeenCalledWith(
            jasmine.objectContaining({ ubicacion: '' })
        );
    });

    it('[CP-045a] Inyección XSS en título — [BUG] payload enviado sin sanitizar', () => {
        sessionStorage.setItem('perfilId', 'empresa-uuid-cp045a');
        const xssPayload = '<script>alert("xss")</script>';
        fillVacanteForm(component, { titulo: xssPayload });
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(of({}));

        component.publicarVacante();

        expect(perfilSpy.createVacante).toHaveBeenCalledWith(
            jasmine.objectContaining({ titulo: xssPayload })
        );
    });

    it('[CP-045b] Inyección SQL en título — [BUG] payload enviado sin sanitizar', () => {
        sessionStorage.setItem('perfilId', 'empresa-uuid-cp045b');
        const sqlPayload = "'; DROP TABLE vacantes; --";
        fillVacanteForm(component, { titulo: sqlPayload });
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(of({}));

        component.publicarVacante();

        expect(perfilSpy.createVacante).toHaveBeenCalledWith(
            jasmine.objectContaining({ titulo: sqlPayload })
        );
    });

    it('[CP-045c] Inyección en campo salario — [BUG] payload enviado sin sanitizar', () => {
        sessionStorage.setItem('perfilId', 'empresa-uuid-cp045c');
        const injPayload = '0; SELECT * FROM users';
        fillVacanteForm(component, { salario: injPayload });
        component.modoEdicion = false;
        perfilSpy.createVacante.and.returnValue(of({}));

        component.publicarVacante();

        expect(perfilSpy.createVacante).toHaveBeenCalledWith(
            jasmine.objectContaining({ salario: injPayload })
        );
    });
});

// =============================================================================
// HU — Editar Vacante | Frontend — editarVacante()
// Archivo: src/perfil-vacantes/perfil-vacantes/perfil-vacantes-editar.spec.ts
// =============================================================================

// ─── Datos de apoyo ──────────────────────────────────────────────────────────

function makeVacante(overrides: Partial<{
  id_vacante: string;
  titulo: string;
  salario: string;
  ubicacion: string;
  modalidad: string;
  tipo_trabajo: string;
  habilidades: string[];
  idiomas: string[];
}> = {}): any {
  return {
    id_vacante:   overrides.id_vacante   ?? 'v-uuid-1',
    titulo:       overrides.titulo       ?? 'Dev Angular',
    salario:      overrides.salario      ?? '3000000',
    ubicacion:    overrides.ubicacion    ?? 'Bogotá',
    modalidad:    overrides.modalidad    ?? 'Remoto',
    tipo_trabajo: overrides.tipo_trabajo ?? 'Full-time',
    habilidades:  overrides.habilidades  ?? [],
    idiomas:      overrides.idiomas      ?? [],
  };
}

// Catálogo fake con habilidades e idiomas conocidos
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

// ─────────────────────────────────────────────────────────────────────────────

describe('PerfilVacantes — editarVacante()', () => {
  let component: PerfilVacantes;
  let fixture: ComponentFixture<PerfilVacantes>;
  let perfilSpy: jasmine.SpyObj<Perfil>;
  let matchSpy: jasmine.SpyObj<Match>;

  beforeEach(async () => {
    perfilSpy = jasmine.createSpyObj<Perfil>('Perfil', [
      'createVacante', 'updateVacante', 'getHabilidades',
      'getIdiomas', 'getCatalogosPostulante',
    ]);
    matchSpy = jasmine.createSpyObj<Match>('Match', ['getVacantesForEmpresa']);

    // Defaults seguros
    matchSpy.getVacantesForEmpresa.and.returnValue(of([]));
    perfilSpy.getCatalogosPostulante.and.returnValue(of(CATALOGO_MOCK) as any);

    await TestBed.configureTestingModule({
      imports: [PerfilVacantes, ReactiveFormsModule, HttpClientTestingModule],
      providers: [
        FormBuilder,
        { provide: Perfil, useValue: perfilSpy },
        { provide: Match,  useValue: matchSpy  },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(PerfilVacantes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => sessionStorage.clear());

  // ===========================================================================
  // CAJA BLANCA — caminos del diagrama de flujo
  // ===========================================================================

  // Camino: 1,2,3,4,5,6,7,8,9,10,11,12,9,13,14,15,16,13,F
  // v con habilidades e idiomas válidos → push en ambos FormArrays
  it('[C1] Camino ...12,9,13,14,15,16,13,F — habilidades e idiomas válidos → push en ambos FormArrays', () => {
    const v = makeVacante({ habilidades: ['Angular'], idiomas: ['Español'] });

    component.editarVacante(v);

    expect(component.modoEdicion).toBeTrue();
    expect(component.vacanteEditandoId).toBe('v-uuid-1');
    expect(component.habilidades.length).toBe(1);
    expect(component.habilidades.at(0).value).toBe('hab-1');
    expect(component.idiomas.length).toBe(1);
    expect(component.idiomas.at(0).value).toBe('id-1');
  });

  // Camino: 1,2,3,4,5,6,7,8,9,10,11,12,9,13,14,15,13,F
  // Habilidades encontradas, idiomas cargados pero nombre no coincide → no push idioma
  it('[C2] Camino ...15,13,F — habilidades válidas, idioma no encontrado → solo push habilidad', () => {
    const v = makeVacante({ habilidades: ['Angular'], idiomas: ['Klingon'] });

    component.editarVacante(v);

    expect(component.habilidades.length).toBe(1);
    expect(component.habilidades.at(0).value).toBe('hab-1');
    expect(component.idiomas.length).toBe(0);   // no encontrado → no push
  });

  // Camino: 1,2,3,4,5,6,7,8,9,10,11,9,13,14,15,16,13,F
  // Habilidad no encontrada en catálogo, idioma válido → solo push idioma
  it('[C3] Camino ...11,9,13,14,15,16,13,F — habilidad no encontrada, idioma válido → solo push idioma', () => {
    const v = makeVacante({ habilidades: ['Cobol'], idiomas: ['Español'] });

    component.editarVacante(v);

    expect(component.habilidades.length).toBe(0);  // no encontrada → no push
    expect(component.idiomas.length).toBe(1);
    expect(component.idiomas.at(0).value).toBe('id-1');
  });

  // Camino: 1,2,3,4,5,6,7,8,9,10,11,9,13,14,15,13,F
  // Habilidad no encontrada, idioma no encontrado → no push en ninguno
  it('[C4] Camino ...11,9,13,14,15,13,F — ni habilidad ni idioma encontrados → FormArrays vacíos', () => {
    const v = makeVacante({ habilidades: ['Cobol'], idiomas: ['Klingon'] });

    component.editarVacante(v);

    expect(component.habilidades.length).toBe(0);
    expect(component.idiomas.length).toBe(0);
  });

  // Camino: 1,2,3,4,5,6,7,8,9,13,14,15,16,13,F
  // Habilidades vacías, idioma válido → solo push idioma
  it('[C5] Camino ...9,13,14,15,16,13,F — habilidades vacías, idioma válido → solo push idioma', () => {
    const v = makeVacante({ habilidades: [], idiomas: ['Español'] });

    component.editarVacante(v);

    expect(component.habilidades.length).toBe(0);
    expect(component.idiomas.length).toBe(1);
    expect(component.idiomas.at(0).value).toBe('id-1');
  });

  // Camino: 1,2,3,4,5,6,7,8,9,13,14,15,13,F
  // Habilidades vacías, idioma no encontrado → no push en ninguno
  it('[C6] Camino ...9,13,14,15,13,F — habilidades vacías, idioma no encontrado → FormArrays vacíos', () => {
    const v = makeVacante({ habilidades: [], idiomas: ['Klingon'] });

    component.editarVacante(v);

    expect(component.habilidades.length).toBe(0);
    expect(component.idiomas.length).toBe(0);
  });

  // Camino: 1,2,3,4,5,6,7,8,9,10,11,12,9,13,F
  // Habilidades válidas, idiomas vacíos → solo push habilidad
  it('[C7] Camino ...12,9,13,F — habilidad válida, idiomas vacíos → solo push habilidad', () => {
    const v = makeVacante({ habilidades: ['Angular'], idiomas: [] });

    component.editarVacante(v);

    expect(component.habilidades.length).toBe(1);
    expect(component.habilidades.at(0).value).toBe('hab-1');
    expect(component.idiomas.length).toBe(0);
  });

  // Camino: 1,2,3,4,5,6,7,8,9,10,11,9,13,F
  // Habilidad no encontrada, idiomas vacíos → FormArrays vacíos
  it('[C8] Camino ...11,9,13,F — habilidad no encontrada, idiomas vacíos → FormArrays vacíos', () => {
    const v = makeVacante({ habilidades: ['Cobol'], idiomas: [] });

    component.editarVacante(v);

    expect(component.habilidades.length).toBe(0);
    expect(component.idiomas.length).toBe(0);
  });

  // Camino: 1,2,3,4,5,6,7,8,9,13,F
  // Habilidades vacías, idiomas vacíos → no push en ninguno
  it('[C9] Camino ...9,13,F — habilidades e idiomas vacíos → FormArrays vacíos', () => {
    const v = makeVacante({ habilidades: [], idiomas: [] });

    component.editarVacante(v);

    expect(component.habilidades.length).toBe(0);
    expect(component.idiomas.length).toBe(0);
  });
});
