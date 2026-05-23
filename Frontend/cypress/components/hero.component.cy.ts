/// <reference types="cypress" />

export {};

describe('Componentes - Hero', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('debe renderizar el hero con mensaje principal, acciones e imagen', () => {
    cy.get('#home').should('be.visible');
    cy.contains('h1', 'Haz match').should('be.visible');
    cy.contains('p', 'La red profesional').should('be.visible');
    cy.contains('button', 'Crea tu perfil').should('be.visible');
    cy.contains('button', 'Explorar comunidad').should('be.visible');
    cy.get('.hero-image img').should('be.visible').and('have.attr', 'alt', 'Hero');
  });

  it('debe mostrar las tarjetas de beneficios de Linker', () => {
    cy.get('#features').should('be.visible');
    cy.get('.feature-card').should('have.length', 3);
    cy.contains('.feature-card', 'Swipes Inteligente').should('be.visible');
    cy.contains('.feature-card', 'Matchs Favoritos').should('be.visible');
    cy.contains('.feature-card', 'Perfiles Profesionales').should('be.visible');
  });

  it('debe mostrar el llamado a la accion final', () => {
    cy.get('#cta').should('be.visible');
    cy.contains('h2', 'Listo para expandir tu red').should('be.visible');
    cy.contains('button', 'Comienza ahora').should('be.visible');
  });
});

