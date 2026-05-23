/// <reference types="cypress" />

import {
  apiUrl,
  mockEmpresaProfile,
  mockPostulanteProfile,
  visitWithSession,
} from './component-utils';

export {};

describe('Componentes - Perfiles', () => {
  it('debe renderizar y actualizar el perfil de empresa', () => {
    mockEmpresaProfile('user-empresa-component', 'empresa-component');
    cy.intercept('PATCH', `${apiUrl()}/empresa/user-empresa-component`, {
      statusCode: 200,
      body: { ok: true },
    }).as('patchEmpresaComponent');

    visitWithSession('/empresa', {
      userId: 'user-empresa-component',
      perfilId: 'empresa-component',
      isEmpresa: 'true',
    });

    cy.wait('@getEmpresaComponent');
    cy.contains('.nombre', 'Linker Componentes').should('be.visible');
    cy.contains('.company-type', 'Tecnología').should('be.visible');
    cy.contains('.description', 'Empresa usada para pruebas').should('be.visible');

    cy.contains('button', 'Editar Perfil').click();
    cy.get('input[formcontrolname="name_empresa"]').clear().type('Linker QA Component');
    cy.get('input[formcontrolname="sector"]').clear().type('Calidad');
    cy.get('input[formcontrolname="ubicacion"]').clear().type('Remoto');
    cy.get('input[formcontrolname="descripcion"]').clear().type('Perfil actualizado desde Cypress');
    cy.contains('button', 'Guardar').click();

    cy.wait('@patchEmpresaComponent').its('request.body').should('deep.equal', {
      name_empresa: 'Linker QA Component',
      sector: 'Calidad',
      ubicacion: 'Remoto',
      descripcion: 'Perfil actualizado desde Cypress',
    });
  });

  it('debe cambiar entre vacantes, certificados y estadisticas del perfil empresa', () => {
    mockEmpresaProfile('user-empresa-component', 'empresa-component');

    visitWithSession('/empresa', {
      userId: 'user-empresa-component',
      perfilId: 'empresa-component',
      isEmpresa: 'true',
    });

    cy.wait('@getEmpresaComponent');
    cy.contains('button', 'Publicadas').click();
    cy.wait('@getVacantesEmpresaComponent');
    cy.contains('.vacante-card', 'Frontend Angular').should('be.visible');

    cy.contains('button.divider-btn', 'Certificados').click();
    cy.wait('@getCatalogoCertificadosComponent');
    cy.wait('@getCertificadosEmpresaComponent');
    cy.contains('.certificado-card', 'ISO Component').should('be.visible');

    cy.contains('button.divider-btn', 'Estadisticas').click();
    cy.contains('Estad').should('be.visible');
  });

  it('debe renderizar el perfil postulante y guardar secciones del formulario', () => {
    const perfilId = 'perfil-postulante-component';

    mockPostulanteProfile(perfilId);
    cy.intercept('PATCH', `${apiUrl()}/postulante/${perfilId}`, { statusCode: 200, body: {} }).as(
      'patchPostulanteComponent',
    );
    cy.intercept('DELETE', `${apiUrl()}/postulante/limpiar/${perfilId}`, {
      statusCode: 200,
      body: {},
    }).as('deletePerfilPostulanteComponent');
    cy.intercept('POST', `${apiUrl()}/estudios`, {
      statusCode: 201,
      body: { id_estudio: 'estudio-component' },
    }).as('postEstudioComponent');
    cy.intercept('POST', `${apiUrl()}/detalle-estudios`, {
      statusCode: 201,
      body: {},
    }).as('postDetalleEstudioComponent');
    cy.intercept('POST', `${apiUrl()}/postulante-habilidades`, {
      statusCode: 201,
      body: {},
    }).as('postHabilidadComponent');
    cy.intercept('POST', `${apiUrl()}/postulante-idiomas`, {
      statusCode: 201,
      body: {},
    }).as('postIdiomaComponent');

    visitWithSession('/postulante', {
      perfilId,
      isEmpresa: 'false',
    });

    cy.wait('@getHabilidadesComponent');
    cy.wait('@getIdiomasComponent');
    cy.wait('@getPostulanteComponent');
    cy.wait('@getPerfilCompletoComponent');

    cy.contains('.nombre', 'Camila Component').should('be.visible');
    cy.get('select[formcontrolname="experiencia"]').select('3');
    cy.get('#cv').selectFile(
      {
        contents: Cypress.Buffer.from('CV de prueba'),
        fileName: 'cv-component.pdf',
        mimeType: 'application/pdf',
      },
      { force: true },
    );
    cy.get('input[formcontrolname="titulo"]').type('Ingeniería de Software');
    cy.get('select[formcontrolname="nivel"]').select('Universitario');
    cy.get('select[aria-label="Seleccionar habilidad"]').select('hab-angular');
    cy.get('select[aria-label="Seleccionar idioma"]').select('idioma-en');
    cy.contains('button', 'Guardar').click();

    cy.wait('@patchPostulanteComponent').its('request.body').should('deep.equal', {
      experiencia: '3',
      cv: 'cv-component.pdf',
    });
    cy.wait('@deletePerfilPostulanteComponent');
    cy.wait('@postEstudioComponent');
    cy.wait('@postDetalleEstudioComponent');
    cy.wait('@postHabilidadComponent');
    cy.wait('@postIdiomaComponent');
    cy.url({ timeout: 10000 }).should('include', '/match');
  });
});
