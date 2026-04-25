// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { Router } from '@angular/router';
// import { signal } from '@angular/core';

// import { Header } from '../../src/app/shared/components/header/header';
// import { Auth } from '../../src/app/shared/services/auth';
// import { Perfil } from '../../src/app/shared/services/perfil';
// import { SidebarService } from '../../src/app/services/sidebar/sidebar-service';

// describe('Header regresion', () => {
//   let fixture: ComponentFixture<Header>;
//   let component: Header;
//   let authSpy: jasmine.SpyObj<Auth>;
//   let routerSpy: jasmine.SpyObj<Router>;
//   let sidebarSpy: jasmine.SpyObj<SidebarService>;

//   function setupSessionStorage(isEmpresa: string | null) {
//     (sessionStorage.getItem as jasmine.Spy).and.callFake((key: string): string | null => {
//       if (key === 'isEmpresa') return isEmpresa;
//       return null;
//     });
//   }

//   beforeEach(async () => {
//     authSpy = jasmine.createSpyObj<Auth>('Auth', ['logout'], {
//       isLogged: signal(true),
//     });
//     routerSpy = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
//     sidebarSpy = jasmine.createSpyObj<SidebarService>('SidebarService', ['toggle']);

//     spyOn(sessionStorage, 'getItem').and.callFake((key: string): string | null => {
//       if (key === 'isEmpresa') return 'false';
//       return null;
//     });

//     await TestBed.configureTestingModule({
//       imports: [Header],
//       providers: [
//         { provide: Auth, useValue: authSpy },
//         { provide: Router, useValue: routerSpy },
//         { provide: SidebarService, useValue: sidebarSpy },
//         { provide: Perfil, useValue: jasmine.createSpyObj('Perfil', []) },
//       ],
//     }).compileComponents();

//     fixture = TestBed.createComponent(Header);
//     component = fixture.componentInstance;
//     fixture.detectChanges();
//   });

//   it('renders the header component', () => {
//     expect(fixture.nativeElement).toBeTruthy();
//   });

//   it('exposes isLogged signal from auth service', () => {
//     expect(component.isLogged()).toBeTrue();
//   });

//   it('opens menu when isMenuOpen is false', () => {
//     component.isMenuOpen = false;
//     component.toggleMenu();
//     expect(component.isMenuOpen).toBeTrue();
//   });

//   it('closes menu when isMenuOpen is true', () => {
//     component.isMenuOpen = true;
//     component.toggleMenu();
//     expect(component.isMenuOpen).toBeFalse();
//   });

//   it('toggles menu state on successive calls', () => {
//     component.isMenuOpen = false;
//     component.toggleMenu();
//     component.toggleMenu();
//     expect(component.isMenuOpen).toBeFalse();
//   });

//   it('sets isMenuOpen to false on closeMenu', () => {
//     component.isMenuOpen = true;
//     component.closeMenu();
//     expect(component.isMenuOpen).toBeFalse();
//   });

//   it('closeMenu is idempotent when already closed', () => {
//     component.isMenuOpen = false;
//     component.closeMenu();
//     expect(component.isMenuOpen).toBeFalse();
//   });

//   it('returns false when isEmpresa is "false"', () => {
//     setupSessionStorage('false');
//     expect(component.getUserType()).toBeFalse();
//   });

//   it('returns true when isEmpresa is "true"', () => {
//     setupSessionStorage('true');
//     expect(component.getUserType()).toBeTrue();
//   });

//   it('returns false when isEmpresa is null', () => {
//     setupSessionStorage(null);
//     expect(component.getUserType()).toBeFalse();
//   });

//   it('calls auth.logout on onLogout', () => {
//     component.onLogout();
//     expect(authSpy.logout).toHaveBeenCalled();
//   });

//   it('navigates to root on logout', () => {
//     component.onLogout();
//     expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('');
//   });

//   it('closes menu on logout', () => {
//     component.isMenuOpen = true;
//     component.onLogout();
//     expect(component.isMenuOpen).toBeFalse();
//   });

//   it('logout closes menu before navigating', () => {
//     component.isMenuOpen = true;
//     component.onLogout();
//     expect(component.isMenuOpen).toBeFalse();
//     expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('');
//   });
// });