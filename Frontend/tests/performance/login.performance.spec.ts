// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { of, throwError } from 'rxjs';
// import { Router } from '@angular/router';

// import { Login } from '../../src/app/features/login/login';
// import { Auth } from '../../src/app/shared/services/auth';
// import { Alerts } from '../../src/app/shared/services/alerts';
// import { Perfil } from '../../src/app/shared/services/perfil';
// import { expectWithinBudget, measurePerformance } from './performance-test.utils';

// describe('Login performance', () => {
//   let fixture: ComponentFixture<Login>;
//   let component: Login;
//   let authSpy: jasmine.SpyObj<Auth>;
//   let alertsSpy: jasmine.SpyObj<Alerts>;
//   let perfilSpy: jasmine.SpyObj<Perfil>;
//   let routerSpy: jasmine.SpyObj<Router>;

//   const mockLoginResponse = {
//     success: true,
//     message: 'Inicio de sesión exitoso',
//     token: 'mock-jwt-token',
//     user: { id: 'user-1' },
//   };

//   beforeEach(async () => {
//     authSpy = jasmine.createSpyObj<Auth>('Auth', ['login', 'getPerfilId'], {
//       isLogged: jasmine.createSpyObj('Signal', ['set']),
//     });
//     alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['success', 'error']);
//     perfilSpy = jasmine.createSpyObj<Perfil>('Perfil', ['getIsEmpresa']);
//     routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

//     authSpy.login.and.returnValue(of(mockLoginResponse));
//     authSpy.getPerfilId.and.returnValue(of({ id: 'perfil-1' }));
//     perfilSpy.getIsEmpresa.and.returnValue(of(false));

//     spyOn(sessionStorage, 'getItem').and.returnValue(null);
//     spyOn(sessionStorage, 'setItem');

//     await TestBed.configureTestingModule({
//       imports: [Login],
//       providers: [
//         { provide: Auth, useValue: authSpy },
//         { provide: Alerts, useValue: alertsSpy },
//         { provide: Perfil, useValue: perfilSpy },
//         { provide: Router, useValue: routerSpy },
//       ],
//     }).compileComponents();

//     fixture = TestBed.createComponent(Login);
//     component = fixture.componentInstance;
//     fixture.detectChanges();
//   });

//   it('renders the login form within budget', () => {
//     const result = measurePerformance({
//       iterations: 30,
//       run: () => {
//         fixture.detectChanges();
//       },
//     });

//     expectWithinBudget(result, 10, 40);
//   });

//   it('patches form values within budget', () => {
//     const result = measurePerformance({
//       iterations: 100,
//       run: () => {
//         component.loginForm.patchValue({
//           email: 'test@correo.com',
//           password: 'password123',
//         });
//       },
//     });

//     expect(component.loginForm.get('email')?.value).toBe('test@correo.com');
//     expectWithinBudget(result, 1, 5);
//   });

//   it('validates form state within budget', () => {
//     component.loginForm.patchValue({ email: 'test@correo.com', password: 'password123' });

//     const result = measurePerformance({
//       iterations: 200,
//       run: () => {
//         const _ = component.loginForm.valid;
//       },
//     });

//     expect(component.loginForm.valid).toBeTrue();
//     expectWithinBudget(result, 0.5, 3);
//   });

//   it('executes onLogin pipeline within budget', () => {
//     component.loginForm.patchValue({ email: 'test@correo.com', password: 'password123' });

//     const result = measurePerformance({
//       iterations: 20,
//       run: () => {
//         component.onLogin();
//       },
//     });

//     expect(authSpy.login).toHaveBeenCalled();
//     expectWithinBudget(result, 5, 20);
//   });

//   it('handles login error without degrading performance', () => {
//     authSpy.login.and.returnValue(throwError(() => new Error('Credenciales inválidas')));
//     component.loginForm.patchValue({ email: 'fail@correo.com', password: 'wrong' });

//     const result = measurePerformance({
//       iterations: 20,
//       run: () => {
//         component.onLogin();
//       },
//     });

//     expectWithinBudget(result, 5, 20);
//   });
// });