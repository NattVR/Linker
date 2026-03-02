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
    perfilSpy = jasmine.createSpyObj<Perfil>('Perfil', ['getEmpresa', 'updatePerfilEmpresa']);
    alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['error', 'success']);

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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('updateEmpresa sessionStorage sin userId', () => {
    spyOn(sessionStorage, 'getItem').and.returnValue(null);

    component.updateEmpresa();
    expect(alertsSpy.error).toHaveBeenCalledWith('ID de usuario no encontrado');
    expect(perfilSpy.updatePerfilEmpresa).not.toHaveBeenCalled();
  });

  it('updateEmpresa sessionStorage con userId', () => {
    spyOn(sessionStorage, 'getItem').and.returnValue('123');
    component.perfilEmpresa.patchValue({
      name_empresa: 'Test',
      sector: 'Tech',
      ubicacion: 'Medellin',
      descripcion: 'Descripcion',
    });
    perfilSpy.updatePerfilEmpresa.and.returnValue(of({ success: true }))
    component.updateEmpresa();

    expect(perfilSpy.updatePerfilEmpresa).toHaveBeenCalledWith('123', {
      name_empresa: 'Test',
      sector: 'Tech',
      ubicacion: 'Medellin',
      descripcion: 'Descripcion',
    });
  });

  it('updateEmpresa error en subscribe', () => {
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

  it('updateEmpresa exito en subscribe', () => {
    spyOn(sessionStorage, 'getItem').and.returnValue('123');
    perfilSpy.updatePerfilEmpresa.and.returnValue(of({ success: true }));
    spyOn(component, 'cargarDatosEmpresa');

    component.updateEmpresa();
    expect(component.cargarDatosEmpresa).toHaveBeenCalled();
    expect(alertsSpy.success).toHaveBeenCalledWith('Perfil actualizado con éxito');
    expect(component.activeTabEmpresa).toBe('perfil');
  });
});
