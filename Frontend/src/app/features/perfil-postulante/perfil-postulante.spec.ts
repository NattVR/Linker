import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PerfilPostulante } from './perfil-postulante';
import { Perfil } from '../../shared/services/perfil';
import { Alerts } from '../../shared/services/alerts';

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

const CATALOGOS = { niveles: ['Pregrado'], habilidades: ['Angular'], idiomas: ['Inglés'] };

describe('PerfilPostulante — ngOnInit()', () => {
  let component: PerfilPostulante;
  let fixture: ComponentFixture<PerfilPostulante>;
  let perfilSpy: jasmine.SpyObj<Perfil>;
  let alertsSpy: jasmine.SpyObj<Alerts>;

  beforeEach(async () => {
    perfilSpy  = jasmine.createSpyObj<Perfil>('Perfil', [
      'getUserNamePostulante', 'getPerfilCompleto', 'getCatalogosPostulante',
      'guardarPerfilPostulante'
    ]);
    alertsSpy  = jasmine.createSpyObj<Alerts>('Alerts', ['error', 'success']);

    perfilSpy.getCatalogosPostulante.and.returnValue(of(CATALOGOS));
    perfilSpy.getUserNamePostulante.and.returnValue(of({ name: 'Juan', lastname: 'Perez' }));
    perfilSpy.getPerfilCompleto.and.returnValue(of(null) as any);

    await TestBed.configureTestingModule({
      imports: [PerfilPostulante],
      providers: [
        provideRouter([]),
        { provide: Perfil,  useValue: perfilSpy  },
        { provide: Alerts,  useValue: alertsSpy  },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(PerfilPostulante);
    component = fixture.componentInstance;
  });

  afterEach(() => sessionStorage.clear());

  it('[C-001] Camino 1-6,F - perfilId null -> no llama getUserName ni getPerfilCompleto', () => {
    sessionStorage.removeItem('perfilId');

    fixture.detectChanges();

    expect(perfilSpy.getCatalogosPostulante).toHaveBeenCalledTimes(1);
    expect(perfilSpy.getUserNamePostulante).not.toHaveBeenCalled();
    expect(perfilSpy.getPerfilCompleto).not.toHaveBeenCalled();
    expect(component.postulanteForm).toBeTruthy();
  });

  it('[C-002] Camino ...7,29,F - getPerfilCompleto null -> no se ejecuta patchValue ni FormArray', () => {
    sessionStorage.setItem('perfilId', '1');
    perfilSpy.getPerfilCompleto.and.returnValue(of(null) as any);

    fixture.detectChanges();

    expect(perfilSpy.getPerfilCompleto).toHaveBeenCalledWith('1');
    expect(component.estudiosForm.length).toBe(1);
    expect(component.postulanteForm.get('experiencia')?.value).toBe('');
  });

  it('[C-003] Camino ...9,28,F - perfil básico sin arrays -> patchValue experiencia y cv', () => {
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

  it('[C-004] Camino ...11,27,F - solo estudios -> estudiosForm poblado', () => {
    sessionStorage.setItem('perfilId', '1');
    perfilSpy.getPerfilCompleto.and.returnValue(of({
      años_experiencia: '2', curriculum: 'cv.pdf',
      ...ESTUDIO_DATA,
      postulanteHabilidades: [], postulanteIdiomas: []
    }));

    fixture.detectChanges();

    expect(component.estudiosForm.length).toBe(1);
    expect(component.estudiosForm.at(0).get('titulo')?.value).toBe('Ing. Sistemas');
    expect(component.estudiosForm.at(0).get('nivel')?.value).toBe('Pregrado');
  });

  it('[C-005] Estudios + habilidades -> ambos FormArray poblados, idiomas vacío', () => {
    sessionStorage.setItem('perfilId', '1');
    perfilSpy.getPerfilCompleto.and.returnValue(of({
      años_experiencia: '2', curriculum: 'cv.pdf',
      ...ESTUDIO_DATA, ...HABILIDAD_DATA, postulanteIdiomas: []
    }));

    fixture.detectChanges();

    expect(component.estudiosForm.length).toBe(1);
    expect(component.habilidadesForm.length).toBe(1);
    expect(component.habilidadesForm.at(0).get('nombre')?.value).toBe('h1');
    expect(component.idiomasForm.length).toBe(1);
  });

  it('[C-006] Estudios + idiomas -> ambos FormArray poblados, habilidades vacío', () => {
    sessionStorage.setItem('perfilId', '1');
    perfilSpy.getPerfilCompleto.and.returnValue(of({
      años_experiencia: '2', curriculum: 'cv.pdf',
      ...ESTUDIO_DATA, postulanteHabilidades: [], ...IDIOMA_DATA
    }));

    fixture.detectChanges();

    expect(component.estudiosForm.length).toBe(1);
    expect(component.idiomasForm.length).toBe(1);
    expect(component.idiomasForm.at(0).get('nombre')?.value).toBe('i1');
  });

  it('[C-007] Solo habilidades -> habilidadesForm.clear() + push()', () => {
    sessionStorage.setItem('perfilId', '1');
    perfilSpy.getPerfilCompleto.and.returnValue(of({
      años_experiencia: '1', curriculum: 'cv.pdf',
      postulanteEstudios: [], ...HABILIDAD_DATA, postulanteIdiomas: []
    }));

    fixture.detectChanges();

    expect(component.habilidadesForm.length).toBe(1);
    expect(component.habilidadesForm.at(0).get('nombre')?.value).toBe('h1');
    expect(component.estudiosForm.length).toBe(1);
  });

  it('[C-008] Solo idiomas -> idiomasForm.clear() + push()', () => {
    sessionStorage.setItem('perfilId', '1');
    perfilSpy.getPerfilCompleto.and.returnValue(of({
      años_experiencia: '1', curriculum: 'cv.pdf',
      postulanteEstudios: [], postulanteHabilidades: [], ...IDIOMA_DATA
    }));

    fixture.detectChanges();

    expect(component.idiomasForm.length).toBe(1);
    expect(component.idiomasForm.at(0).get('nombre')?.value).toBe('i1');
  });

  it('[C-009] Perfil completo -> los tres FormArray poblados correctamente', () => {
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

  it('[C-010] Solo experiencia y cv -> patchValue, sin tocar FormArrays', () => {
    sessionStorage.setItem('perfilId', '1');
    perfilSpy.getPerfilCompleto.and.returnValue(of({
      años_experiencia: '7', curriculum: 'mi-cv.pdf',
      postulanteEstudios: [], postulanteHabilidades: [], postulanteIdiomas: []
    }));

    fixture.detectChanges();

    expect(component.postulanteForm.get('experiencia')?.value).toBe('7');
    expect(component.postulanteForm.get('cv')?.value).toBe('mi-cv.pdf');
  });

  it('[C-011] getUserNamePostulante error -> console.error("Error al obtener nombre")', () => {
    sessionStorage.setItem('perfilId', '1');
    perfilSpy.getUserNamePostulante.and.returnValue(throwError(() => new Error('500')));
    spyOn(console, 'error');

    fixture.detectChanges();

    expect(console.error).toHaveBeenCalledWith('Error al obtener nombre:', jasmine.any(Error));
  });

  it('[C-012] getPerfilCompleto error -> console.error("Error al cargar perfil:")', () => {
    sessionStorage.setItem('perfilId', '1');
    perfilSpy.getPerfilCompleto.and.returnValue(throwError(() => new Error('500')));
    spyOn(console, 'error');

    fixture.detectChanges();

    expect(console.error).toHaveBeenCalledWith('Error al cargar perfil:', jasmine.any(Error));
  });

  it('[C-013] Solo estudios presentes -> solo estudiosForm cargado', () => {
    sessionStorage.setItem('perfilId', '1');
    perfilSpy.getPerfilCompleto.and.returnValue(of({
      años_experiencia: '2', curriculum: 'cv.pdf',
      ...ESTUDIO_DATA, postulanteHabilidades: [], postulanteIdiomas: []
    }));

    fixture.detectChanges();

    expect(component.estudiosForm.at(0).get('titulo')?.value).toBe('Ing. Sistemas');
    expect(component.habilidadesForm.length).toBe(1);
    expect(component.idiomasForm.length).toBe(1);
  });
});

describe('PerfilPostulante — onPostulante()', () => {
  let component: PerfilPostulante;
  let fixture: ComponentFixture<PerfilPostulante>;
  let perfilSpy: jasmine.SpyObj<Perfil>;
  let alertsSpy: jasmine.SpyObj<Alerts>;
  let router: Router;

  beforeEach(async () => {
    perfilSpy  = jasmine.createSpyObj<Perfil>('Perfil', [
      'getUserNamePostulante', 'getPerfilCompleto', 'getCatalogosPostulante',
      'guardarPerfilPostulante'
    ]);
    alertsSpy  = jasmine.createSpyObj<Alerts>('Alerts', ['error', 'success']);

    perfilSpy.getCatalogosPostulante.and.returnValue(of(CATALOGOS));
    perfilSpy.getUserNamePostulante.and.returnValue(of({ name: 'Test', lastname: 'User' }));
    perfilSpy.getPerfilCompleto.and.returnValue(of(null) as any);

    await TestBed.configureTestingModule({
      imports: [PerfilPostulante],
      providers: [
        provideRouter([]),
        { provide: Perfil,  useValue: perfilSpy  },
        { provide: Alerts,  useValue: alertsSpy  },
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

  it('[C-001] Camino 1,2,3,14,15,F - formulario inválido -> alert.error("Campos incorrectos")', () => {
    component.postulanteForm.patchValue({ experiencia: '' });

    component.OnPostulante();

    expect(alertsSpy.error).toHaveBeenCalledWith('Campos incorrectos');
    expect(perfilSpy.guardarPerfilPostulante).not.toHaveBeenCalled();
  });

  it('[C-002] Camino 1,2,3,4,5,12,13,F - sin cv -> alert.error("Debe cargar su currículum")', () => {
    llenarFormularioValido();
    component.postulanteForm.patchValue({ cv: '' });
    component.cvFile = null;

    component.OnPostulante();

    expect(alertsSpy.error).toHaveBeenCalledWith('Debe cargar su currículum');
    expect(perfilSpy.guardarPerfilPostulante).not.toHaveBeenCalled();
  });

  it('[C-003] Camino 1-10,F - form válido + cvFile -> alert.success + navigate("/match")', () => {
    llenarFormularioValido();
    component.cvFile = new File([''], 'cv.pdf', { type: 'application/pdf' });
    perfilSpy.guardarPerfilPostulante.and.returnValue(of({ success: true }));
    component.idPostulante = 'post-1';

    component.OnPostulante();

    expect(perfilSpy.guardarPerfilPostulante).toHaveBeenCalledWith(
      'post-1',
      jasmine.objectContaining({ cv: 'cv.pdf' })
    );
    expect(alertsSpy.success).toHaveBeenCalledWith('Perfil guardado exitosamente');
    expect(router.navigate).toHaveBeenCalledWith(['/match']);
  });

  it('[C-004] Camino ...7,11,F - backend falla -> alert.error("Error al guardar el perfil")', () => {
    llenarFormularioValido();
    component.cvFile = new File([''], 'cv.pdf', { type: 'application/pdf' });
    perfilSpy.guardarPerfilPostulante.and.returnValue(throwError(() => new Error('500')));
    component.idPostulante = 'post-1';

    component.OnPostulante();

    expect(alertsSpy.error).toHaveBeenCalledWith('Error al guardar el perfil');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});