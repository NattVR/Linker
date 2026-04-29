/// <reference types="cypress" />

export {};

const uniqueEmail = (prefix: string) => `${prefix}.${Date.now()}@linker-e2e.com`;

describe('Signup - Flujo completo', () => {
  describe('Registro de postulante', () => {
    beforeEach(() => {
      cy.visit('/signup');
    });

    describe('Renderizado del formulario', () => {
      it('debe mostrar el primer paso de datos personales', () => {
        cy.contains('h2', 'Reg').should('be.visible');
        cy.get('input[formcontrolname="name"]').should('be.visible');
        cy.get('input[formcontrolname="lastname"]').should('be.visible');
        cy.contains('button', 'Continuar').should('be.visible');
      });

      it('CA-SP-01 debe mostrar campo de nombre de usuario para valores de texto', () => {
        cy.get('input[formcontrolname="name"]')
          .should('be.visible')
          .and('have.attr', 'type', 'text')
          .type('Camila')
          .should('have.value', 'Camila');
      });

      it('CA-SP-02 debe mostrar campo de contraseña que acepta texto, números y caracteres especiales', () => {
        cy.get('input[formcontrolname="name"]').type('Camila');
        cy.get('input[formcontrolname="lastname"]').type('Cypress');
        cy.contains('button', 'Continuar').click();

        cy.get('input[formcontrolname="password"]')
          .should('be.visible')
          .and('have.attr', 'type', 'password')
          .type('Abc123!@#')
          .should('have.value', 'Abc123!@#');
      });

      it('CA-SP-03 debe mostrar campo de correo electrónico que acepta texto y números', () => {
        cy.get('input[formcontrolname="name"]').type('Camila');
        cy.get('input[formcontrolname="lastname"]').type('Cypress');
        cy.contains('button', 'Continuar').click();

        cy.get('input[formcontrolname="email"]')
          .should('be.visible')
          .and('have.attr', 'type', 'email')
          .type('usuario123@correo.com')
          .should('have.value', 'usuario123@correo.com');
      });

      it('debe mostrar el enlace para registro de empresa', () => {
        cy.get('a[routerlink="/signup-empresa"]').should('be.visible');
      });
    });

    describe('Validaciones del formulario', () => {
      it('no debe avanzar al paso de credenciales si faltan datos personales', () => {
        cy.contains('button', 'Continuar').click();
        cy.get('input[formcontrolname="email"]').should('not.exist');
        cy.get('.swal2-popup').should('be.visible');
      });

      it('no debe registrar si las contraseñas no coinciden', () => {
        cy.get('input[formcontrolname="name"]').type('Laura');
        cy.get('input[formcontrolname="lastname"]').type('E2E');
        cy.contains('button', 'Continuar').click();

        cy.get('input[formcontrolname="email"]').type(uniqueEmail('postulante.mismatch'));
        cy.get('input[formcontrolname="password"]').type('Password123');
        cy.get('input[formcontrolname="repassword"]').type('Password456');
        cy.contains('button', 'Registrar').click();

        cy.get('.swal2-popup').should('be.visible');
        cy.url().should('include', '/signup');
      });
    });

    describe('Registro exitoso', () => {
      it('debe crear usuario, crear postulante y redirigir a login', () => {
        const email = uniqueEmail('postulante');
        const apiUrl = Cypress.env('API_URL') as string;

        cy.intercept('POST', `${apiUrl}/user/registro`).as('registroUsuario');
        cy.intercept('POST', `${apiUrl}/postulante/registro`).as('registroPostulante');

        cy.get('input[formcontrolname="name"]').type('Camila');
        cy.get('input[formcontrolname="lastname"]').type('Cypress');
        cy.contains('button', 'Continuar').click();

        cy.get('input[formcontrolname="email"]').type(email);
        cy.get('input[formcontrolname="password"]').type('Password123');
        cy.get('input[formcontrolname="repassword"]').type('Password123');
        cy.contains('button', 'Registrar').click();

        cy.wait('@registroUsuario').then((interception) => {
          expect(interception.request.body).to.deep.equal({
            email,
            password: 'Password123',
            repassword: 'Password123',
          });
          expect(interception.response?.statusCode).to.eq(201);
        });

        cy.wait('@registroPostulante').then((interception) => {
          expect(interception.request.body).to.include({
            name: 'Camila',
            lastname: 'Cypress',
          });
          expect(interception.request.body.id_perfil).to.be.a('string');
          expect(interception.response?.statusCode).to.eq(201);
        });

        cy.get('.swal2-popup').should('be.visible');
        cy.url({ timeout: 10000 }).should('include', '/login');
      });
    });
  });

  describe('Registro de empresa', () => {
    beforeEach(() => {
      cy.visit('/signup-empresa');
    });

    describe('Renderizado del formulario', () => {
      it('debe mostrar el primer paso de datos empresariales', () => {
        cy.contains('h2', 'Registrate').should('be.visible');
        cy.get('input[formcontrolname="name_empresa"]').should('be.visible');
        cy.get('input[formcontrolname="NIT"]').should('be.visible');
        cy.contains('button', 'Continuar').should('be.visible');
      });

      it('CA-SE-01 debe mostrar campos de correo, NIT, nombre de empresa y contraseña', () => {
        cy.get('input[formcontrolname="name_empresa"]').should('be.visible');
        cy.get('input[formcontrolname="NIT"]').should('be.visible');

        cy.get('input[formcontrolname="name_empresa"]').type('Empresa QA');
        cy.get('input[formcontrolname="NIT"]').type('123456789');
        cy.contains('button', 'Continuar').click();

        cy.get('input[formcontrolname="email"]').should('be.visible');
        cy.get('input[formcontrolname="password"]').should('be.visible');
      });

      it('CA-SE-02 debe mostrar campo de contraseña que acepta texto, números y caracteres especiales', () => {
        cy.get('input[formcontrolname="name_empresa"]').type('Empresa QA');
        cy.get('input[formcontrolname="NIT"]').type('123456789');
        cy.contains('button', 'Continuar').click();

        cy.get('input[formcontrolname="password"]')
          .should('be.visible')
          .and('have.attr', 'type', 'password')
          .type('Empresa123!@#')
          .should('have.value', 'Empresa123!@#');
      });

      it('CA-SE-03 debe mostrar campos de correo y nombre que aceptan texto y números', () => {
        cy.get('input[formcontrolname="name_empresa"]')
          .should('be.visible')
          .and('have.attr', 'type', 'text')
          .type('Empresa123')
          .should('have.value', 'Empresa123');

        cy.get('input[formcontrolname="NIT"]').type('123456789');
        cy.contains('button', 'Continuar').click();

        cy.get('input[formcontrolname="email"]')
          .should('be.visible')
          .and('have.attr', 'type', 'email')
          .type('empresa123@correo.com')
          .should('have.value', 'empresa123@correo.com');
      });

      it('CA-SE-04 debe mostrar campo de NIT que permite ingresar valores numéricos', () => {
        cy.get('input[formcontrolname="NIT"]')
          .should('be.visible')
          .type('123456789')
          .should('have.value', '123456789');
      });
    });

    describe('Validaciones del formulario', () => {
      it('no debe avanzar al paso de credenciales si falta el NIT', () => {
        cy.get('input[formcontrolname="name_empresa"]').type('Empresa Sin Nit');
        cy.contains('button', 'Continuar').click();

        cy.get('input[formcontrolname="email"]').should('not.exist');
        cy.get('input[formcontrolname="NIT"]').should('be.visible');
      });

      it('no debe registrar si el email tiene formato inválido', () => {
        cy.get('input[formcontrolname="name_empresa"]').type('Empresa QA');
        cy.get('input[formcontrolname="NIT"]').type(`NIT-${Date.now()}`);
        cy.contains('button', 'Continuar').click();

        cy.get('input[formcontrolname="email"]').type('correo-invalido');
        cy.get('input[formcontrolname="password"]').type('Password123');
        cy.get('input[formcontrolname="repassword"]').type('Password123');
        cy.contains('button', 'Registrar').click();

        cy.get('.swal2-popup').should('be.visible');
        cy.url().should('include', '/signup-empresa');
      });
    });

    describe('Registro exitoso', () => {
      it('debe crear usuario, crear empresa y redirigir a login', () => {
        const email = uniqueEmail('empresa');
        const nit = `NIT-${Date.now()}`;
        const apiUrl = Cypress.env('API_URL') as string;

        cy.intercept('POST', `${apiUrl}/user/registro`).as('registroUsuario');
        cy.intercept('POST', `${apiUrl}/empresa/registro`).as('registroEmpresa');

        cy.get('input[formcontrolname="name_empresa"]').type('Linker Empresa E2E');
        cy.get('input[formcontrolname="NIT"]').type(nit);
        cy.contains('button', 'Continuar').click();

        cy.get('input[formcontrolname="email"]').type(email);
        cy.get('input[formcontrolname="password"]').type('Password123');
        cy.get('input[formcontrolname="repassword"]').type('Password123');
        cy.contains('button', 'Registrar').click();

        cy.wait('@registroUsuario').then((interception) => {
          expect(interception.request.body).to.deep.equal({
            email,
            password: 'Password123',
            repassword: 'Password123',
          });
          expect(interception.response?.statusCode).to.eq(201);
        });

        cy.wait('@registroEmpresa').then((interception) => {
          expect(interception.request.body).to.include({
            name_empresa: 'Linker Empresa E2E',
            NIT: nit,
          });
          expect(interception.request.body.id_perfil).to.be.a('string');
          expect(interception.response?.statusCode).to.eq(201);
        });

        cy.get('.swal2-popup').should('be.visible');
        cy.url({ timeout: 10000 }).should('include', '/login');
      });
    });
  });
});