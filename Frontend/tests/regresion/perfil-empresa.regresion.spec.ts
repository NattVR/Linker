import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { PerfilEmpresa } from '../../src/app/features/perfil-empresa/perfil-empresa';
import { Alerts } from '../../src/app/shared/services/alerts';
import { LoggerService } from '../../src/app/shared/services/logger';
import { Match } from '../../src/app/shared/services/match';
import { Perfil } from '../../src/app/shared/services/perfil';

describe('PerfilEmpresa regresion', () => {
  let fixture: ComponentFixture<PerfilEmpresa>;
  let component: PerfilEmpresa;
  let perfilSpy: jasmine.SpyObj<Perfil>;
  let alertsSpy: jasmine.SpyObj<Alerts>;
  let matchSpy: jasmine.SpyObj<Match>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;

  const empresaMock: Empresa = {
    id_perfil: 'perfil-1',
    name_empresa: 'Linker',
    sector: 'Tecnologia',
    ubicacion: 'Bogota',
    descripcion: 'Empresa de pruebas',
    NIT: '123',
  };

  beforeEach(async () => {
    perfilSpy = jasmine.createSpyObj<Perfil>('Perfil', [
      'getEmpresa',
      'updatePerfilEmpresa',
      'getCerticados',
      'getCertificadosOfEmpresa',
    ]);
    alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['error', 'success']);
    matchSpy = jasmine.createSpyObj<Match>('Match', ['getVacantesForEmpresa']);
    loggerSpy = jasmine.createSpyObj<LoggerService>('LoggerService', ['log', 'error']);

    perfilSpy.getEmpresa.and.returnValue(of(empresaMock));
    perfilSpy.updatePerfilEmpresa.and.returnValue(of({ ok: true }));
    perfilSpy.getCerticados.and.returnValue(of([]));
    perfilSpy.getCertificadosOfEmpresa.and.returnValue(of([]));
    matchSpy.getVacantesForEmpresa.and.returnValue(of([]));
    spyOn(sessionStorage, 'getItem').and.callFake((key: string): string | null =>
      key === 'userId' ? 'perfil-1' : null
    );

    await TestBed.configureTestingModule({
      imports: [PerfilEmpresa],
      providers: [
        provideRouter([]),
        { provide: Perfil, useValue: perfilSpy },
        { provide: Alerts, useValue: alertsSpy },
        { provide: Match, useValue: matchSpy },
        { provide: LoggerService, useValue: loggerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilEmpresa);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function getButtonByText(text: string): HTMLButtonElement {
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const match = buttons.find((button) => button.textContent?.includes(text));
    if (!match) {
      throw new Error(`Button with text "${text}" was not found`);
    }
    return match;
  }

  it('keeps the company profile view loading and visible', () => {
    expect(perfilSpy.getEmpresa).toHaveBeenCalledWith('perfil-1');
    expect(fixture.nativeElement.textContent).toContain('Linker');
    expect(fixture.nativeElement.textContent).toContain('Tecnologia');
    expect(fixture.nativeElement.textContent).toContain('Bogota');
    expect(component.activeTabEmpresa).toBe('perfil');
    expect(component.activeTab).toBe('vacantes');
  });

  it('preserves edit profile flow from UI to successful save', () => {
    getButtonByText('Editar Perfil').click();
    fixture.detectChanges();

    component.perfilEmpresa.setValue({
      name_empresa: 'Linker Labs',
      sector: 'Software',
      ubicacion: 'Medellin',
      descripcion: 'Perfil editado',
    });

    getButtonByText('Guardar').click();
    fixture.detectChanges();

    expect(perfilSpy.updatePerfilEmpresa).toHaveBeenCalledWith('perfil-1', {
      name_empresa: 'Linker Labs',
      sector: 'Software',
      ubicacion: 'Medellin',
      descripcion: 'Perfil editado',
    });
    expect(alertsSpy.success).toHaveBeenCalled();
    expect(component.activeTabEmpresa).toBe('perfil');
  });

  it('keeps the secondary tabs switchable', () => {
    getButtonByText('Certificados').click();
    fixture.detectChanges();
    expect(component.activeTab).toBe('certificados');

    getButtonByText('Estadisticas').click();
    fixture.detectChanges();
    expect(component.activeTab).toBe('estadisticas');
    expect(fixture.nativeElement.textContent).toContain('Estad');
  });
});
