/// <reference types="cypress" />

export { };

const BASE_URL = Cypress.config('baseUrl') || 'http://localhost:4200';

const visitLogin = () => {
    cy.visit(`${BASE_URL}/login`);
};

const fillLoginForm = (email: string, password: string) => {
    cy.get('input[type="email"]').clear().type(email);
    cy.get('input[type="password"]').clear().type(password);
};

const submitLogin = () => {
    cy.get('button[type="submit"], .form-group button').last().click();
};

const stubSuccessfulLogin = (isEmpresa = false) => {
    cy.intercept('POST', '**/user/login', {
        statusCode: 201,
        body: {
            success: true,
            message: 'Inicio de sesión exitoso',
            token: 'mock-jwt-token',
            user: { id: 'user-1' },
        },
    }).as('loginCall');

    cy.intercept('GET', '**/empresa/isEmpresa/**', {
        statusCode: 200,
        body: isEmpresa,
    }).as('isEmpresaCall');

    cy.intercept('GET', '**/user/perfil/**', {
        statusCode: 200,
        body: { id: 'perfil-1' },
    }).as('perfilCall');
};

describe('Login - Flujo completo', () => {
    beforeEach(() => {
        visitLogin();
        cy.window().then((win) => win.sessionStorage.clear());
    });

    describe('Renderizado del formulario', () => {
        it('debe mostrar el título de bienvenida', () => {
            cy.contains('h1', 'Bienvenido de nuevo').should('be.visible');
            cy.contains('h2', 'Iniciar Sesión').should('be.visible');
        });

        it('debe mostrar el campo de email', () => {
            cy.get('input[type="email"]')
                .should('be.visible')
                .and('have.attr', 'placeholder', 'Ingresa tu email');
        });

        it('debe mostrar el campo de contraseña', () => {
            cy.get('input[type="password"]')
                .should('be.visible')
                .and('have.attr', 'placeholder', 'Ingresa tu contraseña');
        });

        it('debe mostrar el botón de submit', () => {
            cy.contains('button', 'Iniciar sesión').should('be.visible');
        });

        it('debe mostrar el enlace de registro', () => {
            cy.contains('a', '¿Es tu primera vez? Regístrate')
                .should('be.visible')
                .and('have.attr', 'href', '/signup');
        });

        it('debe mostrar el enlace de contraseña olvidada', () => {
            cy.contains('a', '¿Olvidaste tu contraseña?').should('be.visible');
        });
    });

    describe('Validaciones del formulario', () => {
        it('envía la solicitud aunque el email esté vacío y permanece en login si falla', () => {
            cy.intercept('POST', '**/user/login', {
                statusCode: 400,
                body: { message: 'Credenciales inválidas' },
            }).as('loginCall');

            cy.get('input[type="password"]').type('TestPassword123');
            submitLogin();

            cy.wait('@loginCall').then((interception) => {
                expect(interception.request.body).to.deep.equal({
                    email: '',
                    password: 'TestPassword123',
                });
            });
            cy.url().should('include', '/login');
        });

        it('envía la solicitud aunque la contraseña esté vacía y permanece en login si falla', () => {
            cy.intercept('POST', '**/user/login', {
                statusCode: 400,
                body: { message: 'Credenciales inválidas' },
            }).as('loginCall');

            cy.get('input[type="email"]').type('test@linker.com');
            submitLogin();

            cy.wait('@loginCall').then((interception) => {
                expect(interception.request.body).to.deep.equal({
                    email: 'test@linker.com',
                    password: '',
                });
            });
            cy.url().should('include', '/login');
        });

        it('envía la solicitud aunque el email tenga formato inválido y permanece en login si falla', () => {
            cy.intercept('POST', '**/user/login', {
                statusCode: 400,
                body: { message: 'Credenciales inválidas' },
            }).as('loginCall');

            fillLoginForm('emailinvalido', 'TestPassword123');
            submitLogin();

            cy.wait('@loginCall').then((interception) => {
                expect(interception.request.body).to.deep.equal({
                    email: 'emailinvalido',
                    password: 'TestPassword123',
                });
            });
            cy.url().should('include', '/login');
        });
    });

    describe('Login fallido', () => {
        it('debe mostrar error con credenciales incorrectas', () => {
            cy.intercept('POST', '**/user/login', {
                statusCode: 400,
                body: { message: 'Credenciales inválidas' },
            }).as('loginCall');

            fillLoginForm('noexiste@linker.com', 'claveincorrecta');
            submitLogin();

            cy.wait('@loginCall').its('response.statusCode').should('eq', 400);
            cy.get('.swal2-popup').should('be.visible');
            cy.contains('Error en la solicitud').should('be.visible');
        });

        it('no debe guardar token si el login falla', () => {
            cy.intercept('POST', '**/user/login', {
                statusCode: 400,
                body: { message: 'Credenciales inválidas' },
            }).as('loginCall');

            fillLoginForm('noexiste@linker.com', 'claveincorrecta');
            submitLogin();
            cy.wait('@loginCall');

            cy.window().then((win: Window) => {
                expect(win.sessionStorage.getItem('token')).to.be.null;
                expect(win.sessionStorage.getItem('userId')).to.be.null;
                expect(win.sessionStorage.getItem('perfilId')).to.be.null;
            });
        });

        it('no debe redirigir si el login falla', () => {
            cy.intercept('POST', '**/user/login', {
                statusCode: 400,
                body: { message: 'Credenciales inválidas' },
            }).as('loginCall');

            fillLoginForm('noexiste@linker.com', 'claveincorrecta');
            submitLogin();
            cy.wait('@loginCall');

            cy.url().should('include', '/login');
        });
    });

    describe('Login exitoso', () => {
        it('debe llamar al endpoint correcto con los datos del formulario', () => {
            stubSuccessfulLogin(false);

            fillLoginForm('test@linker.com', 'TestPassword123');
            submitLogin();

            cy.wait('@loginCall').then((interception) => {
                expect(interception.request.body).to.deep.equal({
                    email: 'test@linker.com',
                    password: 'TestPassword123',
                });
                expect(interception.response?.statusCode).to.eq(201);
            });
            cy.wait('@isEmpresaCall');
            cy.wait('@perfilCall');
        });

        it('debe guardar el token, userId, isEmpresa y perfilId en sessionStorage', () => {
            stubSuccessfulLogin(false);

            fillLoginForm('test@linker.com', 'TestPassword123');
            submitLogin();

            cy.wait('@loginCall');
            cy.wait('@isEmpresaCall');
            cy.wait('@perfilCall');

            cy.window().then((win: Window) => {
                expect(win.sessionStorage.getItem('token')).to.eq('mock-jwt-token');
                expect(win.sessionStorage.getItem('userId')).to.eq('user-1');
                expect(win.sessionStorage.getItem('perfilId')).to.eq('perfil-1');
                expect(win.sessionStorage.getItem('isEmpresa')).to.eq('false');
            });
        });

        it('debe redirigir a /match tras login exitoso', () => {
            stubSuccessfulLogin(false);

            fillLoginForm('test@linker.com', 'TestPassword123');
            submitLogin();

            cy.wait('@loginCall');
            cy.wait('@isEmpresaCall');
            cy.wait('@perfilCall');
            cy.url({ timeout: 10000 }).should('include', '/match');
        });

        it('debe mostrar alerta de éxito', () => {
            stubSuccessfulLogin(false);

            fillLoginForm('test@linker.com', 'TestPassword123');
            submitLogin();

            cy.wait('@loginCall');
            cy.get('.swal2-popup').should('be.visible');
            cy.contains('Inicio de sesión exitoso').should('be.visible');
        });
    });

    describe('Navegación', () => {
        it('el enlace de registro debe llevar a /signup', () => {
            cy.contains('a', '¿Es tu primera vez? Regístrate').click();
            cy.url().should('include', '/signup');
        });
    });
});
