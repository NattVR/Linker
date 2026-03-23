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

  it('should create with the default state', () => {
    // Arrange
    createComponent();

    // Assert
    expect(component).toBeTruthy();
    expect(component.activeTab).toBe('vacantes');
    expect(component.activeTabEmpresa).toBe('perfil');
    expect(component.perfilEmpresa.invalid).toBeTrue();
  });

  it('should load company data on init when the user id exists', () => {
    // Arrange
    const empresa = buildEmpresa({ name_empresa: 'Linker' });
    perfilSpy.getEmpresa.and.returnValue(of(empresa));
    createComponent();

    // Act
    fixture.detectChanges();

    // Assert
    expect(perfilSpy.getEmpresa).toHaveBeenCalledWith(userId);
    expect(component.datosEmpresa).toEqual(empresa);
  });

  it('should change the active tab', () => {
    // Arrange
    createComponent();

    // Act
    component.setActiveTab('certificados');

    // Assert
    expect(component.activeTab).toBe('certificados');
  });

  it('should patch the form when editing with loaded company data', () => {
    // Arrange
    const empresa = buildEmpresa({
      name_empresa: 'Linker',
      sector: 'Servicios',
      ubicacion: 'Cali',
      descripcion: 'Descripcion de perfil',
    });
    createComponent();
    component.datosEmpresa = empresa;

    // Act
    component.setActiveTabEmpresa('editar_perfil');

    // Assert
    expect(component.activeTabEmpresa).toBe('editar_perfil');
    expect(component.perfilEmpresa.getRawValue()).toEqual({
      name_empresa: 'Linker',
      sector: 'Servicios',
      ubicacion: 'Cali',
      descripcion: 'Descripcion de perfil',
    });
    expect(alertsSpy.error).not.toHaveBeenCalled();
  });

  it('should show an error when editing without company data', () => {
    // Arrange
    createComponent();

    // Act
    component.setActiveTabEmpresa('editar_perfil');

    // Assert
    expect(component.activeTabEmpresa).toBe('editar_perfil');
    expect(alertsSpy.error).toHaveBeenCalledWith('No hay datos de la empresa');
  });

  it('should show an error when loading company data without user id', () => {
    // Arrange
    createComponent(null);

    // Act
    component.cargarDatosEmpresa();

    // Assert
    expect(perfilSpy.getEmpresa).not.toHaveBeenCalled();
    expect(alertsSpy.error).toHaveBeenCalledWith('Id de usuario no encontrado');
  });

  it('should log an error when loading company data fails', () => {
    // Arrange
    const requestError = new Error('network error');
    perfilSpy.getEmpresa.and.returnValue(throwError(() => requestError));
    spyOn(console, 'error');
    createComponent();

    // Act
    component.cargarDatosEmpresa();

    // Assert
    expect(perfilSpy.getEmpresa).toHaveBeenCalledWith(userId);
    expect(console.error).toHaveBeenCalledWith(
      'Error al obtener empresa:',
      requestError
    );
  });

  it('should update the profile and return to the profile tab on success', () => {
    // Arrange
    createComponent();
    fillPerfilForm();
    component.activeTabEmpresa = 'editar_perfil';
    const reloadSpy = spyOn(component, 'cargarDatosEmpresa');

    // Act
    component.updateEmpresa();

    // Assert
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

  it('should show an error when the profile update fails', () => {
    // Arrange
    perfilSpy.updatePerfilEmpresa.and.returnValue(
      throwError(() => new Error('update failed'))
    );
    createComponent();
    fillPerfilForm();

    // Act
    component.updateEmpresa();

    // Assert
    expect(alertsSpy.error).toHaveBeenCalledWith('Error al actualizar perfil');
  });

  it('should not call the update service when the user id is missing', () => {
    // Arrange
    createComponent(null);
    const reloadSpy = spyOn(component, 'cargarDatosEmpresa');

    // Act
    component.updateEmpresa();

    // Assert
    expect(perfilSpy.updatePerfilEmpresa).not.toHaveBeenCalled();
    expect(reloadSpy).not.toHaveBeenCalled();
    expect(alertsSpy.error).toHaveBeenCalledWith('ID de usuario no encontrado');
  });
});
