/// <reference types="cypress" />
import 'cypress-axe';

export {};

type SessionData = {
  token: string;
  userId: string;
  perfilId: string;
  isEmpresa: 'true' | 'false';
};

const DEFAULT_SESSION: SessionData = {
  token: 'token-a11y',
  userId: 'user-a11y',
  perfilId: 'perfil-a11y',
  isEmpresa: 'false',
};

export const A11Y_RUN_OPTIONS = {
  runOnly: {
    type: 'tag' as const,
    values: ['wcag2a', 'wcag2aa'],
  },
};

export const runA11yAudit = (screenName: string) => {
  cy.injectAxe();
  cy.checkA11y(undefined, A11Y_RUN_OPTIONS, (violations) => {
    violations.forEach((violation) => {
      Cypress.log({
        name: 'a11y',
        message: `${violation.id}: ${violation.help} (${violation.nodes.length} nodos)`,
      });
    });

  });
};

export const visitWithSession = (
  path: string,
  overrides: Partial<SessionData> = {},
) => {
  const sessionData: SessionData = {
    ...DEFAULT_SESSION,
    ...overrides,
  };

  cy.visit(path, {
    onBeforeLoad() {
      sessionStorage.setItem('token', sessionData.token);
      sessionStorage.setItem('userId', sessionData.userId);
      sessionStorage.setItem('perfilId', sessionData.perfilId);
      sessionStorage.setItem('isEmpresa', sessionData.isEmpresa);
    },
  });
};

export const mockPerfilEmpresaApis = (userId: string, empresaId: string) => {
  const apiUrl = Cypress.env('API_URL') as string;

  cy.intercept('GET', `${apiUrl}/empresa/${userId}`, {
    id: empresaId,
    name_empresa: 'Empresa A11y',
    sector: 'Tecnologia',
    ubicacion: 'Bogota',
    descripcion: 'Perfil de empresa para pruebas de accesibilidad',
  }).as('getEmpresaA11y');

  cy.intercept('GET', `${apiUrl}/certificados`, []).as('getCatalogoCertificadosA11y');
  cy.intercept('GET', `${apiUrl}/detalles-certificados/empresa/${empresaId}`, []).as(
    'getCertificadosEmpresaA11y',
  );
};

export const mockPerfilPostulanteApis = (perfilId: string) => {
  const apiUrl = Cypress.env('API_URL') as string;

  cy.intercept('GET', `${apiUrl}/habilidades`, []).as('getHabilidadesA11y');
  cy.intercept('GET', `${apiUrl}/idiomas`, []).as('getIdiomasA11y');
  cy.intercept('GET', `${apiUrl}/postulante/${perfilId}`, {
    name: 'Usuario',
    lastname: 'A11y',
  }).as('getPostulanteA11y');
  cy.intercept('GET', `${apiUrl}/postulante/perfil-completo/${perfilId}`, {}).as(
    'getPerfilCompletoA11y',
  );
};
