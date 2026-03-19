import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Signup } from './signup';
import { Auth } from '../../shared/services/auth';
import { Alerts } from '../../shared/services/alerts';

describe('Registrar Postulante', () => {
  let component: Signup;
  let fixture: ComponentFixture<Signup>;
  let authSpy: jasmine.SpyObj<Auth>;
  let alertsSpy: jasmine.SpyObj<Alerts>;
  let router: Router;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<Auth>('Auth', ['signUp', 'signUpPostulante']);
    alertsSpy = jasmine.createSpyObj<Alerts>('Alerts', ['error', 'success']);

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
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  function fillForms(): void{
    component.signupForm.setValue({
      email: 'test@mail.com',
      password: 'abc12345678',
      repassword:'abc12345678',
    });

    component.postulanteForm.setValue({
      name: 'Juan',
      lastname: 'Perez',
    });
  }

  it('Signup should create', () => {
    expect(component).toBeTruthy();
  });

  it('nextStep pasa a step 2 si postulanteForm es valido', () => {
    component.postulanteForm.setValue({ name: 'Ana', lastname: 'Lopez' });

    component.nextStep();
    expect(component.currentStep).toBe(2);
  });

  it('nextStep se queda en step 1 cuando postulanteForm es invalido', () => {
    component.postulanteForm.setValue({ name: '', lastname: '' });

    component.nextStep();
    expect(component.currentStep).toBe(1);
  });

  it('previousStep vuelve de step 2 a step 1', () => {
    component.currentStep = 2;
    component.previousStep();

    expect(component.currentStep).toBe(1);
  });

  it('previousStep no baja de step 1', () => {
    component.currentStep = 1;
    component.previousStep();

    expect(component.currentStep).toBe(1);
  });

  it('C1 contraseñas no coincidenerror y return sin signUp', () => {
     component.signupForm.setValue({
      email: 'test@mail.com',
      password: 'abc1234567800',
      repassword:'abc12345678',
    });

    component.postulanteForm.setValue({
      name: 'Juan',
      lastname: 'Perez',
    });

    component.onSignUp();
    expect(alertsSpy.error).toHaveBeenCalledWith('Las contraseñas no coinciden');
    expect(component.signupForm.hasError('passwordMismatch')).toBeTrue();
    expect(authSpy.signUp).not.toHaveBeenCalled();
  });

  it('C2 formulario invalido alert.error y sin signUp', () => {
    component.signupForm.setValue({
      email: '',
      password: 'abc12345678',
      repassword:'abc12345678',
    });

    component.postulanteForm.setValue({
      name: '',
      lastname: 'Perez',
    });

    component.onSignUp();

    expect(alertsSpy.error).toHaveBeenCalledWith('Campos incorrectos');
    expect(component.signupForm.invalid).toBeTrue();
    expect(component.postulanteForm.invalid).toBeTrue();
    expect(authSpy.signUp).not.toHaveBeenCalled();
  });

  it('C3 signUp request falla alert.error("Error en la solicitud")', () => {
    fillForms();
    authSpy.signUp.and.returnValue(throwError(() => new Error('network error')));

    component.onSignUp();

    expect(alertsSpy.error).toHaveBeenCalledWith('Error en la solicitud');
    expect(authSpy.signUpPostulante).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('C4 response.success=false alert.error(response.message)', () => {
    fillForms();
    authSpy.signUp.and.returnValue(
      of({ success: false, message: 'El correo ya esta registrado' })
    );

    component.onSignUp();

    expect(alertsSpy.error).toHaveBeenCalledWith('El correo ya esta registrado');
    expect(authSpy.signUpPostulante).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('C5 signUp success asigna id_perfil y registra postulante', () => {
    fillForms();
    authSpy.signUp.and.returnValue(of({ success: true, user: { id: 10 } }));
    authSpy.signUpPostulante.and.returnValue(of({ message: 'ok' }));

    component.onSignUp();

    expect(authSpy.signUpPostulante).toHaveBeenCalledWith(
      jasmine.objectContaining({
        name: 'Juan',
        lastname: 'Perez',
        id_perfil: 10,
      })
    );
    expect(alertsSpy.success).toHaveBeenCalledWith('Registro exitoso. Por favor, inicie sesión.');
    expect(router.navigate).toHaveBeenCalledWith(['login']);
  });

  xit('C6 postresponse null sin alert.success y sin navigate', () => {
    fillForms();
    authSpy.signUp.and.returnValue(of({ success: true, user: { id: 10 } }));
    authSpy.signUpPostulante.and.returnValue(of(null));

    component.onSignUp();

    expect(authSpy.signUpPostulante).toHaveBeenCalled();
    expect(alertsSpy.error).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  xit('C7 postresponse error', () => {
    fillForms();
    authSpy.signUp.and.returnValue(of({ success: true, user: { id: 10 } }));
    authSpy.signUpPostulante.and.returnValue(throwError(() => new Error('postulante error')));

    component.onSignUp();

    expect(authSpy.signUpPostulante).toHaveBeenCalled();
    expect(alertsSpy.error).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('C8 flujo exitoso alert.success y navigate([login])', () => {
    fillForms();
    authSpy.signUp.and.returnValue(of({ success: true, user: { id: 'uuid-user-test' } }));
    authSpy.signUpPostulante.and.returnValue(
      of({
        message: 'Postulante registrado con exito',
        postulante: { id: 'uuid-postulante-test' },
      })
    );

    component.onSignUp();

    expect(alertsSpy.success).toHaveBeenCalledWith('Registro exitoso. Por favor, inicie sesión.');
    expect(router.navigate).toHaveBeenCalledWith(['login']);
  });


  it('registro fallido: todos los campos vacios', () => {
    component.signupForm.setValue({
      email: '',
      password: '',
      repassword:'',
    });

    component.postulanteForm.setValue({
      name: '',
      lastname: '',
    });

    component.onSignUp();

    expect(alertsSpy.error).toHaveBeenCalledWith('Campos incorrectos');
    expect(authSpy.signUp).not.toHaveBeenCalled();
  });

  it(' registro fallido: campos con caracteres especiales', () => {
    component.signupForm.setValue({
      email: '!@#$%^&*()',
      password: '!@#$%^',
      repassword:'!@#$%^',
    });

    component.postulanteForm.setValue({
      name: '!@#$%',
      lastname: '^&*()',
    });
    
    component.onSignUp();

    expect(alertsSpy.error).toHaveBeenCalledWith('Campos incorrectos');
    expect(authSpy.signUp).not.toHaveBeenCalled();
  });

  it('[CP-021] registro con nombre/apellido numericos ', () => {
    component.signupForm.setValue({
      email: 'test@gmail.com',
      password: '12345678bnm',
      repassword:'12345678bnm',
    });

    component.postulanteForm.setValue({
      name: '1234567',
      lastname: '8901234',
    });

    component.onSignUp();

    expect(authSpy.signUp).toHaveBeenCalled();
    expect(alertsSpy.error).toHaveBeenCalled();
  });

  
  it(' registro fallido: solo 2 campos diligenciados', () => {
    component.signupForm.setValue({
      email: 'test@gmail.com',
      password: '',
      repassword:'',
    });

    component.postulanteForm.setValue({
      name: '1234567',
      lastname: '',
    });

    component.onSignUp();

    expect(alertsSpy.error).toHaveBeenCalledWith('Campos incorrectos');
    expect(authSpy.signUp).not.toHaveBeenCalled();
  });


  it('registro: password solo letras ', () => {
    component.signupForm.setValue({
      email: 'test@gmail.com',
      password: 'abcdef',
      repassword:'abcdef',
    });

    component.postulanteForm.setValue({
      name: 'Juan',
      lastname: 'Perez',
    });
    
    component.onSignUp();

    expect(authSpy.signUp).not.toHaveBeenCalled();
    expect(alertsSpy.error).toHaveBeenCalled();
  });

  it(' registro: password solo especiales', () => {
    component.signupForm.setValue({
      email: 'test@gmail.com',
      password: '"#$%&/(/()',
      repassword:'"#$%&/(/()',
    });

    component.postulanteForm.setValue({
      name: 'Juan',
      lastname: 'Perez',
    });
    component.onSignUp();

    expect(authSpy.signUp).not.toHaveBeenCalled();
    expect(alertsSpy.error).toHaveBeenCalled();
  });


  it('registro fallido: correo sin @ ni dominio', () => {
    component.signupForm.setValue({
      email: 'test',
      password: '12345678bnm',
      repassword:'12345678bnm',
    });

    component.postulanteForm.setValue({
      name: '1234567',
      lastname: '8901234',
    });

    component.onSignUp();

    expect(alertsSpy.error).toHaveBeenCalledWith('Campos incorrectos');
    expect(authSpy.signUp).not.toHaveBeenCalled();
  });

});
