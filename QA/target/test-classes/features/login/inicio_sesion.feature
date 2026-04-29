# language: es
Característica: Inicio de sesion
  Como usuario de Linker
  Quiero acceder a la pantalla de autenticacion
  Para ingresar a la plataforma

  @smoke @ui @login
  Escenario: Visualizar el formulario de inicio de sesion
    Dado que Melissa navega a la pantalla de login
    Cuando intenta iniciar su autenticacion
    Entonces deberia ver el mensaje de bienvenida "Bienvenido de nuevo"
    Y deberia ver el titulo "Iniciar Sesión" en el formulario
