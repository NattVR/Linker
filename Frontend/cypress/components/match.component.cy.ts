/// <reference types="cypress" />

import { apiUrl, visitWithSession } from './component-utils';

export {};

const vacante = {
  id_vacante: 'vacante-match-component',
  titulo: 'QA Automation',
  salario: 5000000,
  ubicacion: 'Bogotá',
  modalidad: 'Remoto',
  tipo_trabajo: 'Full-time',
  habilidades: ['Cypress', 'Angular'],
  idiomas: ['Español'],
  empresa: {
    id_perfil: 'empresa-match-component',
    name_empresa: 'Linker QA',
  },
};

describe('Componentes - Match', () => {
  it('debe cargar vacantes para postulante y enviar interaccion al hacer swipe', () => {
    cy.intercept('GET', `${apiUrl()}/vacantes/vacantes/perfil-postulante-component`, [
      vacante,
    ]).as('getVacantesComponent');
    cy.intercept('POST', `${apiUrl()}/interacciones`, {
      statusCode: 201,
      body: { ok: true },
    }).as('postInteraccionComponent');

    visitWithSession('/match', {
      perfilId: 'perfil-postulante-component',
      isEmpresa: 'false',
    });

    cy.get('.layout-section').should('be.visible');
    cy.get('app-swipe').should('exist');
    cy.contains('button', 'Carguemos Vacantes').click();
    cy.wait('@getVacantesComponent');

    cy.contains('.card-name', 'QA Automation').should('be.visible');
    cy.contains('.tag', 'Cypress').should('be.visible');
    cy.get('.cards')
      .first()
      .trigger('pointerdown', { clientX: 100 })
      .trigger('pointermove', { clientX: 260 })
      .trigger('pointerup');

    cy.wait('@postInteraccionComponent').its('request.body').should('deep.equal', {
      accion_postulante: 'like',
      vacante: 'vacante-match-component',
      postulante: 'perfil-postulante-component',
      empresa: 'empresa-match-component',
    });
  });

  it('debe mostrar menu de vacantes y cargar postulantes para empresa', () => {
    cy.intercept('GET', `${apiUrl()}/vacantes/empresaId/perfil-empresa-component`, [
      vacante,
    ]).as('getVacantesEmpresaComponent');
    cy.intercept('GET', `${apiUrl()}/postulante/postulantes/vacante-match-component`, [
      {
        id: 'postulante-match-component',
        name: 'Sofia',
        lastname: 'QA',
        anos_experiencia: 4,
        curriculum: '#',
        foto: 'assets/img/match-user-icon.webp',
        ubicacion: 'Medellín',
        habilidades: ['Cypress', 'Testing'],
        idiomas: ['Español', 'Inglés'],
      },
    ]).as('getPostulantesComponent');

    visitWithSession('/match', {
      perfilId: 'perfil-empresa-component',
      isEmpresa: 'true',
    });

    cy.get('app-vacantes-menu').should('exist');
    cy.get('app-swipe-empresa').should('exist');
    cy.contains('button', 'Selecciona una vacante').click();
    cy.wait('@getVacantesEmpresaComponent');
    cy.contains('button.dropdown-item', 'QA Automation').click();

    cy.window().then((win) => {
      expect(win.sessionStorage.getItem('vacante')).to.eq('vacante-match-component');
    });

    cy.contains('button', 'Carguemos Postulantes').click();
    cy.wait('@getPostulantesComponent');
    cy.contains('.card-name', 'Sofia QA').should('be.visible');
    cy.contains('.tag', 'Cypress').should('be.visible');
  });
});

