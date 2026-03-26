import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Alerts } from '../../shared/services/alerts';
import { Perfil } from '../../shared/services/perfil';
import { PerfilEmpresa } from './perfil-empresa';

describe('PerfilEmpresa', () => {
  let component: PerfilEmpresa;
  let fixture: ComponentFixture<PerfilEmpresa>;
  let perfilSpy: jasmine.SpyObj<Perfil>;
  let alertsSpy: jasmine.SpyObj<Alerts>;
  let sessionStorageGetItemSpy: jasmine.Spy;

  const userId = 'empresa-123';

  function buildEmpresa(overrides: Partial<Empresa> = {}): Empresa {
    return {
      id_perfil: 'perfil-1',
      name_empresa: 'Acme',
      sector: 'Tecnologia',
      ubicacion: 'Bogota',
      descripcion: 'Empresa de prueba',
      NIT: '900123456-7',
      ...overrides,
    };
  }

  function createComponent(id: string | null = userId): void {
    sessionStorageGetItemSpy.and.callFake((key: string): string | null => {
      if (key === 'userId') {
        return id;
      }

      return null;
    });

    fixture = TestBed.createComponent(PerfilEmpresa);
    component = fixture.componentInstance;
  }

  function fillPerfilForm(): void {
    component.perfilEmpresa.setValue({
      name_empresa: 'Linker',
      sector: 'Tecnologia',
      ubicacion: 'Medellin',
      descripcion: 'Perfil empresarial actualizado',
    });
  }

  beforeEach(async () => {
    perfilSpy = jasmine.createSpyObj<Perfil>('Perfil', [
      'getEmpresa',
      'updatePerfilEmpresa',
    ]);
    alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['error', 'success']);

    perfilSpy.getEmpresa.and.returnValue(of(buildEmpresa()));
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

    sessionStorageGetItemSpy = spyOn(sessionStorage, 'getItem');
  });

  it('create', () => {
   
    createComponent();

  
    expect(component).toBeTruthy();
    expect(component.activeTab).toBe('vacantes');
    expect(component.activeTabEmpresa).toBe('perfil');
    expect(component.perfilEmpresa.invalid).toBeTrue();
  });

  it('s load company data on init  id exists', () => {
    
    const empresa = buildEmpresa({ name_empresa: 'Linker' });
    perfilSpy.getEmpresa.and.returnValue(of(empresa));
    createComponent();

    fixture.detectChanges();

    expect(perfilSpy.getEmpresa).toHaveBeenCalledWith(userId);
    expect(component.datosEmpresa).toEqual(empresa);
  });

  it('should change the active tab', () => {
    
    createComponent();

    component.setActiveTab('certificados');


    expect(component.activeTab).toBe('certificados');
  });

  it('patch form en editing con company data', () => {
   
    const empresa = buildEmpresa({
      name_empresa: 'Linker',
      sector: 'Servicios',
      ubicacion: 'Cali',
      descripcion: 'Descripcion de perfil',
    });
    createComponent();
    component.datosEmpresa = empresa;

    
    component.setActiveTabEmpresa('editar_perfil');

 
    expect(component.activeTabEmpresa).toBe('editar_perfil');
    expect(component.perfilEmpresa.getRawValue()).toEqual({
      name_empresa: 'Linker',
      sector: 'Servicios',
      ubicacion: 'Cali',
      descripcion: 'Descripcion de perfil',
    });
    expect(alertsSpy.error).not.toHaveBeenCalled();
  });

  it('editing sin company data', () => {
  
    createComponent();

 
    component.setActiveTabEmpresa('editar_perfil');

    
    expect(component.activeTabEmpresa).toBe('editar_perfil');
    expect(alertsSpy.error).toHaveBeenCalledWith('No hay datos de la empresa');
  });

  it('error loading company data sin user id', () => {
   
    createComponent(null);

    component.cargarDatosEmpresa();


    expect(perfilSpy.getEmpresa).not.toHaveBeenCalled();
    expect(alertsSpy.error).toHaveBeenCalledWith('Id de usuario no encontrado');
  });

  it('log error cuando loading company data fails', () => {
  
    const requestError = new Error('network error');
    perfilSpy.getEmpresa.and.returnValue(throwError(() => requestError));
    spyOn(console, 'error');
    createComponent();

    component.cargarDatosEmpresa();

    expect(perfilSpy.getEmpresa).toHaveBeenCalledWith(userId);
    expect(console.error).toHaveBeenCalledWith(
      'Error al obtener empresa:',
      requestError
    );
  });

  it('update return profile tab success', () => {
   
    createComponent();
    fillPerfilForm();
    component.activeTabEmpresa = 'editar_perfil';
    const reloadSpy = spyOn(component, 'cargarDatosEmpresa');


    component.updateEmpresa();

    expect(perfilSpy.updatePerfilEmpresa).toHaveBeenCalledWith(userId, {
      name_empresa: 'Linker',
      sector: 'Tecnologia',
      ubicacion: 'Medellin',
      descripcion: 'Perfil empresarial actualizado',
    });
    expect(reloadSpy).toHaveBeenCalled();
    expect(alertsSpy.success).toHaveBeenCalledWith(
      jasmine.stringMatching(/^Perfil actualizado con/)
    );
    expect(component.activeTabEmpresa).toBe('perfil');
  });

  it(' error update fails', () => {
   
    perfilSpy.updatePerfilEmpresa.and.returnValue(
      throwError(() => new Error('update failed'))
    );
    createComponent();
    fillPerfilForm();

    component.updateEmpresa();

    expect(alertsSpy.error).toHaveBeenCalledWith('Error al actualizar perfil');
  });

  it(' update service user id missing', () => {

    createComponent(null);
    const reloadSpy = spyOn(component, 'cargarDatosEmpresa');

    component.updateEmpresa();

    expect(perfilSpy.updatePerfilEmpresa).not.toHaveBeenCalled();
    expect(reloadSpy).not.toHaveBeenCalled();
    expect(alertsSpy.error).toHaveBeenCalledWith('ID de usuario no encontrado');
  });
});
