import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';

import { PerfilPostulante } from '../../src/app/features/perfil-postulante/perfil-postulante';
import { Alerts } from '../../src/app/shared/services/alerts';
import { Perfil } from '../../src/app/shared/services/perfil';

describe('PerfilPostulante regresion', () => {
  let fixture: ComponentFixture<PerfilPostulante>;
  let component: PerfilPostulante;
  let perfilSpy: jasmine.SpyObj<Perfil>;
  let alertsSpy: jasmine.SpyObj<Alerts>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockCatalogos = {
    habilidades: [
      { id_habilidad: 'h1', nombre_habilidad: 'Angular' },
      { id_habilidad: 'h2', nombre_habilidad: 'TypeScript' },
    ],
    idiomas: [
      { id_idioma: 'i1', nombre: 'Español' },
      { id_idioma: 'i2', nombre: 'Inglés' },
    ],
  };

  const mockPerfilCompleto = {
    años_experiencia: 3,
    curriculum: 'cv.pdf',
    postulanteEstudios: [
      { estudio: { titulo: 'Ingeniería', nivel: 'Superior' }, certificado: 'cert.pdf' },
    ],
    postulanteHabilidades: [
      { habilidades: { id_habilidad: 'h1' }, certificado: '' },
    ],
    postulanteIdiomas: [
      { idioma: { id_idioma: 'i1' }, certificado: '' },
    ],
  };

  beforeEach(async () => {
    perfilSpy = jasmine.createSpyObj<Perfil>('Perfil', [
      'getCatalogosPostulante',
      'getUserNamePostulante',
      'getPerfilCompleto',
      'guardarPerfilPostulante',
    ]);
    alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['success', 'error']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    perfilSpy.getCatalogosPostulante.and.returnValue(of(mockCatalogos));
    perfilSpy.getUserNamePostulante.and.returnValue(of({ name: 'Juan', lastname: 'Pérez' }));
    perfilSpy.getPerfilCompleto.and.returnValue(of(mockPerfilCompleto));
    perfilSpy.guardarPerfilPostulante.and.returnValue(of({ ok: true }));

    spyOn(sessionStorage, 'getItem').and.callFake((key: string): string | null => {
      if (key === 'perfilId') return 'postulante-1';
      return null;
    });

    await TestBed.configureTestingModule({
      imports: [PerfilPostulante],
      providers: [
        { provide: Perfil, useValue: perfilSpy },
        { provide: Alerts, useValue: alertsSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilPostulante);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads catalogos on init', () => {
    expect(perfilSpy.getCatalogosPostulante).toHaveBeenCalled();
    expect(component.catalogoHabilidades.length).toBe(2);
    expect(component.catalogoIdiomas.length).toBe(2);
  });

  it('loads user name on init', () => {
    expect(perfilSpy.getUserNamePostulante).toHaveBeenCalledWith('postulante-1');
    expect(component.name).toBe('Juan Pérez');
  });

  it('loads perfil completo and patches form', () => {
    expect(perfilSpy.getPerfilCompleto).toHaveBeenCalledWith('postulante-1');
    expect(component.postulanteForm.get('experiencia')?.value).toBe(3);
    expect(component.postulanteForm.get('cv')?.value).toBe('cv.pdf');
  });

  it('populates estudios form array from perfil', () => {
    expect(component.estudiosForm.length).toBe(1);
    expect(component.estudiosForm.at(0).get('titulo')?.value).toBe('Ingeniería');
  });

  it('populates habilidades form array from perfil', () => {
    expect(component.habilidadesForm.length).toBe(1);
    expect(component.habilidadesForm.at(0).get('nombre')?.value).toBe('h1');
  });

  it('populates idiomas form array from perfil', () => {
    expect(component.idiomasForm.length).toBe(1);
    expect(component.idiomasForm.at(0).get('nombre')?.value).toBe('i1');
  });

  it('sets isLoading to false after catalogos load', () => {
    expect(component.isLoading).toBeFalse();
  });

  it('adds a new estudio row (max 5)', () => {
    const before = component.estudiosForm.length;
    component.agregarEstudio();
    expect(component.estudiosForm.length).toBe(before + 1);
  });

  it('does not add estudio beyond 5', () => {
    for (let i = 0; i < 10; i++) component.agregarEstudio();
    expect(component.estudiosForm.length).toBe(5);
  });

  it('removes an estudio row (min 1)', () => {
    component.agregarEstudio();
    const before = component.estudiosForm.length;
    component.eliminarEstudio(before - 1);
    expect(component.estudiosForm.length).toBe(before - 1);
  });

  it('does not remove last estudio', () => {
    while (component.estudiosForm.length > 1) {
      component.eliminarEstudio(0);
    }
    component.eliminarEstudio(0);
    expect(component.estudiosForm.length).toBe(1);
  });

  it('adds and removes habilidad correctly', () => {
    component.agregarHabilidad();
    const before = component.habilidadesForm.length;
    component.eliminarHabilidad(before - 1);
    expect(component.habilidadesForm.length).toBe(before - 1);
  });

  it('adds and removes idioma correctly', () => {
    component.agregarIdioma();
    const before = component.idiomasForm.length;
    component.eliminarIdioma(before - 1);
    expect(component.idiomasForm.length).toBe(before - 1);
  });

  it('shows error when form is invalid on submit', () => {
    component.postulanteForm.get('experiencia')?.setValue('');
    component.OnPostulante();
    expect(alertsSpy.error).toHaveBeenCalledWith('Campos incorrectos');
    expect(perfilSpy.guardarPerfilPostulante).not.toHaveBeenCalled();
  });

  it('shows error when cv is missing on submit', () => {
    component.postulanteForm.patchValue({ experiencia: 3, cv: '' });
    component.cvFile = null;
    component.OnPostulante();
    expect(alertsSpy.error).toHaveBeenCalledWith('Debe cargar su currículum');
  });

  it('calls guardarPerfilPostulante with correct data', () => {
    component.postulanteForm.patchValue({ experiencia: 3, cv: 'cv.pdf' });
    component.OnPostulante();
    expect(perfilSpy.guardarPerfilPostulante).toHaveBeenCalledWith(
      'postulante-1',
      jasmine.objectContaining({ experiencia: 3, cv: 'cv.pdf' })
    );
  });

  it('shows success alert and navigates to match after save', () => {
    component.postulanteForm.patchValue({ experiencia: 3, cv: 'cv.pdf' });
    component.OnPostulante();
    expect(alertsSpy.success).toHaveBeenCalledWith('Perfil guardado exitosamente');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/match']);
  });

  it('shows error alert when save fails', () => {
    perfilSpy.guardarPerfilPostulante.and.returnValue(
      throwError(() => new Error('Error al guardar'))
    );
    component.postulanteForm.patchValue({ experiencia: 3, cv: 'cv.pdf' });
    component.OnPostulante();
    expect(alertsSpy.error).toHaveBeenCalledWith('Error al guardar el perfil');
  });

  it('sets isLoading to false even if catalogos fail', async () => {
    perfilSpy.getCatalogosPostulante.and.returnValue(
      throwError(() => new Error('Error de red'))
    );
    component.cargarCatalogos();
    expect(component.isLoading).toBeFalse();
  });
});