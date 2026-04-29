/// <reference types="cypress" />

export {};

type EmpresaE2E = {
  userId: string;
  empresaId: string;
  email: string;
};

const crearEmpresaE2E = (): Cypress.Chainable<EmpresaE2E> => {
  const apiUrl = Cypress.env('API_URL') as string;
  const timestamp = Date.now();
  const email = `empresa.certificados.${timestamp}@linker-e2e.com`;

  return cy
    .request({
      method: 'POST',
      url: `${apiUrl}/user/registro`,
      body: {
        email,
        password: 'Password123',
        repassword: 'Password123',
      },
    })
    .then((userResponse) => {
      const userId = userResponse.body.user.id;

      return cy
        .request({
          method: 'POST',
          url: `${apiUrl}/empresa/registro`,
          body: {
            name_empresa: `Empresa Certificados ${timestamp}`,
            NIT: `CERT-${timestamp}`,
            id_perfil: userId,
          },
        })
        .then((empresaResponse) => ({
          userId,
          empresaId: empresaResponse.body.empresa.id,
          email,
        }));
    });
};

describe('Certificados empresa - Flujo completo', () => {
  let empresa: EmpresaE2E;
  let certificado: { id_certificado: string; nombre_certificado: string; entidad_emisora: string };

  beforeEach(() => {
    const apiUrl = Cypress.env('API_URL') as string;
    const timestamp = Date.now();

    crearEmpresaE2E().then((data) => {
      empresa = data;

      cy.request({
        method: 'POST',
        url: `${apiUrl}/certificados`,
        body: {
          nombre_certificado: `Certificado de excelencia Cypress ${timestamp}`,
          entidad_emisora: 'Linker QA',
        },
      }).then((certResponse) => {
        certificado = certResponse.body;

        cy.intercept('GET', `${apiUrl}/empresa/${empresa.userId}`).as('getEmpresa');
        cy.intercept('GET', `${apiUrl}/certificados`).as('getCatalogoCertificados');
        cy.intercept('GET', `${apiUrl}/detalles-certificados/empresa/${empresa.empresaId}`).as('getCertificadosEmpresa');

        cy.visit('/empresa', {
          onBeforeLoad(win) {
            (win as Window).sessionStorage.setItem('token', 'token-e2e');
            (win as Window).sessionStorage.setItem('userId', empresa.userId);
            (win as Window).sessionStorage.setItem('perfilId', empresa.empresaId);
            (win as Window).sessionStorage.setItem('isEmpresa', 'true');
          },
        });
      });
    });
  });

  describe('Crear certificado', () => {
    it('CA-CER-01 y CA-CER-02 debe publicar el certificado y mostrarlo en la lista', () => {
      const apiUrl = Cypress.env('API_URL') as string;

      cy.wait('@getEmpresa').its('response.statusCode').should('eq', 200);

      cy.contains('button', 'Certificados').click();
      cy.wait('@getCatalogoCertificados').its('response.statusCode').should('eq', 200);
      cy.wait('@getCertificadosEmpresa').its('response.statusCode').should('eq', 200);

      cy.contains('button', 'Agregar primer certificado').click();
      cy.contains('button', 'Seleccione un certificado').click();
      cy.contains('button.dropdown-item', certificado.nombre_certificado).click();

      cy.get('input[formcontrolname="fechaEmision"]').type('2025-01-01');
      cy.get('input[formcontrolname="fechaCaducidad"]').type('2027-01-01');

      cy.intercept('POST', `${apiUrl}/detalles-certificados`).as('crearCertificadoEmpresa');
      cy.contains('button', 'Agregar Certificado').click();

      cy.wait('@crearCertificadoEmpresa').then((interception) => {
        expect(interception.request.body).to.deep.equal({
          certificado: { id_certificado: certificado.id_certificado },
          empresa: { id: empresa.empresaId },
          fecha_emision: '2025-01-01',
          fecha_caducidad: '2027-01-01',
        });
        expect(interception.response?.statusCode).to.eq(201);
      });

      cy.get('.swal2-popup').should('be.visible');
      cy.contains('Certificado agregado').should('be.visible');
      cy.contains(certificado.nombre_certificado, { timeout: 10000 }).should('be.visible');
      cy.contains('Linker QA').should('be.visible');
    });

    it('CA-CER-03 debe validar campos obligatorios si la información está incompleta', () => {
      const apiUrl = Cypress.env('API_URL') as string;

      cy.wait('@getEmpresa').its('response.statusCode').should('eq', 200);

      cy.contains('button', 'Certificados').click();
      cy.wait('@getCatalogoCertificados').its('response.statusCode').should('eq', 200);
      cy.wait('@getCertificadosEmpresa').its('response.statusCode').should('eq', 200);

      cy.contains('button', 'Agregar primer certificado').click();
      cy.intercept('POST', `${apiUrl}/detalles-certificados`).as('crearCertificadoEmpresa');
      cy.contains('button', 'Agregar Certificado').click();

      cy.get('@crearCertificadoEmpresa.all').should('have.length', 0);
      cy.get('.swal2-popup').should('be.visible');
      cy.contains('Selecciona un certificado').should('be.visible');
    });
  });
});