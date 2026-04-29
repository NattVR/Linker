# language: es
Característica: Navegacion inicial del sitio
  Como visitante de Linker
  Quiero recorrer la portada principal
  Para acceder a las opciones publicas de la plataforma

  @smoke @ui @home
  Escenario: Visualizar la portada principal
    Dado que Nathalia navega a la pagina "/"
    Entonces deberia visualizar la portada principal de Linker

  @ui @home
  Escenario: Navegar al login desde el encabezado
    Dado que Nathalia navega a la pagina "/"
    Cuando selecciona la opcion de login del encabezado
    Entonces deberia terminar en la ruta "/login"

  @ui @home
  Escenario: Redirigir al inicio cuando la ruta no existe
    Dado que Nathalia navega a la pagina "/ruta-inexistente"
    Entonces deberia terminar en la ruta "/"
