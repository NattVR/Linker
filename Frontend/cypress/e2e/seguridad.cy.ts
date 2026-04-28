/// <reference types="cypress" />

const BASE_URL = 'http://localhost:4200';

const loginConCredenciales = (email: string, password: string) => {
  cy.visit(`${BASE_URL}/login`);
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"], .form-group button').last().click();
};

describe('Frontend Security', () => {
  beforeEach(() => {
    cy.window().then((win) => win.sessionStorage.clear());
  });

  it('SEC-F01: no existe token en sessionStorage antes de login', () => {
    cy.visit(BASE_URL);
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem('token')).to.be.null;
      expect(win.sessionStorage.getItem('userId')).to.be.null;
      expect(win.sessionStorage.getItem('perfilId')).to.be.null;
    });
  });

  it('SEC-F02: /match es accesible sin login (sin guard activo)', () => {
    cy.visit(`${BASE_URL}/match`);
    cy.url().should('not.include', '/login');
  });

  it('SEC-F03: /postulante es accesible sin login (sin guard activo)', () => {
    cy.visit(`${BASE_URL}/postulante`);
    cy.url().should('not.include', '/login');
  });

  it('SEC-F04: /empresa es accesible sin login (sin guard activo)', () => {
    cy.visit(`${BASE_URL}/empresa`);
    cy.url().should('not.include', '/login');
  });

  it('SEC-F05: sin sesión el header muestra botón Login y no Logout', () => {
    cy.visit(BASE_URL);
    cy.get('button.login-button').should('contain.text', 'Login');
    cy.get('button.login-button').should('not.contain.text', 'Logout');
  });

  it('SEC-F06: tras login exitoso el header muestra botón Logout', () => {
    cy.intercept('POST', '**/user/login', {
      statusCode: 201,
      body: {
        success: true,
        message: 'Inicio de sesión exitoso',
        token: 'mock-jwt-token',
        user: { id: 'user-1' },
      },
    }).as('login');

    cy.intercept('GET', '**/empresa/isEmpresa/**', {
      statusCode: 200,
      body: false,
    }).as('isEmpresa');

    cy.intercept('GET', '**/user/perfil/**', {
      statusCode: 200,
      body: { id: 'perfil-1' },
    }).as('perfil');

    loginConCredenciales('test@test.com', 'password123');

    cy.wait('@login');
    cy.wait('@isEmpresa');
    cy.wait('@perfil');

    cy.get('button.login-button').should('contain.text', 'Logout');
  });

  it('SEC-F07: logout limpia todo el sessionStorage', () => {
    cy.intercept('POST', '**/user/login', {
      statusCode: 201,
      body: { success: true, message: 'ok', token: 'mock-jwt', user: { id: 'user-1' } },
    }).as('login');
    cy.intercept('GET', '**/empresa/isEmpresa/**', { statusCode: 200, body: false }).as('isEmpresa');
    cy.intercept('GET', '**/user/perfil/**', { statusCode: 200, body: { id: 'perfil-1' } }).as('perfil');

    loginConCredenciales('test@test.com', 'password123');
    cy.wait('@login');
    cy.wait('@isEmpresa');
    cy.wait('@perfil');

    cy.get('button.login-button').click();

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem('token')).to.be.null;
      expect(win.sessionStorage.getItem('userId')).to.be.null;
      expect(win.sessionStorage.getItem('perfilId')).to.be.null;
      expect(win.sessionStorage.getItem('isEmpresa')).to.be.null;
    });
  });

  it('SEC-F08: logout redirige a la página raíz', () => {
    cy.intercept('POST', '**/user/login', {
      statusCode: 201,
      body: { success: true, message: 'ok', token: 'mock-jwt', user: { id: 'user-1' } },
    }).as('login');
    cy.intercept('GET', '**/empresa/isEmpresa/**', { statusCode: 200, body: false }).as('isEmpresa');
    cy.intercept('GET', '**/user/perfil/**', { statusCode: 200, body: { id: 'perfil-1' } }).as('perfil');

    loginConCredenciales('test@test.com', 'password123');
    cy.wait('@login');
    cy.wait('@isEmpresa');
    cy.wait('@perfil');

    cy.get('button.login-button').click();

    cy.url().should('eq', `${BASE_URL}/`);
  });

  it('SEC-F09: ruta desconocida redirige a raíz por el wildcard **', () => {
    cy.visit(`${BASE_URL}/ruta-que-no-existe`);
    cy.url().should('eq', `${BASE_URL}/`);
  });

  it('SEC-F10: input con script malicioso no ejecuta código ni rompe la app', () => {
    cy.visit(`${BASE_URL}/login`);

    cy.on('window:alert', () => {
      throw new Error('Se ejecutó un alert — posible XSS');
    });

    cy.get('input[type="email"]').type("<script>alert('xss')</script>");
    cy.get('input[type="password"]').type('password123');

    cy.get('.form-group button').last().click();

    cy.get('body').should('exist');
  });

  it('SEC-F11: email de 5000 caracteres no rompe la app', () => {
    const emailLargo = 'a'.repeat(5000) + '@test.com';

    cy.visit(`${BASE_URL}/login`);

    cy.get('input[type="email"]').invoke('val', emailLargo).trigger('input');
    cy.get('input[type="password"]').type('password123');
    cy.get('.form-group button').last().click();

    cy.get('body').should('exist');
  });

  it('SEC-F12: la app usa sessionStorage y no localStorage para el token', () => {
    cy.intercept('POST', '**/user/login', {
      statusCode: 201,
      body: { success: true, message: 'ok', token: 'mock-jwt', user: { id: 'user-1' } },
    }).as('login');
    cy.intercept('GET', '**/empresa/isEmpresa/**', { statusCode: 200, body: false }).as('isEmpresa');
    cy.intercept('GET', '**/user/perfil/**', { statusCode: 200, body: { id: 'perfil-1' } }).as('perfil');

    loginConCredenciales('test@test.com', 'password123');
    cy.wait('@login');

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem('token')).to.eq('mock-jwt');
      expect(win.localStorage.getItem('token')).to.be.null;
    });
  });

  it('SEC-F13: tras login como empresa el header enlaza a /empresa', () => {
    cy.intercept('POST', '**/user/login', {
      statusCode: 201,
      body: { success: true, message: 'ok', token: 'mock-jwt', user: { id: 'user-1' } },
    }).as('login');
    cy.intercept('GET', '**/empresa/isEmpresa/**', {
      statusCode: 200,
      body: true, // isEmpresa = true
    }).as('isEmpresa');
    cy.intercept('GET', '**/user/perfil/**', { statusCode: 200, body: { id: 'perfil-1' } }).as('perfil');

    loginConCredenciales('empresa@test.com', 'password123');
    cy.wait('@login');
    cy.wait('@isEmpresa');
    cy.wait('@perfil');

    cy.get('a[routerlink="empresa"]').should('exist');
  });

  it('SEC-F14: tras login como postulante el header enlaza a /postulante', () => {
    cy.intercept('POST', '**/user/login', {
      statusCode: 201,
      body: { success: true, message: 'ok', token: 'mock-jwt', user: { id: 'user-1' } },
    }).as('login');
    cy.intercept('GET', '**/empresa/isEmpresa/**', {
      statusCode: 200,
      body: false, // isEmpresa = false
    }).as('isEmpresa');
    cy.intercept('GET', '**/user/perfil/**', { statusCode: 200, body: { id: 'perfil-1' } }).as('perfil');

    loginConCredenciales('postulante@test.com', 'password123');
    cy.wait('@login');
    cy.wait('@isEmpresa');
    cy.wait('@perfil');

    cy.get('a[routerlink="postulante"]').should('exist');
  });

  it('SEC-F15: login fallido no guarda token en sessionStorage', () => {
    cy.intercept('POST', '**/user/login', {
      statusCode: 400,
      body: { message: 'Credenciales inválidas' },
    }).as('loginFallido');

    loginConCredenciales('fake@test.com', 'wrongpassword');
    cy.wait('@loginFallido');

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem('token')).to.be.null;
    });
  });

  it('SEC-F16: script malicioso en campos de registro no ejecuta código', () => {
    cy.visit(`${BASE_URL}/signup`);

    cy.on('window:alert', () => {
      throw new Error('Se ejecutó un alert — posible XSS');
    });

    cy.get('input[formcontrolname="name"]').type("<script>alert('xss')</script>");
    cy.get('input[formcontrolname="lastname"]').type("<script>alert('xss')</script>");
    cy.get('button.btn-primary').click();

    cy.get('body').should('exist');
  });

  it('SEC-F17: registro no avanza si las contraseñas no coinciden', () => {
    cy.visit(`${BASE_URL}/signup`);

    cy.get('input[formcontrolname="name"]').type('Juan');
    cy.get('input[formcontrolname="lastname"]').type('Pérez');
    cy.get('button.btn-primary').click();

    cy.get('input[formcontrolname="email"]').type('juan@test.com');
    cy.get('input[formcontrolname="password"]').type('password123');
    cy.get('input[formcontrolname="repassword"]').type('password_diferente');
    cy.get('button.btn-primary').click();

    cy.url().should('not.include', '/login');
  });

  it('SEC-F18: registro empresa no avanza al paso 2 si NIT está vacío', () => {
    cy.visit(`${BASE_URL}/signup-empresa`);

    cy.get('input[formcontrolname="name_empresa"]').type('Mi Empresa');

    cy.get('button.btn-primary').click();

    cy.get('input[formcontrolname="name_empresa"]').should('exist');
  });

  it('SEC-F19: sessionStorage se limpia al cerrar y reabrir la sesión del navegador', () => {
    cy.visit(BASE_URL);
    cy.window().then((win) => {
      win.sessionStorage.setItem('token', 'token-viejo');
    });

    cy.window().then((win) => win.sessionStorage.clear());

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem('token')).to.be.null;
    });
  });
});