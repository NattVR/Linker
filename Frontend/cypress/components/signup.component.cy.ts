/// <reference types="cypress" />

import { apiUrl } from './component-utils';

export {};

const uniqueEmail = (prefix: string) => `${prefix}.${Date.now()}@linker-components.com`;

describe('Componentes - Signup', () => {
  describe('Postulante', () => {
    beforeEach(() => {
      cy.visit('/signup');
    });

    it('debe mostrar el primer paso y avanzar a credenciales con datos validos', () => {
      cy.get('.signup-form').should('be.visible');
      cy.contains('.step', 'Datos Personales').should('have.class', 'active');
      cy.get('input[formcontrolname="name"]').type('Laura');
      cy.get('input[formcontrolname="lastname"]').type('Component');
      cy.contains('button', 'Continuar').click();

      cy.contains('.step', 'Credenciales').should('have.class', 'active');
      cy.get('input[formcontrolname="email"]').should('be.visible');
      cy.get('input[formcontrolname="password"]').should('be.visible');
      cy.get('input[formcontrolname="repassword"]').should('be.visible');
    });

    it('no debe avanzar si faltan los datos personales', () => {
      cy.contains('button', 'Continuar').click();
      cy.get('input[formcontrolname="email"]').should('not.exist');
      cy.get('.swal2-popup').should('be.visible');
    });

    it('debe registrar usuario y postulante con los datos del formulario', () => {
      const email = uniqueEmail('postulante');

      cy.intercept('POST', `${apiUrl()}/user/registro`, {
        statusCode: 201,
        body: {
          success: true,
          user: { id: 'perfil-postulante-component' },
        },
      }).as('registroUsuarioComponent');
      cy.intercept('POST', `${apiUrl()}/postulante/registro`, {
        statusCode: 201,
        body: { id_postulante: 'postulante-component' },
      }).as('registroPostulanteComponent');

      cy.get('input[formcontrolname="name"]').type('Laura');
      cy.get('input[formcontrolname="lastname"]').type('Component');
      cy.contains('button', 'Continuar').click();
      cy.get('input[formcontrolname="email"]').type(email);
      cy.get('input[formcontrolname="password"]').type('Password123');
      cy.get('input[formcontrolname="repassword"]').type('Password123');
      cy.contains('button', 'Registrar').click();

      cy.wait('@registroUsuarioComponent').its('request.body').should('deep.equal', {
        email,
        password: 'Password123',
        repassword: 'Password123',
      });
      cy.wait('@registroPostulanteComponent').its('request.body').should('include', {
        name: 'Laura',
        lastname: 'Component',
        id_perfil: 'perfil-postulante-component',
      });
      cy.url({ timeout: 10000 }).should('include', '/login');
    });
  });

  describe('Empresa', () => {
    beforeEach(() => {
      cy.visit('/signup-empresa');
    });

    it('debe mostrar el primer paso y avanzar a credenciales con datos validos', () => {
      cy.get('.signup-form').should('be.visible');
      cy.contains('.step', 'Datos Empresariales').should('have.class', 'active');
      cy.get('input[formcontrolname="name_empresa"]').type('Empresa Component');
      cy.get('input[formcontrolname="NIT"]').type('900123456');
      cy.contains('button', 'Continuar').click();

      cy.contains('.step', 'Credenciales').should('have.class', 'active');
      cy.get('input[formcontrolname="email"]').should('be.visible');
      cy.get('input[formcontrolname="password"]').should('be.visible');
      cy.get('input[formcontrolname="repassword"]').should('be.visible');
    });

    it('debe registrar usuario y empresa con los datos del formulario', () => {
      const email = uniqueEmail('empresa');

      cy.intercept('POST', `${apiUrl()}/user/registro`, {
        statusCode: 201,
        body: {
          success: true,
          user: { id: 'perfil-empresa-component' },
        },
      }).as('registroUsuarioEmpresaComponent');
      cy.intercept('POST', `${apiUrl()}/empresa/registro`, {
        statusCode: 201,
        body: { id: 'empresa-component' },
      }).as('registroEmpresaComponent');

      cy.get('input[formcontrolname="name_empresa"]').type('Empresa Component');
      cy.get('input[formcontrolname="NIT"]').type('900123456');
      cy.contains('button', 'Continuar').click();
      cy.get('input[formcontrolname="email"]').type(email);
      cy.get('input[formcontrolname="password"]').type('Password123');
      cy.get('input[formcontrolname="repassword"]').type('Password123');
      cy.contains('button', 'Registrar').click();

      cy.wait('@registroUsuarioEmpresaComponent').its('request.body').should('deep.equal', {
        email,
        password: 'Password123',
        repassword: 'Password123',
      });
      cy.wait('@registroEmpresaComponent').its('request.body').should('include', {
        name_empresa: 'Empresa Component',
        NIT: '900123456',
        id_perfil: 'perfil-empresa-component',
      });
      cy.url({ timeout: 10000 }).should('include', '/login');
    });
  });
});

