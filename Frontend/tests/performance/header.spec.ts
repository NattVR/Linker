// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { Router } from '@angular/router';
// import { signal } from '@angular/core';

// import { Header } from '../../src/app/shared/components/header/header';
// import { Auth } from '../../src/app/shared/services/auth';
// import { Perfil } from '../../src/app/shared/services/perfil';
// import { SidebarService } from '../../src/app/services/sidebar/sidebar-service';
// import { expectWithinBudget, measurePerformance } from './performance-test.utils';

// describe('Header performance', () => {
//   let fixture: ComponentFixture<Header>;
//   let component: Header;
//   let authSpy: jasmine.SpyObj<Auth>;
//   let routerSpy: jasmine.SpyObj<Router>;
//   let sidebarSpy: jasmine.SpyObj<SidebarService>;

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

//   it('renders the header within budget', () => {
//     const result = measurePerformance({
//       iterations: 30,
//       run: () => {
//         fixture.detectChanges();
//       },
//     });

//     expectWithinBudget(result, 10, 40);
//   });

//   it('toggles menu state within budget', () => {
//     const result = measurePerformance({
//       iterations: 500,
//       run: () => {
//         component.toggleMenu();
//       },
//     });

//     expectWithinBudget(result, 0.2, 2);
//   });

//   it('closes menu within budget', () => {
//     component.isMenuOpen = true;

//     const result = measurePerformance({
//       iterations: 500,
//       run: () => {
//         component.closeMenu();
//       },
//     });

//     expect(component.isMenuOpen).toBeFalse();
//     expectWithinBudget(result, 0.2, 2);
//   });

//   it('reads user type from sessionStorage within budget', () => {
//     const result = measurePerformance({
//       iterations: 300,
//       run: () => {
//         component.getUserType();
//       },
//     });

//     expect(component.getUserType()).toBeFalse();
//     expectWithinBudget(result, 0.5, 3);
//   });

//   it('executes logout within budget', () => {
//     const result = measurePerformance({
//       iterations: 50,
//       run: () => {
//         component.onLogout();
//       },
//     });

//     expect(authSpy.logout).toHaveBeenCalled();
//     expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('');
//     expectWithinBudget(result, 2, 10);
//   });

//   it('reads isLogged signal within budget', () => {
//     const result = measurePerformance({
//       iterations: 500,
//       run: () => {
//         const _ = component.isLogged();
//       },
//     });

//     expect(component.isLogged()).toBeTrue();
//     expectWithinBudget(result, 0.2, 2);
//   });
// });