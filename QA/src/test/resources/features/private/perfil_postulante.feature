# language: es
Característica: Perfil privado del postulante
  Como usuario autenticado
  Quiero acceder a mi perfil privado
  Para gestionar mi informacion profesional

  @smoke @ui @private @postulante
  Escenario: Visualizar la ruta privada del perfil de postulante
    Dado que Camila inicia una sesion privada como postulante y navega a "/postulante"
    Entonces deberia visualizar el perfil privado del postulante
