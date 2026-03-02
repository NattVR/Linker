import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PerfilEmpresa } from './perfil-empresa';
import { Alerts } from '../../shared/services/alerts';
import { Perfil } from '../../shared/services/perfil';

describe('PerfilEmpresa', () => {
  let component: PerfilEmpresa;
  let fixture: ComponentFixture<PerfilEmpresa>;
  let perfilSpy: jasmine.SpyObj<Perfil>;
  let alertsSpy: jasmine.SpyObj<Alerts>;

  beforeEach(async () => {
    perfilSpy = jasmine.createSpyObj<Perfil>('Perfil', [
      'getEmpresa',
      'updatePerfilEmpresa',
    ]);
    alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['error', 'success']);
    perfilSpy.getEmpresa.and.returnValue(
      of({
        name_empresa: '',
        sector: '',
        ubicacion: '',
        descripcion: '',
      } as Empresa)
    );
    perfilSpy.updatePerfilEmpresa.and.returnValue(of({ success: true }));

    await TestBed.configureTestingModule({
      imports: [PerfilEmpresa],
      providers: [
        provideRouter([]),
        { provide: Perfil, useValue: perfilSpy },
        { provide: Alerts, useValue: alertsSpy },
      ],
    })
      .overrideComponent(PerfilEmpresa, {
        set: {
          template: '',
          imports: [ReactiveFormsModule],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PerfilEmpresa);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function fillPerfilForm(): void {
    component.perfilEmpresa.setValue({
      name_empresa: 'Empresa Test',
      sector: 'Tecnologia',
      ubicacion: 'Medellin',
      descripcion: 'Descripcion de prueba',
    });
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe iniciar con activeTab y activeTabEmpresa por defecto', () => {
    expect(component.activeTab).toBe('vacantes');
    expect(component.activeTabEmpresa).toBe('perfil');
  });

  it('setActiveTab cambia la pestana activa', () => {
    component.setActiveTab('certificados');
    expect(component.activeTab).toBe('certificados');

    component.setActiveTab('estadisticas');
    expect(component.activeTab).toBe('estadisticas');
  });

  it('setActiveTabEmpresa cambia la vista activa', () => {
    component.setActiveTabEmpresa('editar_perfil');
    expect(component.activeTabEmpresa).toBe('editar_perfil');

    component.setActiveTabEmpresa('perfil');
    expect(component.activeTabEmpresa).toBe('perfil');
  });

  it('ngOnInit llama cargarDatosEmpresa', () => {
    const cargarSpy = spyOn(component, 'cargarDatosEmpresa');

    component.ngOnInit();

    expect(cargarSpy).toHaveBeenCalled();
  });

  it('cargarDatosEmpresa sin userId no llama getEmpresa', () => {
    spyOn(sessionStorage, 'getItem').and.returnValue(null);

    component.cargarDatosEmpresa();

    expect(perfilSpy.getEmpresa).not.toHaveBeenCalled();
  });

  it('cargarDatosEmpresa con userId asigna datos de empresa', () => {
    spyOn(sessionStorage, 'getItem').and.returnValue('123');
    perfilSpy.getEmpresa.and.returnValue(
      of({
        name_empresa: 'Acme',
        sector: 'TI',
        ubicacion: 'Bogota',
        descripcion: 'Empresa de prueba',
      } as Empresa)
    );

    component.cargarDatosEmpresa();

    expect(perfilSpy.getEmpresa).toHaveBeenCalledWith('123');
    expect(component.name_empresa).toBe('Acme');
    expect(component.sector).toBe('TI');
    expect(component.ubicacion).toBe('Bogota');
    expect(component.descripcion).toBe('Empresa de prueba');
  });

  it('cargarDatosEmpresa maneja error de getEmpresa', () => {
    spyOn(sessionStorage, 'getItem').and.returnValue('123');
    spyOn(console, 'error');
    perfilSpy.getEmpresa.and.returnValue(
      throwError(() => new Error('network error'))
    );

    component.cargarDatosEmpresa();

    expect(console.error).toHaveBeenCalledWith(
      'Error al obtener empresa:',
      jasmine.any(Error)
    );
  });

  it('updateEmpresa sin userId muestra error e intenta actualizar con id null', () => {
    spyOn(sessionStorage, 'getItem').and.returnValue(null);
    perfilSpy.updatePerfilEmpresa.and.returnValue(of({ success: true }));
    spyOn(component, 'cargarDatosEmpresa');

    component.updateEmpresa();

    expect(alertsSpy.error).toHaveBeenCalledWith('ID de usuario no encontrado');
    expect(perfilSpy.updatePerfilEmpresa).toHaveBeenCalledWith(
      null as unknown as string,
      component.perfilEmpresa.value
    );
    expect(component.cargarDatosEmpresa).toHaveBeenCalled();
    expect(alertsSpy.success).toHaveBeenCalledWith('Perfil actualizado con éxito');
  });

  it('updateEmpresa con userId llama updatePerfilEmpresa con datos del formulario', () => {
    spyOn(sessionStorage, 'getItem').and.returnValue('123');
    fillPerfilForm();
    perfilSpy.updatePerfilEmpresa.and.returnValue(of({ success: true }));

    component.updateEmpresa();

    expect(perfilSpy.updatePerfilEmpresa).toHaveBeenCalledWith('123', {
      name_empresa: 'Empresa Test',
      sector: 'Tecnologia',
      ubicacion: 'Medellin',
      descripcion: 'Descripcion de prueba',
    });
  });

  it('updateEmpresa exito en subscribe recarga datos, muestra success y cambia tab', () => {
    spyOn(sessionStorage, 'getItem').and.returnValue('123');
    perfilSpy.updatePerfilEmpresa.and.returnValue(of({ success: true }));
    spyOn(component, 'cargarDatosEmpresa');

    component.setActiveTabEmpresa('editar_perfil');
    component.updateEmpresa();

    expect(component.cargarDatosEmpresa).toHaveBeenCalled();
    expect(alertsSpy.success).toHaveBeenCalledWith('Perfil actualizado con éxito');
    expect(component.activeTabEmpresa).toBe('perfil');
  });

  it('updateEmpresa error en subscribe muestra alerta y loguea en consola', () => {
    spyOn(sessionStorage, 'getItem').and.returnValue('123');
    spyOn(console, 'error');
    perfilSpy.updatePerfilEmpresa.and.returnValue(
      throwError(() => new Error('network error'))
    );

    component.updateEmpresa();

    expect(alertsSpy.error).toHaveBeenCalledWith('Error al actualizar perfil');
    expect(console.error).toHaveBeenCalledWith(
      'Error al actualizar perfil:',
      jasmine.any(Error)
    );
  });
});
