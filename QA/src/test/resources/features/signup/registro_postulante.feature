# language: es
Característica: Registro de postulante
  Como visitante de Linker
  Quiero avanzar por el flujo de registro personal
  Para crear una cuenta como postulante

  @smoke @ui @signup
  Escenario: Visualizar el primer paso del registro de postulante
    Dado que Stephano navega a la pagina "/signup"
    Entonces deberia visualizar el formulario inicial de registro de postulante

  @ui @signup
  Escenario: Avanzar al segundo paso del registro de postulante
    Dado que Stephano navega a la pagina "/signup"
    Cuando avanza al segundo paso del registro de postulante con nombre "Stephano" y apellido "Mejia"
    Entonces deberia visualizar el formulario de credenciales del postulante

  @ui @signup
  Escenario: Volver al primer paso del registro de postulante
    Dado que Stephano navega a la pagina "/signup"
    Cuando avanza al segundo paso del registro de postulante con nombre "Stephano" y apellido "Mejia"
    Y regresa al primer paso del registro de postulante
    Entonces deberia visualizar el formulario inicial de registro de postulante
