/// <reference types="cypress" />
import { mockPerfilEmpresaApis, runA11yAudit, visitWithSession } from './a11y-utils';

export {};

describe('Accesibilidad - Perfil Empresa', () => {
  it('debe cumplir accesibilidaden perfil empresa', () => {
    const userId = 'user-empresa-a11y';
    const perfilId = 'perfil-empresa-a11y';

    mockPerfilEmpresaApis(userId, perfilId);
    visitWithSession('/empresa', {
      userId,
      perfilId,
      isEmpresa: 'true',
    });

    cy.get('.perfil-container').should('be.visible');
    cy.wait('@getEmpresaA11y');

    runA11yAudit('perfil-empresa');
  });
});
