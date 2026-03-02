import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PerfilVacantes } from './perfil-vacantes';
import { Match } from '../../../shared/services/match';
import { Perfil } from '../../../shared/services/perfil';

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
