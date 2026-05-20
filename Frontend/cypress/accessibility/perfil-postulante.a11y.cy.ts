/// <reference types="cypress" />
import { mockPerfilPostulanteApis, runA11yAudit, visitWithSession } from './a11y-utils';

export {};

describe('Accesibilidad - Perfil Postulante', () => {
  it('debe cumplir accesibilidad en perfil postulante', () => {
    const perfilId = 'perfil-postulante-a11y';

    mockPerfilPostulanteApis(perfilId);
    visitWithSession('/postulante', {
      perfilId,
      isEmpresa: 'false',
    });

    cy.get('.perfil-container').should('be.visible');
    cy.wait('@getHabilidadesA11y');
    cy.wait('@getIdiomasA11y');
    cy.wait('@getPostulanteA11y');
    cy.wait('@getPerfilCompletoA11y');

    runA11yAudit('perfil-postulante');
  });
});
