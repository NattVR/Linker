/// <reference types="cypress" />
import { runA11yAudit } from './a11y-utils';

export {};

describe('Accesibilidad - Hero', () => {
  it('debe cumplir accesibilidad en la pantalla hero', () => {
    cy.visit('/');
    cy.get('#home').should('be.visible');

    runA11yAudit('hero');
  });
});
