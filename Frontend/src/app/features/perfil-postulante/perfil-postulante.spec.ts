import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PerfilPostulante } from './perfil-postulante';
import { Perfil } from '../../shared/services/perfil';
import { Alerts } from '../../shared/services/alerts';

const CATALOGOS = {
  niveles: ['Pregrado'],
  habilidades: [{ id_habilidad: 'habilidad_1', nombre_habilidad: 'Angular' }],
  idiomas: [{ id_idioma: 'Español', nombre: 'Español' }]
};

const ESTUDIO_DATA = {
  postulanteEstudios: [
    { estudio: { titulo: 'Ing. Sistemas', nivel: 'Pregrado' }, certificado: 'cert1.pdf' }
  ]
};

const HABILIDAD_DATA = {
  postulanteHabilidades: [
    { habilidades: { id_habilidad: 'habilidad_1' }, certificado: 'h1.pdf' }
  ]
};

const IDIOMA_DATA = {
  postulanteIdiomas: [
    { idioma: { id_idioma: 'Español' }, certificado: 'i1.pdf' }
  ]
};

function buildPerfilSpy(): jasmine.SpyObj<Perfil> {
  const spy = jasmine.createSpyObj<Perfil>('Perfil', [
    'getUserNamePostulante', 'getPerfilCompleto',
    'getCatalogosPostulante', 'guardarPerfilPostulante'
  ]);
  spy.getCatalogosPostulante.and.returnValue(of(CATALOGOS));
  spy.getUserNamePostulante.and.returnValue(of({ name: 'Juan', lastname: 'Perez' }));
  spy.getPerfilCompleto.and.returnValue(of(null) as any);
  return spy;
}

describe('PerfilPostulante — ngOnInit()', () => {
  let component: PerfilPostulante;
  let fixture: ComponentFixture<PerfilPostulante>;
  let perfilSpy: jasmine.SpyObj<Perfil>;
  let alertsSpy: jasmine.SpyObj<Alerts>;

  beforeEach(async () => {
    perfilSpy = buildPerfilSpy();
    alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['error', 'success', 'info']);

    await TestBed.configureTestingModule({
      imports: [PerfilPostulante],
      providers: [
        provideRouter([]),
        { provide: Perfil,  useValue: perfilSpy },
        { provide: Alerts,  useValue: alertsSpy },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(PerfilPostulante);
    component = fixture.componentInstance;
  });

  afterEach(() => sessionStorage.clear());

  it('[C-001] sin perfilId -> no llama getUserName ni getPerfilCompleto', () => {
    sessionStorage.removeItem('perfilId');
    fixture.detectChanges();
    expect(perfilSpy.getCatalogosPostulante).toHaveBeenCalledTimes(1);
    expect(perfilSpy.getUserNamePostulante).not.toHaveBeenCalled();
    expect(perfilSpy.getPerfilCompleto).not.toHaveBeenCalled();
    expect(component.postulanteForm).toBeTruthy();
  });

  it('[C-002] getPerfilCompleto retorna null -> no modifica FormArrays', () => {
    sessionStorage.setItem('perfilId', '1');
    perfilSpy.getPerfilCompleto.and.returnValue(of(null) as any);
    fixture.detectChanges();
    expect(component.estudiosForm.length).toBe(1);
    expect(component.postulanteForm.get('experiencia')?.value).toBe('');
  });

  it('[C-003] perfil básico sin arrays -> patchValue experiencia y cv', () => {
    sessionStorage.setItem('perfilId', '1');
    perfilSpy.getPerfilCompleto.and.returnValue(of({
      años_experiencia: '3', curriculum: 'cv.pdf',
      postulanteEstudios: [], postulanteHabilidades: [], postulanteIdiomas: []
    }));
    fixture.detectChanges();
    expect(component.postulanteForm.get('experiencia')?.value).toBe('3');
    expect(component.postulanteForm.get('cv')?.value).toBe('cv.pdf');
    expect(component.estudiosForm.length).toBe(1);
  });

  it('[C-004] solo estudios -> estudiosForm poblado correctamente', () => {
    sessionStorage.setItem('perfilId', '1');
    perfilSpy.getPerfilCompleto.and.returnValue(of({
      años_experiencia: '2', curriculum: 'cv.pdf',
      ...ESTUDIO_DATA, postulanteHabilidades: [], postulanteIdiomas: []
    }));
    fixture.detectChanges();
    expect(component.estudiosForm.length).toBe(1);
    expect(component.estudiosForm.at(0).get('titulo')?.value).toBe('Ing. Sistemas');
    expect(component.estudiosForm.at(0).get('nivel')?.value).toBe('Pregrado');
  });

  it('[C-005] solo habilidades -> habilidadesForm poblado correctamente', () => {
    sessionStorage.setItem('perfilId', '1');
    perfilSpy.getPerfilCompleto.and.returnValue(of({
      años_experiencia: '1', curriculum: 'cv.pdf',
      postulanteEstudios: [], ...HABILIDAD_DATA, postulanteIdiomas: []
    }));
    fixture.detectChanges();
    expect(component.habilidadesForm.length).toBe(1);
    expect(component.habilidadesForm.at(0).get('nombre')?.value).toBe('habilidad_1');
  });

  it('[C-006] solo idiomas -> idiomasForm poblado correctamente', () => {
    sessionStorage.setItem('perfilId', '1');
    perfilSpy.getPerfilCompleto.and.returnValue(of({
      años_experiencia: '1', curriculum: 'cv.pdf',
      postulanteEstudios: [], postulanteHabilidades: [], ...IDIOMA_DATA
    }));
    fixture.detectChanges();
    expect(component.idiomasForm.length).toBe(1);
    expect(component.idiomasForm.at(0).get('nombre')?.value).toBe('Español');
  });

  it('[C-007] perfil completo -> los tres FormArray poblados', () => {
    sessionStorage.setItem('perfilId', '1');
    perfilSpy.getPerfilCompleto.and.returnValue(of({
      años_experiencia: '5', curriculum: 'cv.pdf',
      ...ESTUDIO_DATA, ...HABILIDAD_DATA, ...IDIOMA_DATA
    }));
    fixture.detectChanges();
    expect(component.estudiosForm.length).toBe(1);
    expect(component.habilidadesForm.length).toBe(1);
    expect(component.idiomasForm.length).toBe(1);
    expect(component.postulanteForm.get('experiencia')?.value).toBe('5');
  });

  it('[C-008] getUserNamePostulante falla -> console.error con mensaje correcto', () => {
    sessionStorage.setItem('perfilId', '1');
    perfilSpy.getUserNamePostulante.and.returnValue(throwError(() => new Error('500')));
    spyOn(console, 'error');
    fixture.detectChanges();
    expect(console.error).toHaveBeenCalledWith('Error al obtener nombre:', jasmine.any(Error));
  });

  // it('[C-009] getPerfilCompleto falla -> console.error con mensaje correcto', () => {
  //   sessionStorage.setItem('perfilId', '1');
  //   perfilSpy.getPerfilCompleto.and.returnValue(throwError(() => new Error('500')));
  //   spyOn(console, 'error');
  //   fixture.detectChanges();
  //   expect(console.error).toHaveBeenCalledWith('Error al cargar perfil:', jasmine.any(Error));
  // });

  it('[C-010] agregarEstudio -> no supera el máximo de 5 elementos', () => {
    fixture.detectChanges();
    for (let i = 0; i < 6; i++) component.agregarEstudio();
    expect(component.estudiosForm.length).toBe(5);
  });

  it('[C-011] eliminarEstudio -> no elimina si solo hay 1 elemento', () => {
    fixture.detectChanges();
    component.eliminarEstudio(0);
    expect(component.estudiosForm.length).toBe(1);
  });

  it('[C-012] eliminarEstudio -> elimina correctamente si hay más de 1', () => {
    fixture.detectChanges();
    component.agregarEstudio();
    component.eliminarEstudio(1);
    expect(component.estudiosForm.length).toBe(1);
  });

  it('[C-013] agregarHabilidad / eliminarHabilidad -> agrega y elimina correctamente', () => {
    fixture.detectChanges();
    component.agregarHabilidad();
    expect(component.habilidadesForm.length).toBe(2);
    component.eliminarHabilidad(1);
    expect(component.habilidadesForm.length).toBe(1);
  });

  it('[C-014] agregarIdioma / eliminarIdioma -> agrega y elimina correctamente', () => {
    fixture.detectChanges();
    component.agregarIdioma();
    expect(component.idiomasForm.length).toBe(2);
    component.eliminarIdioma(1);
    expect(component.idiomasForm.length).toBe(1);
  });

  it('[C-015] onCvChange con archivo -> setea cvFile y actualiza form', () => {
    fixture.detectChanges();
    const file = new File([''], 'mi-cv.pdf');
    component.onCvChange({ target: { files: [file] } });
    expect(component.cvFile).toBe(file);
    expect(component.postulanteForm.get('cv')?.value).toBe('mi-cv.pdf');
  });

  it('[C-016] onCvChange sin archivo -> no modifica cvFile', () => {
    fixture.detectChanges();
    component.onCvChange({ target: { files: [] } });
    expect(component.cvFile).toBeNull();
  });

  it('[C-017] onCertificadoEstudioChange -> guarda en mapa y actualiza control', () => {
    fixture.detectChanges();
    const file = new File([''], 'cert.pdf');
    component.onCertificadoEstudioChange({ target: { files: [file] } }, 0);
    expect(component.certificadosEstudios.get(0)).toBe(file);
    expect(component.estudiosForm.at(0).get('certificado')?.value).toBe('cert.pdf');
  });

  it('[C-018] onCertificadoHabilidadChange -> guarda archivo en mapa', () => {
    fixture.detectChanges();
    const file = new File([''], 'hab.pdf');
    component.onCertificadoHabilidadChange({ target: { files: [file] } }, 0);
    expect(component.certificadosHabilidades.get(0)).toBe(file);
  });

  it('[C-019] onCertificadoIdiomaChange -> guarda archivo en mapa', () => {
    fixture.detectChanges();
    const file = new File([''], 'idioma.pdf');
    component.onCertificadoIdiomaChange({ target: { files: [file] } }, 0);
    expect(component.certificadosIdiomas.get(0)).toBe(file);
  });

  it('[C-025] catalogos sin niveles/habilidades/idiomas -> arrays quedan vacíos', () => {
    perfilSpy.getCatalogosPostulante.and.returnValue(of({}));
    fixture.detectChanges();
    expect(component.catalogoEstudios).toEqual([]);
    expect(component.catalogoHabilidades).toEqual([]);
    expect(component.catalogoIdiomas).toEqual([]);
  });

  it('[C-026] mapearDato estudios con estudio definido -> usa valores reales', () => {
    sessionStorage.setItem('perfilId', '1');
    perfilSpy.getPerfilCompleto.and.returnValue(of({
      años_experiencia: '2', curriculum: 'cv.pdf',
      postulanteEstudios: [
        { estudio: { titulo: 'Medicina', nivel: 'Posgrado' }, certificado: 'med.pdf' }
      ],
      postulanteHabilidades: [], postulanteIdiomas: []
    }));
    fixture.detectChanges();
    expect(component.estudiosForm.at(0).get('titulo')?.value).toBe('Medicina');
    expect(component.estudiosForm.at(0).get('nivel')?.value).toBe('Posgrado');
    expect(component.estudiosForm.at(0).get('certificado')?.value).toBe('med.pdf');
  });

  it('[C-027] mapearDato habilidades con habilidad definida -> usa id_habilidad real', () => {
    sessionStorage.setItem('perfilId', '1');
    perfilSpy.getPerfilCompleto.and.returnValue(of({
      años_experiencia: '1', curriculum: 'cv.pdf',
      postulanteEstudios: [],
      postulanteHabilidades: [
        { habilidades: { id_habilidad: 'react' }, certificado: 'react.pdf' }
      ],
      postulanteIdiomas: []
    }));
    fixture.detectChanges();
    expect(component.habilidadesForm.at(0).get('nombre')?.value).toBe('react');
    expect(component.habilidadesForm.at(0).get('certificado')?.value).toBe('react.pdf');
  });

  it('[C-028] mapearDato idiomas con idioma definido -> usa id_idioma real', () => {
    sessionStorage.setItem('perfilId', '1');
    perfilSpy.getPerfilCompleto.and.returnValue(of({
      años_experiencia: '1', curriculum: 'cv.pdf',
      postulanteEstudios: [], postulanteHabilidades: [],
      postulanteIdiomas: [
        { idioma: { id_idioma: 'Inglés' }, certificado: 'eng.pdf' }
      ]
    }));
    fixture.detectChanges();
    expect(component.idiomasForm.at(0).get('nombre')?.value).toBe('Inglés');
    expect(component.idiomasForm.at(0).get('certificado')?.value).toBe('eng.pdf');
  });

  it('[C-029] cargarSeccion con múltiples estudios -> FormArray tiene todos los items', () => {
    sessionStorage.setItem('perfilId', '1');
    perfilSpy.getPerfilCompleto.and.returnValue(of({
      años_experiencia: '3', curriculum: 'cv.pdf',
      postulanteEstudios: [
        { estudio: { titulo: 'Ing. Sistemas', nivel: 'Pregrado' }, certificado: 'c1.pdf' },
        { estudio: { titulo: 'Medicina', nivel: 'Posgrado' }, certificado: 'c2.pdf' }
      ],
      postulanteHabilidades: [], postulanteIdiomas: []
    }));
    fixture.detectChanges();
    expect(component.estudiosForm.length).toBe(2);
    expect(component.estudiosForm.at(1).get('titulo')?.value).toBe('Medicina');
  });

  it('[C-030] postulanteEstudios null -> no puebla formArray', () => {
    sessionStorage.setItem('perfilId', '1');
    perfilSpy.getPerfilCompleto.and.returnValue(of({
      años_experiencia: '1', curriculum: 'cv.pdf',
      postulanteEstudios: null,
      postulanteHabilidades: [], postulanteIdiomas: []
    }));
    fixture.detectChanges();
    expect(component.estudiosForm.length).toBe(1);
  });
});

describe('PerfilPostulante — OnPostulante()', () => {
  let component: PerfilPostulante;
  let fixture: ComponentFixture<PerfilPostulante>;
  let perfilSpy: jasmine.SpyObj<Perfil>;
  let alertsSpy: jasmine.SpyObj<Alerts>;
  let router: Router;

  beforeEach(async () => {
    perfilSpy = buildPerfilSpy();
    alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['error', 'success', 'info']);

    await TestBed.configureTestingModule({
      imports: [PerfilPostulante],
      providers: [
        provideRouter([]),
        { provide: Perfil,  useValue: perfilSpy },
        { provide: Alerts,  useValue: alertsSpy },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(PerfilPostulante);
    component = fixture.componentInstance;
    router    = TestBed.inject(Router);
    spyOn(router, 'navigate');
    sessionStorage.removeItem('perfilId');
    fixture.detectChanges();
  });

  afterEach(() => sessionStorage.clear());

  function llenarFormularioValido() {
    component.postulanteForm.patchValue({ experiencia: '3', cv: 'cv.pdf' });
    component.estudiosForm.at(0).patchValue({ titulo: 'Ing', nivel: 'Pregrado' });
    component.habilidadesForm.at(0).patchValue({ nombre: 'Angular' });
    component.idiomasForm.at(0).patchValue({ nombre: 'Inglés' });
  }

  it('[C-001] formulario inválido -> alert.error("Campos incorrectos")', () => {
    component.postulanteForm.patchValue({ experiencia: '' });
    component.OnPostulante();
    expect(alertsSpy.error).toHaveBeenCalledWith('Campos incorrectos');
    expect(perfilSpy.guardarPerfilPostulante).not.toHaveBeenCalled();
  });

  it('[C-002] sin cv -> alert.error("Debe cargar su currículum")', () => {
    llenarFormularioValido();
    component.postulanteForm.patchValue({ cv: '' });
    component.cvFile = null;
    component.OnPostulante();
    expect(alertsSpy.error).toHaveBeenCalledWith('Debe cargar su currículum');
    expect(perfilSpy.guardarPerfilPostulante).not.toHaveBeenCalled();
  });

  it('[C-003] form válido + cvFile -> alert.success + navigate("/match")', () => {
    llenarFormularioValido();
    component.cvFile       = new File([''], 'cv.pdf', { type: 'application/pdf' });
    component.idPostulante = 'post-1';
    perfilSpy.guardarPerfilPostulante.and.returnValue(of({ success: true }));
    component.OnPostulante();
    expect(alertsSpy.success).toHaveBeenCalledWith('Perfil guardado exitosamente');
    expect(router.navigate).toHaveBeenCalledWith(['/match']);
  });

  it('[C-004] form válido + cv solo en form (sin cvFile) -> usa cv del form', () => {
    llenarFormularioValido();
    component.cvFile       = null;
    component.idPostulante = 'post-1';
    perfilSpy.guardarPerfilPostulante.and.returnValue(of({ success: true }));
    component.OnPostulante();
    expect(perfilSpy.guardarPerfilPostulante).toHaveBeenCalledWith(
      'post-1', jasmine.objectContaining({ cv: 'cv.pdf' })
    );
  });

  it('[C-005] backend falla -> alert.error("Error al guardar el perfil")', () => {
    llenarFormularioValido();
    component.cvFile       = new File([''], 'cv.pdf');
    component.idPostulante = 'post-1';
    perfilSpy.guardarPerfilPostulante.and.returnValue(throwError(() => new Error('500')));
    component.OnPostulante();
    expect(alertsSpy.error).toHaveBeenCalledWith('Error al guardar el perfil');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('[C-006] certificado estudio en mapa -> se incluye en datosFormulario', () => {
    llenarFormularioValido();
    component.cvFile       = new File([''], 'cv.pdf');
    component.idPostulante = 'post-1';
    component.certificadosEstudios.set(0, new File([''], 'cert-estudio.pdf'));
    perfilSpy.guardarPerfilPostulante.and.returnValue(of({}));
    component.OnPostulante();
    expect(perfilSpy.guardarPerfilPostulante).toHaveBeenCalledWith(
      'post-1',
      jasmine.objectContaining({
        estudios: jasmine.arrayContaining([
          jasmine.objectContaining({ certificado: 'cert-estudio.pdf' })
        ])
      })
    );
  });

  it('[C-007] certificado habilidad en mapa -> se incluye en datosFormulario', () => {
    llenarFormularioValido();
    component.cvFile       = new File([''], 'cv.pdf');
    component.idPostulante = 'post-1';
    component.certificadosHabilidades.set(0, new File([''], 'cert-hab.pdf'));
    perfilSpy.guardarPerfilPostulante.and.returnValue(of({}));
    component.OnPostulante();
    expect(perfilSpy.guardarPerfilPostulante).toHaveBeenCalledWith(
      'post-1',
      jasmine.objectContaining({
        habilidades: jasmine.arrayContaining([
          jasmine.objectContaining({ certificado: 'cert-hab.pdf' })
        ])
      })
    );
  });

  it('[C-008] certificado idioma en mapa -> se incluye en datosFormulario', () => {
    llenarFormularioValido();
    component.cvFile       = new File([''], 'cv.pdf');
    component.idPostulante = 'post-1';
    component.certificadosIdiomas.set(0, new File([''], 'cert-idioma.pdf'));
    perfilSpy.guardarPerfilPostulante.and.returnValue(of({}));
    component.OnPostulante();
    expect(perfilSpy.guardarPerfilPostulante).toHaveBeenCalledWith(
      'post-1',
      jasmine.objectContaining({
        idiomas: jasmine.arrayContaining([
          jasmine.objectContaining({ certificado: 'cert-idioma.pdf' })
        ])
      })
    );
  });

  // it('[C-009] sin certificado en mapa ni en form -> certificado es null', () => {
  //   llenarFormularioValido();
  //   component.estudiosForm.at(0).patchValue({ certificado: '' });
  //   component.habilidadesForm.at(0).patchValue({ certificado: '' });
  //   component.idiomasForm.at(0).patchValue({ certificado: '' });
  //   component.cvFile       = new File([''], 'cv.pdf');
  //   component.idPostulante = 'post-1';
  //   perfilSpy.guardarPerfilPostulante.and.returnValue(of({}));
  //   component.OnPostulante();
  //   expect(perfilSpy.guardarPerfilPostulante).toHaveBeenCalledWith(
  //     'post-1',
  //     jasmine.objectContaining({
  //       estudios: jasmine.arrayContaining([
  //         jasmine.objectContaining({ certificado: null })
  //       ])
  //     })
  //   );
  // });

  it('[C-010] certificado existente en form (sin mapa) -> usa valor del form', () => {
    llenarFormularioValido();
    component.estudiosForm.at(0).patchValue({ certificado: 'existente.pdf' });
    component.cvFile       = new File([''], 'cv.pdf');
    component.idPostulante = 'post-1';
    perfilSpy.guardarPerfilPostulante.and.returnValue(of({}));
    component.OnPostulante();
    expect(perfilSpy.guardarPerfilPostulante).toHaveBeenCalledWith(
      'post-1',
      jasmine.objectContaining({
        estudios: jasmine.arrayContaining([
          jasmine.objectContaining({ certificado: 'existente.pdf' })
        ])
      })
    );
  });

  it('[C-020] cargarCatalogos falla -> isLoading queda en false', () => {
    perfilSpy.getCatalogosPostulante.and.returnValue(throwError(() => new Error('500')));
    fixture.detectChanges();
    expect(component.isLoading).toBeFalse();
  });

  it('[C-021] mapearDato estudios con valores null -> usa string vacío', () => {
    sessionStorage.setItem('perfilId', '1');
    perfilSpy.getPerfilCompleto.and.returnValue(of({
      años_experiencia: null, curriculum: null,
      postulanteEstudios: [{ estudio: null, certificado: null }],
      postulanteHabilidades: [], postulanteIdiomas: []
    }));
    fixture.detectChanges();
    expect(component.estudiosForm.at(0).get('titulo')?.value).toBe('');
    expect(component.estudiosForm.at(0).get('nivel')?.value).toBe('');
    expect(component.estudiosForm.at(0).get('certificado')?.value).toBe('');
  });

  it('[C-022] mapearDato habilidades con valores null -> usa string vacío', () => {
    sessionStorage.setItem('perfilId', '1');
    perfilSpy.getPerfilCompleto.and.returnValue(of({
      años_experiencia: null, curriculum: null,
      postulanteEstudios: [],
      postulanteHabilidades: [{ habilidades: null, certificado: null }],
      postulanteIdiomas: []
    }));
    fixture.detectChanges();
    expect(component.habilidadesForm.at(0).get('nombre')?.value).toBe('');
    expect(component.habilidadesForm.at(0).get('certificado')?.value).toBe('');
  });

  it('[C-023] mapearDato idiomas con valores null -> usa string vacío', () => {
    sessionStorage.setItem('perfilId', '1');
    perfilSpy.getPerfilCompleto.and.returnValue(of({
      años_experiencia: null, curriculum: null,
      postulanteEstudios: [], postulanteHabilidades: [],
      postulanteIdiomas: [{ idioma: null, certificado: null }]
    }));
    fixture.detectChanges();
    expect(component.idiomasForm.at(0).get('nombre')?.value).toBe('');
    expect(component.idiomasForm.at(0).get('certificado')?.value).toBe('');
  });

  it('[C-024] patchValue con años_experiencia y curriculum null -> usa string vacío', () => {
    sessionStorage.setItem('perfilId', '1');
    perfilSpy.getPerfilCompleto.and.returnValue(of({
      años_experiencia: null, curriculum: null,
      postulanteEstudios: [], postulanteHabilidades: [], postulanteIdiomas: []
    }));
    fixture.detectChanges();
    expect(component.postulanteForm.get('experiencia')?.value).toBe('');
    expect(component.postulanteForm.get('cv')?.value).toBe('');
  });
});

describe('PerfilPostulante — Condition Coverage adicional', () => {
  let component: PerfilPostulante;
  let fixture: ComponentFixture<PerfilPostulante>;
  let perfilSpy: jasmine.SpyObj<Perfil>;
  let alertsSpy: jasmine.SpyObj<Alerts>;

  beforeEach(async () => {
    perfilSpy = buildPerfilSpy();
    alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['error', 'success', 'info']);

    await TestBed.configureTestingModule({
      imports: [PerfilPostulante],
      providers: [
        provideRouter([]),
        { provide: Perfil, useValue: perfilSpy },
        { provide: Alerts, useValue: alertsSpy },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(PerfilPostulante);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => sessionStorage.clear());

  it('[CC-001] onCvChange con files vacío -> cvFile permanece null', () => {
    component.onCvChange({ target: { files: [] } });
    expect(component.cvFile).toBeNull();
  });

  it('[CC-003] onCertificadoEstudioChange sin archivo -> no modifica mapa', () => {
    component.onCertificadoEstudioChange({ target: { files: [] } }, 0);
    expect(component.certificadosEstudios.has(0)).toBeFalse();
  });

  it('[CC-004] onCertificadoHabilidadChange sin archivo -> no modifica mapa', () => {
    component.onCertificadoHabilidadChange({ target: { files: [] } }, 0);
    expect(component.certificadosHabilidades.has(0)).toBeFalse();
  });

  it('[CC-005] onCertificadoIdiomaChange sin archivo -> no modifica mapa', () => {
    component.onCertificadoIdiomaChange({ target: { files: [] } }, 0);
    expect(component.certificadosIdiomas.has(0)).toBeFalse();
  });

  it('[CC-006] agregarEstudio exactamente en 5 -> no agrega el sexto', () => {
    for (let i = 0; i < 4; i++) component.agregarEstudio();
    expect(component.estudiosForm.length).toBe(5);
    component.agregarEstudio();
    expect(component.estudiosForm.length).toBe(5);
  });

  it('[CC-007] agregarHabilidad hasta 5 -> no supera el máximo', () => {
    for (let i = 0; i < 5; i++) component.agregarHabilidad();
    expect(component.habilidadesForm.length).toBe(5);
    component.agregarHabilidad();
    expect(component.habilidadesForm.length).toBe(5);
  });

  it('[CC-008] agregarIdioma hasta 5 -> no supera el máximo', () => {
    for (let i = 0; i < 5; i++) component.agregarIdioma();
    expect(component.idiomasForm.length).toBe(5);
    component.agregarIdioma();
    expect(component.idiomasForm.length).toBe(5);
  });

  it('[CC-009] eliminarHabilidad con solo 1 elemento -> no elimina', () => {
    expect(component.habilidadesForm.length).toBe(1);
    component.eliminarHabilidad(0);
    expect(component.habilidadesForm.length).toBe(1);
  });

  it('[CC-010] eliminarIdioma con solo 1 elemento -> no elimina', () => {
    expect(component.idiomasForm.length).toBe(1);
    component.eliminarIdioma(0);
    expect(component.idiomasForm.length).toBe(1);
  });

  it('[CC-011] cargarSeccion con array vacío -> FormArray conserva grupo inicial', () => {
    sessionStorage.setItem('perfilId', '1');
    perfilSpy.getPerfilCompleto.and.returnValue(of({
      años_experiencia: '1', curriculum: 'cv.pdf',
      postulanteEstudios: [], postulanteHabilidades: [], postulanteIdiomas: []
    }));
    fixture.detectChanges();
    expect(component.estudiosForm.length).toBe(1);
  });

  it('[CC-012] OnPostulante con cvFile null y cv vacío -> alert error curriculum', () => {
    component.postulanteForm.patchValue({ experiencia: '2', cv: '' });
    component.estudiosForm.at(0).patchValue({ titulo: 'Ing', nivel: 'Pregrado' });
    component.habilidadesForm.at(0).patchValue({ nombre: 'Angular' });
    component.idiomasForm.at(0).patchValue({ nombre: 'Inglés' });
    component.cvFile = null;
    component.OnPostulante();
    expect(alertsSpy.error).toHaveBeenCalledWith('Debe cargar su currículum');
  });

  it('[CC-015] estudios certificado en form (no en mapa) -> usa valor del form', () => {
    component.postulanteForm.patchValue({ experiencia: '2', cv: 'cv.pdf' });
    component.estudiosForm.at(0).patchValue({ titulo: 'Ing', nivel: 'Pregrado', certificado: 'form-cert.pdf' });
    component.habilidadesForm.at(0).patchValue({ nombre: 'Angular', certificado: '' });
    component.idiomasForm.at(0).patchValue({ nombre: 'Inglés', certificado: '' });
    component.cvFile       = new File([''], 'cv.pdf');
    component.idPostulante = 'post-1';
    perfilSpy.guardarPerfilPostulante.and.returnValue(of({}));
    component.OnPostulante();
    expect(perfilSpy.guardarPerfilPostulante).toHaveBeenCalledWith(
      'post-1',
      jasmine.objectContaining({
        estudios: jasmine.arrayContaining([
          jasmine.objectContaining({ certificado: 'form-cert.pdf' })
        ])
      })
    );
  });

  it('[CC-016] habilidades certificado en form (no en mapa) -> usa valor del form', () => {
    component.postulanteForm.patchValue({ experiencia: '2', cv: 'cv.pdf' });
    component.estudiosForm.at(0).patchValue({ titulo: 'Ing', nivel: 'Pregrado', certificado: '' });
    component.habilidadesForm.at(0).patchValue({ nombre: 'Angular', certificado: 'hab-cert.pdf' });
    component.idiomasForm.at(0).patchValue({ nombre: 'Inglés', certificado: '' });
    component.cvFile       = new File([''], 'cv.pdf');
    component.idPostulante = 'post-1';
    perfilSpy.guardarPerfilPostulante.and.returnValue(of({}));
    component.OnPostulante();
    expect(perfilSpy.guardarPerfilPostulante).toHaveBeenCalledWith(
      'post-1',
      jasmine.objectContaining({
        habilidades: jasmine.arrayContaining([
          jasmine.objectContaining({ certificado: 'hab-cert.pdf' })
        ])
      })
    );
  });

  it('[CC-017] idiomas certificado en form (no en mapa) -> usa valor del form', () => {
    component.postulanteForm.patchValue({ experiencia: '2', cv: 'cv.pdf' });
    component.estudiosForm.at(0).patchValue({ titulo: 'Ing', nivel: 'Pregrado', certificado: '' });
    component.habilidadesForm.at(0).patchValue({ nombre: 'Angular', certificado: '' });
    component.idiomasForm.at(0).patchValue({ nombre: 'Inglés', certificado: 'idioma-cert.pdf' });
    component.cvFile       = new File([''], 'cv.pdf');
    component.idPostulante = 'post-1';
    perfilSpy.guardarPerfilPostulante.and.returnValue(of({}));
    component.OnPostulante();
    expect(perfilSpy.guardarPerfilPostulante).toHaveBeenCalledWith(
      'post-1',
      jasmine.objectContaining({
        idiomas: jasmine.arrayContaining([
          jasmine.objectContaining({ certificado: 'idioma-cert.pdf' })
        ])
      })
    );
  });
});