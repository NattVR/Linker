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

  afterEach(() => sessionStorage.clear());

  it('[C-001] onLogout() -> llama logout, navega a "" y cierra menú', () => {
    component.isMenuOpen = true;

    component.onLogout();

    expect(authSpy.logout).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).toHaveBeenCalledWith('');
    expect(component.isMenuOpen).toBeFalse();
  });

  it('[C-002] onLogout() -> Auth.logout limpia sesión y pone isLogged en false', () => {
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

  it('[C-003] onLogout() -> isMenuOpen queda en false sin importar estado previo', () => {
    component.isMenuOpen = true;

    component.onLogout();

    expect(component.isMenuOpen).toBeFalse();
  });

  it('[C-004] onLogout() -> redirige exactamente a la ruta raíz ""', () => {
    component.onLogout();

    expect(router.navigateByUrl).toHaveBeenCalledWith('');
  });

  it('[C-005] onLogout() -> múltiples llamadas no producen efectos inesperados', () => {
    component.isMenuOpen = true;

    component.onLogout();
    component.onLogout();

    expect(authSpy.logout).toHaveBeenCalledTimes(2);
    expect(router.navigateByUrl).toHaveBeenCalledTimes(2);
    expect(component.isMenuOpen).toBeFalse();
  });
});