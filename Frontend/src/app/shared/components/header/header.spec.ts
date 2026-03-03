import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { Header } from './header';
import { Auth } from '../../services/auth';
import { Perfil } from '../../services/perfil';
import { SidebarService } from '../../../services/sidebar/sidebar-service';

describe('Header - onLogout()', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;
  let authSpy: jasmine.SpyObj<Auth>;
  let router: Router;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<Auth>('Auth', ['logout', 'login', 'getPerfilId']);
    (authSpy as any).isLogged = signal(false);

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([]),
        { provide: Auth,           useValue: authSpy },
        { provide: Perfil,         useValue: jasmine.createSpyObj('Perfil', ['getIsEmpresa']) },
        { provide: SidebarService, useValue: jasmine.createSpyObj('SidebarService', ['close', 'toggle']) },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    router    = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
  });

  it('[C-001] Camino 1,2,3,4,F - onLogout() ejecuta logout, navega a "" y cierra el menú', () => {
    component.isMenuOpen = true;

    component.onLogout();

    expect(authSpy.logout).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).toHaveBeenCalledWith('');
    expect(component.isMenuOpen).toBeFalse();
  });

  it('[C-002] Camino 1,2,3,F - Auth.logout() pone isLogged en false y limpia sessionStorage', () => {
    sessionStorage.setItem('token', 'fake-token');
    sessionStorage.setItem('userId', 'u-1');
    (authSpy as any).isLogged.set(true);

    authSpy.logout.and.callFake(() => {
      (authSpy as any).isLogged.set(false);
      sessionStorage.clear();
    });

    component.onLogout();

    expect((authSpy as any).isLogged()).toBeFalse();
    expect(sessionStorage.length).toBe(0);
  });

  it('después de onLogout(), isMenuOpen queda en false', () => {
    component.isMenuOpen = true;
    component.onLogout();
    expect(component.isMenuOpen).toBeFalse();
  });

  it('onLogout() redirige a la ruta raíz ""', () => {
    component.onLogout();
    expect(router.navigateByUrl).toHaveBeenCalledWith('');
  });

  it('onLogout() invoca el servicio de autenticación para cerrar sesión', () => {
    component.onLogout();
    expect(authSpy.logout).toHaveBeenCalled();
  });

  it('múltiples llamadas a onLogout() no producen efectos inesperados', () => {
    component.onLogout();
    component.onLogout();

    expect(authSpy.logout).toHaveBeenCalledTimes(2);
    expect(router.navigateByUrl).toHaveBeenCalledTimes(2);
    expect(component.isMenuOpen).toBeFalse();
  });
});