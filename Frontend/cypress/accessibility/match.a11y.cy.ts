/// <reference types="cypress" />
import { runA11yAudit, visitWithSession } from './a11y-utils';

export {};

describe('Accesibilidad - Match', () => {
  it('debe cumplir accesibilidad en match', () => {
    visitWithSession('/match', {
      isEmpresa: 'false',
    });

    cy.get('.layout-section').should('be.visible');
    cy.get('app-swipe').should('exist');

    runA11yAudit('match');
  });
});
