/// <reference types="cypress" />

export {};

type SessionData = {
  token: string;
  userId: string;
  perfilId: string;
  isEmpresa: 'true' | 'false';
  vacante?: string;
};

const DEFAULT_SESSION: SessionData = {
  token: 'token-component',
  userId: 'user-component',
  perfilId: 'perfil-component',
  isEmpresa: 'false',
};

export const apiUrl = () => (Cypress.env('API_URL') as string) || 'http://localhost:3000';

export const visitWithSession = (
  path: string,
  overrides: Partial<SessionData> = {},
) => {
  const sessionData = { ...DEFAULT_SESSION, ...overrides };

  cy.visit(path, {
    onBeforeLoad(win) {
      win.sessionStorage.setItem('token', sessionData.token);
      win.sessionStorage.setItem('userId', sessionData.userId);
      win.sessionStorage.setItem('perfilId', sessionData.perfilId);
      win.sessionStorage.setItem('isEmpresa', sessionData.isEmpresa);

      if (sessionData.vacante) {
        win.sessionStorage.setItem('vacante', sessionData.vacante);
      }
    },
  });
};

export const mockPostulanteProfile = (perfilId = 'perfil-postulante-component') => {
  cy.intercept('GET', `${apiUrl()}/habilidades`, [
    { id_habilidad: 'hab-angular', nombre_habilidad: 'Angular' },
    { id_habilidad: 'hab-cypress', nombre_habilidad: 'Cypress' },
  ]).as('getHabilidadesComponent');

  cy.intercept('GET', `${apiUrl()}/idiomas`, [
    { id_idioma: 'idioma-es', nombre: 'Español' },
    { id_idioma: 'idioma-en', nombre: 'Inglés' },
  ]).as('getIdiomasComponent');

  cy.intercept('GET', `${apiUrl()}/postulante/${perfilId}`, {
    name: 'Camila',
    lastname: 'Component',
  }).as('getPostulanteComponent');

  cy.intercept('GET', `${apiUrl()}/postulante/perfil-completo/${perfilId}`, {
    curriculum: '',
    postulanteEstudios: [],
    postulanteHabilidades: [],
    postulanteIdiomas: [],
  }).as('getPerfilCompletoComponent');
};

export const mockEmpresaProfile = (userId = 'user-empresa-component', empresaId = 'empresa-component') => {
  cy.intercept('GET', `${apiUrl()}/empresa/${userId}`, {
    id: empresaId,
    name_empresa: 'Linker Componentes',
    sector: 'Tecnología',
    ubicacion: 'Bogotá',
    descripcion: 'Empresa usada para pruebas de componentes en Cypress',
  }).as('getEmpresaComponent');

  cy.intercept('GET', `${apiUrl()}/vacantes/empresaId/${empresaId}`, [
    {
      id_vacante: 'vacante-component',
      titulo: 'Frontend Angular',
      salario: 4500000,
      ubicacion: 'Remoto',
      modalidad: 'Remoto',
      tipo_trabajo: 'Full-time',
      habilidades: ['Angular', 'Cypress'],
      idiomas: ['Español'],
      empresa: {
        id_perfil: empresaId,
        name_empresa: 'Linker Componentes',
      },
    },
  ]).as('getVacantesEmpresaComponent');

  cy.intercept('GET', `${apiUrl()}/certificados`, [
    {
      id_certificado: 'cert-component',
      nombre_certificado: 'ISO Component',
      entidad_emisora: 'QA',
    },
  ]).as('getCatalogoCertificadosComponent');

  cy.intercept('GET', `${apiUrl()}/detalles-certificados/empresa/${empresaId}`, [
    {
      id_detalles_certificados: 'detalle-cert-component',
      fecha_emision: '2025-01-01',
      fecha_caducidad: '2027-01-01',
      certificado: {
        id_certificado: 'cert-component',
        nombre_certificado: 'ISO Component',
        entidad_emisora: 'QA',
      },
    },
  ]).as('getCertificadosEmpresaComponent');
};

