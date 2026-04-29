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
  const email = `empresa.vacantes.${timestamp}@linker-e2e.com`;

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
            name_empresa: `Empresa Vacantes ${timestamp}`,
            NIT: `VAC-${timestamp}`,
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

describe('Vacantes empresa - Flujo completo', () => {
  let empresa: EmpresaE2E;

  beforeEach(() => {
    const apiUrl = Cypress.env('API_URL') as string;

    crearEmpresaE2E().then((data) => {
      empresa = data;

      cy.intercept('GET', `${apiUrl}/empresa/${empresa.userId}`).as('getEmpresa');
      cy.intercept('GET', `${apiUrl}/vacantes/empresaId/${empresa.empresaId}`).as('getVacantesEmpresa');

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

  describe('Crear vacante', () => {
    it('CA-VAC-01 y CA-VAC-02 debe crear una vacante y mostrarla en el listado', () => {
      const apiUrl = Cypress.env('API_URL') as string;
      const titulo = `QA Automation Cypress ${Date.now()}`;

      cy.wait('@getEmpresa').its('response.statusCode').should('eq', 200);

      cy.get('input[formcontrolname="titulo"]').type(titulo);
      cy.get('input[formcontrolname="salario"]').type('4500000');
      cy.get('input[formcontrolname="ubicacion"]').type('Bogota');
      cy.get('select[formcontrolname="modalidad"]').select('Remoto');
      cy.get('select[formcontrolname="tipo_trabajo"]').select('Full-time');

      cy.intercept('POST', `${apiUrl}/vacantes`).as('crearVacante');
      cy.contains('button', 'PUBLICAR VACANTE').click();

      cy.wait('@crearVacante').then((interception) => {
        expect(interception.request.body).to.deep.equal({
          titulo,
          salario: 4500000,
          ubicacion: 'Bogota',
          modalidad: 'Remoto',
          tipo_trabajo: 'Full-time',
          vacanteHabilidades: [],
          vacantesIdiomas: [],
          empresa: empresa.empresaId,
        });
        expect(interception.response?.statusCode).to.eq(201);
        expect(interception.response?.body.id_vacante).to.be.a('string');
      });

      cy.wait('@getVacantesEmpresa').its('response.statusCode').should('eq', 200);
      cy.contains(titulo, { timeout: 10000 }).should('be.visible');
      cy.contains('$4500000').should('be.visible');
      cy.contains('Bogota').should('be.visible');
      cy.contains('Remoto').should('be.visible');
      cy.contains('Full-time').should('be.visible');
    });

    it('CA-VAC-03 debe validar campos obligatorios si la información está incompleta', () => {
      const apiUrl = Cypress.env('API_URL') as string;

      cy.wait('@getEmpresa').its('response.statusCode').should('eq', 200);

      cy.intercept('POST', `${apiUrl}/vacantes`).as('crearVacante');
      cy.contains('button', 'PUBLICAR VACANTE').click();

      cy.get('@crearVacante.all').should('have.length', 0);
      cy.get('.swal2-popup').should('be.visible');
      cy.contains('Campos obligatorios incompletos').should('be.visible');
    });
  });
});