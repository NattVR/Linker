# language: es
Característica: Match privado de empresa
  Como empresa autenticada
  Quiero acceder al modulo de match
  Para explorar postulantes por vacante

  @smoke @ui @private @match @empresa
  Escenario: Visualizar la ruta privada de match para empresa
    Dado que Camila inicia una sesion privada como empresa y navega a "/match"
    Entonces deberia visualizar el match privado para empresa
