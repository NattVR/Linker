# language: es
Característica: Match privado del postulante
  Como postulante autenticado
  Quiero acceder al modulo de match
  Para explorar vacantes disponibles

  @smoke @ui @private @match @postulante
  Escenario: Visualizar la ruta privada de match para postulante
    Dado que Camila inicia una sesion privada como postulante y navega a "/match"
    Entonces deberia visualizar el match privado para postulante
