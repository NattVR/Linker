# language: es
Característica: Perfil privado de empresa
  Como empresa autenticada
  Quiero acceder a mis rutas privadas
  Para administrar mi perfil, vacantes y certificados

  @smoke @ui @private @empresa
  Escenario: Visualizar la ruta privada del perfil de empresa
    Dado que Camila inicia una sesion privada como empresa y navega a "/empresa"
    Entonces deberia visualizar el perfil privado de empresa

  @ui @private @empresa
  Escenario: Cambiar a la gestion de certificados de empresa
    Dado que Camila inicia una sesion privada como empresa y navega a "/empresa"
    Cuando cambia a la pestana de certificados de empresa
    Entonces deberia visualizar la gestion de certificados de empresa
