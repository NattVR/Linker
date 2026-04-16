import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Signup } from '../../src/app/features/signup/signup';
import { Alerts } from '../../src/app/shared/services/alerts';
import { Auth } from '../../src/app/shared/services/auth';
import { expectWithinBudget, measurePerformance } from './performance-test.utils';

describe('Signup performance', () => {
  let authSpy: jasmine.SpyObj<Auth>;
  let alertsSpy: jasmine.SpyObj<Alerts>;

  function createComponent(): ComponentFixture<Signup> {
    const fixture = TestBed.createComponent(Signup);
    fixture.detectChanges();
    return fixture;
  }

  function fillValidForms(component: Signup): void {
    component.signupForm.setValue({
      email: 'perf@test.com',
      password: 'abc123456',
      repassword: 'abc123456',
    });
    component.postulanteForm.setValue({
      name: 'Linker',
      lastname: 'Tester',
    });
  }

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<Auth>('Auth', ['signUp', 'signUpPostulante']);
    alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['error', 'success']);

    authSpy.signUp.and.returnValue(of({ success: true, user: { id: 101 } }));
    authSpy.signUpPostulante.and.returnValue(of({ ok: true }));

    await TestBed.configureTestingModule({
      imports: [Signup],
      providers: [
        provideRouter([]),
        { provide: Auth, useValue: authSpy },
        { provide: Alerts, useValue: alertsSpy },
      ],
    }).compileComponents();
  });

  it('renders within the agreed budget', () => {
    const result = measurePerformance({
      iterations: 12,
      run: () => {
        const fixture = createComponent();
        fixture.destroy();
      },
    });

    expectWithinBudget(result, 120, 250);
  });

  it('processes the signup happy path efficiently', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    const result = measurePerformance({
      iterations: 60,
      run: () => {
        component.currentStep = 1;
        fillValidForms(component);
        component.onSignUp();
      },
    });

    expect(authSpy.signUp).toHaveBeenCalled();
    expect(authSpy.signUpPostulante).toHaveBeenCalled();
    expectWithinBudget(result, 12, 40);
  });
});
