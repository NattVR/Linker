// /// <reference types="cypress" />

// before(() => {
//   cy.env(['API_URL', 'TEST_EMAIL', 'TEST_PASSWORD']).then((vars) => {
//     cy.request({
//       method: 'POST',
//       url: `${vars['API_URL']}/user/registro`,
//       body: {
//         email: vars['TEST_EMAIL'],
//         password: vars['TEST_PASSWORD'],
//         nombre: 'Test',
//         apellido: 'Cypress',
//         isEmpresa: false,
//       },
//       failOnStatusCode: false,
//     });
//   });
// });

// describe('Login - Flujo completo', () => {

//   beforeEach(() => {
//     cy.visit('/login');
//   });

//   describe('Renderizado del formulario', () => {

//     it('debe mostrar el título de bienvenida', () => {
//       cy.contains('h1', 'Bienvenido de nuevo').should('be.visible');
//       cy.contains('h2', 'Iniciar Sesión').should('be.visible');
//     });

//     it('debe mostrar el campo de email', () => {
//       cy.get('input[type="email"]')
//         .should('be.visible')
//         .and('have.attr', 'placeholder', 'Ingresa tu email');
//     });

//     it('debe mostrar el campo de contraseña', () => {
//       cy.get('input[type="password"]')
//         .should('be.visible')
//         .and('have.attr', 'placeholder', 'Ingresa tu contraseña');
//     });

//     it('debe mostrar el botón de submit', () => {
//       cy.get('button[type="submit"]')
//         .should('be.visible')
//         .and('contain', 'Iniciar sesión');
//     });

//     it('debe mostrar el enlace de registro', () => {
//       cy.contains('a', '¿Es tu primera vez? Regístrate')
//         .should('be.visible')
//         .and('have.attr', 'href', '/signup');
//     });

//     it('debe mostrar el enlace de contraseña olvidada', () => {
//       cy.contains('a', '¿Olvidaste tu contraseña?').should('be.visible');
//     });
//   });

//   describe('Validaciones del formulario', () => {

//     it('no debe llamar al backend si el email está vacío', () => {
//       cy.env(['API_URL', 'TEST_PASSWORD']).then((vars) => {
//         cy.intercept('POST', `${vars['API_URL']}/user/login`).as('loginCall');
//         cy.get('input[type="password"]').type(vars['TEST_PASSWORD']);
//         cy.get('button[type="submit"]').click();
//         cy.get('@loginCall.all').should('have.length', 0);
//       });
//     });

//     it('no debe llamar al backend si la contraseña está vacía', () => {
//       cy.env(['API_URL', 'TEST_EMAIL']).then((vars) => {
//         cy.intercept('POST', `${vars['API_URL']}/user/login`).as('loginCall');
//         cy.get('input[type="email"]').type(vars['TEST_EMAIL']);
//         cy.get('button[type="submit"]').click();
//         cy.get('@loginCall.all').should('have.length', 0);
//       });
//     });

//     it('no debe llamar al backend si el email tiene formato inválido', () => {
//       cy.env(['API_URL', 'TEST_PASSWORD']).then((vars) => {
//         cy.intercept('POST', `${vars['API_URL']}/user/login`).as('loginCall');
//         cy.get('input[type="email"]').type('emailinvalido');
//         cy.get('input[type="password"]').type(vars['TEST_PASSWORD']);
//         cy.get('button[type="submit"]').click();
//         cy.get('@loginCall.all').should('have.length', 0);
//       });
//     });
//   });

//   describe('Login fallido', () => {

//     it('debe mostrar error con credenciales incorrectas', () => {
//       cy.env(['API_URL']).then((vars) => {
//         cy.intercept('POST', `${vars['API_URL']}/user/login`).as('loginCall');
//         cy.get('input[type="email"]').type('noexiste@linker.com');
//         cy.get('input[type="password"]').type('claveincorrecta');
//         cy.get('button[type="submit"]').click();
//         cy.wait('@loginCall').its('response.statusCode').should('eq', 400);
//         cy.get('.swal2-popup').should('be.visible');
//         cy.contains('Error en la solicitud').should('be.visible');
//       });
//     });

//     it('debe mostrar error con contraseña incorrecta para usuario existente', () => {
//       cy.env(['API_URL', 'TEST_EMAIL']).then((vars) => {
//         cy.intercept('POST', `${vars['API_URL']}/user/login`).as('loginCall');
//         cy.get('input[type="email"]').type(vars['TEST_EMAIL']);
//         cy.get('input[type="password"]').type('clavemal123');
//         cy.get('button[type="submit"]').click();
//         cy.wait('@loginCall').its('response.statusCode').should('eq', 400);
//         cy.get('.swal2-popup').should('be.visible');
//       });
//     });

//     it('no debe guardar token si el login falla', () => {
//       cy.get('input[type="email"]').type('noexiste@linker.com');
//       cy.get('input[type="password"]').type('claveincorrecta');
//       cy.get('button[type="submit"]').click();
//       cy.window().then((win: Window) => {
//         expect(win.sessionStorage.getItem('token')).to.be.null;
//         expect(win.sessionStorage.getItem('userId')).to.be.null;
//       });
//     });

//     it('no debe redirigir si el login falla', () => {
//       cy.get('input[type="email"]').type('noexiste@linker.com');
//       cy.get('input[type="password"]').type('claveincorrecta');
//       cy.get('button[type="submit"]').click();
//       cy.url().should('include', '/login');
//     });
//   });

//   describe('Login exitoso', () => {

//     it('debe llamar al endpoint correcto con los datos del formulario', () => {
//       cy.env(['API_URL', 'TEST_EMAIL', 'TEST_PASSWORD']).then((vars) => {
//         cy.intercept('POST', `${vars['API_URL']}/user/login`).as('loginCall');
//         cy.get('input[type="email"]').type(vars['TEST_EMAIL']);
//         cy.get('input[type="password"]').type(vars['TEST_PASSWORD']);
//         cy.get('button[type="submit"]').click();
//         cy.wait('@loginCall').then(interception => {
//           expect(interception.request.body).to.deep.equal({
//             email: vars['TEST_EMAIL'],
//             password: vars['TEST_PASSWORD'],
//           });
//           expect(interception.response?.statusCode).to.eq(201);
//         });
//       });
//     });

//     it('debe guardar el token en sessionStorage', () => {
//       cy.env(['TEST_EMAIL', 'TEST_PASSWORD']).then((vars) => {
//         cy.get('input[type="email"]').type(vars['TEST_EMAIL']);
//         cy.get('input[type="password"]').type(vars['TEST_PASSWORD']);
//         cy.get('button[type="submit"]').click();
//         cy.window().then((win: Window) => {
//           expect(win.sessionStorage.getItem('token')).to.not.be.null;
//         });
//       });
//     });

//     it('debe guardar el userId en sessionStorage', () => {
//       cy.env(['TEST_EMAIL', 'TEST_PASSWORD']).then((vars) => {
//         cy.get('input[type="email"]').type(vars['TEST_EMAIL']);
//         cy.get('input[type="password"]').type(vars['TEST_PASSWORD']);
//         cy.get('button[type="submit"]').click();
//         cy.window().then((win: Window) => {
//           expect(win.sessionStorage.getItem('userId')).to.not.be.null;
//         });
//       });
//     });

//     it('debe redirigir a /match tras login exitoso', () => {
//       cy.env(['TEST_EMAIL', 'TEST_PASSWORD']).then((vars) => {
//         cy.get('input[type="email"]').type(vars['TEST_EMAIL']);
//         cy.get('input[type="password"]').type(vars['TEST_PASSWORD']);
//         cy.get('button[type="submit"]').click();
//         cy.url({ timeout: 10000 }).should('include', '/match');
//       });
//     });

//     it('debe mostrar alerta de éxito', () => {
//       cy.env(['TEST_EMAIL', 'TEST_PASSWORD']).then((vars) => {
//         cy.get('input[type="email"]').type(vars['TEST_EMAIL']);
//         cy.get('input[type="password"]').type(vars['TEST_PASSWORD']);
//         cy.get('button[type="submit"]').click();
//         cy.get('.swal2-popup').should('be.visible');
//         cy.contains('Inicio de sesión exitoso').should('be.visible');
//       });
//     });
//   });

//   describe('Navegación', () => {

//     it('el enlace de registro debe llevar a /signup', () => {
//       cy.contains('a', '¿Es tu primera vez? Regístrate').click();
//       cy.url().should('include', '/signup');
//     });
//   });
// });