/// <reference types="cypress" />

export {};

const fillLoginForm = (email: string, password: string) => {
  cy.get('input[type="email"]').clear().type(email);
  cy.get('input[type="password"]').clear().type(password);
};

const submitLogin = () => {
  cy.contains('button', 'Iniciar').click();
};

describe('Componentes - Login', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.window().then((win) => win.sessionStorage.clear());
  });

  it('debe renderizar los textos, campos y enlaces principales', () => {
    cy.contains('h1', 'Bienvenido de nuevo').should('be.visible');
    cy.contains('h2', 'Iniciar Sesi').should('be.visible');
    cy.get('input[formcontrolname="email"]')
      .should('be.visible')
      .and('have.attr', 'placeholder', 'Ingresa tu email');
    cy.get('input[formcontrolname="password"]').should('be.visible');
    cy.get('a[href="/signup"]').should('be.visible');
    cy.contains('a', 'Olvidaste').should('be.visible');
  });

  it('debe enviar las credenciales ingresadas al servicio de login', () => {
    cy.intercept('POST', '**/user/login', {
      statusCode: 400,
      body: { message: 'Credenciales inválidas' },
    }).as('loginComponent');

    fillLoginForm('qa.component@linker.com', 'Password123');
    submitLogin();

    cy.wait('@loginComponent').then((interception) => {
      expect(interception.request.body).to.deep.equal({
        email: 'qa.component@linker.com',
        password: 'Password123',
      });
    });
    cy.url().should('include', '/login');
  });

  it('debe guardar la sesion y redirigir cuando el login es exitoso', () => {
    cy.intercept('POST', '**/user/login', {
      statusCode: 201,
      body: {
        success: true,
        message: 'Inicio de sesión exitoso',
        token: 'token-login-component',
        user: { id: 'user-login-component' },
      },
    }).as('loginComponent');

    cy.intercept('GET', '**/empresa/isEmpresa/**', {
      statusCode: 200,
      body: false,
    }).as('isEmpresaComponent');
    cy.intercept('GET', '**/user/perfil/**', { id: 'perfil-login-component' }).as(
      'perfilComponent',
    );

    fillLoginForm('qa.component@linker.com', 'Password123');
    submitLogin();

    cy.wait('@loginComponent');
    cy.wait('@isEmpresaComponent');
    cy.wait('@perfilComponent');

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem('token')).to.eq('token-login-component');
      expect(win.sessionStorage.getItem('userId')).to.eq('user-login-component');
      expect(win.sessionStorage.getItem('perfilId')).to.eq('perfil-login-component');
      expect(win.sessionStorage.getItem('isEmpresa')).to.eq('false');
    });
    cy.url({ timeout: 10000 }).should('include', '/match');
  });
});
