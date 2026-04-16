import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { Signup } from '../../src/app/features/signup/signup';
import { Alerts } from '../../src/app/shared/services/alerts';
import { Auth } from '../../src/app/shared/services/auth';

describe('Signup regresion', () => {
  let fixture: ComponentFixture<Signup>;
  let component: Signup;
  let authSpy: jasmine.SpyObj<Auth>;
  let alertsSpy: jasmine.SpyObj<Alerts>;
  let router: Router;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<Auth>('Auth', ['signUp', 'signUpPostulante']);
    alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['error', 'success']);

    authSpy.signUp.and.returnValue(of({ success: true, user: { id: 25 } }));
    authSpy.signUpPostulante.and.returnValue(of({ ok: true }));

    await TestBed.configureTestingModule({
      imports: [Signup],
      providers: [
        provideRouter([]),
        { provide: Auth, useValue: authSpy },
        { provide: Alerts, useValue: alertsSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Signup);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
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

  it('keeps the two-step registration flow working', () => {
    expect(fixture.nativeElement.textContent).toContain('Datos Personales');
    expect(component.currentStep).toBe(1);

    component.postulanteForm.setValue({
      name: 'Juan',
      lastname: 'Perez',
    });
    getButtonByText('Continuar').click();
    fixture.detectChanges();

    expect(component.currentStep).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Credenciales');
    expect(fixture.nativeElement.querySelector('input[type="email"]')).not.toBeNull();

    getButtonByText('Atr');
    getButtonByText('Atr').click();
    fixture.detectChanges();

    expect(component.currentStep).toBe(1);
    expect(fixture.nativeElement.querySelector('input[formcontrolname="name"]')).not.toBeNull();
  });

  it('preserves the successful signup flow and redirects to login', () => {
    component.currentStep = 2;
    fixture.detectChanges();

    component.postulanteForm.setValue({
      name: 'Laura',
      lastname: 'Gomez',
    });
    component.signupForm.setValue({
      email: 'laura@test.com',
      password: 'abc123456',
      repassword: 'abc123456',
    });

    getButtonByText('Registrar').click();

    expect(authSpy.signUp).toHaveBeenCalledWith(
      jasmine.objectContaining({
        email: 'laura@test.com',
        password: 'abc123456',
      })
    );
    expect(authSpy.signUpPostulante).toHaveBeenCalledWith(
      jasmine.objectContaining({
        name: 'Laura',
        lastname: 'Gomez',
        id_perfil: 25,
      })
    );
    expect(alertsSpy.success).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['login']);
  });

  it('still blocks progression when the first step is incomplete', () => {
    getButtonByText('Continuar').click();

    expect(component.currentStep).toBe(1);
    expect(alertsSpy.error).toHaveBeenCalledWith('Por favor, complete todos los campos requeridos');
  });
});
