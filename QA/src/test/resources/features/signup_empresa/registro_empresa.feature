# language: es
Característica: Registro de empresa
  Como reclutador en Linker
  Quiero avanzar por el flujo de registro empresarial
  Para crear una cuenta de empresa

  @smoke @ui @signup-empresa
  Escenario: Visualizar el primer paso del registro de empresa
    Dado que Gabo navega a la pagina "/signup-empresa"
    Entonces deberia visualizar el formulario inicial de registro de empresa

  @ui @signup-empresa
  Escenario: Avanzar al segundo paso del registro de empresa
    Dado que Gabo navega a la pagina "/signup-empresa"
    Cuando avanza al segundo paso del registro de empresa con nombre "Linker SAS" y NIT "900123456"
    Entonces deberia visualizar el formulario de credenciales de empresa

  @ui @signup-empresa
  Escenario: Volver al primer paso del registro de empresa
    Dado que Gabo navega a la pagina "/signup-empresa"
    Cuando avanza al segundo paso del registro de empresa con nombre "Linker SAS" y NIT "900123456"
    Y regresa al primer paso del registro de empresa
    Entonces deberia visualizar el formulario inicial de registro de empresa
