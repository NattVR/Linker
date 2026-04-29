# Linker QA con Serenity BDD

Este modulo deja configurada una base de automatizacion BDD con:

- Serenity BDD para reportes y orquestacion
- Cucumber + Gherkin para escenarios funcionales
- Screenplay para modelar actores, tareas y preguntas
- WebDriver para UI
- Screenplay REST listo para futuras pruebas API

## Estructura base

```text
QA
├── pom.xml
├── serenity.conf
└── src
    └── test
        ├── java
        │   └── com/linker/qa
        │       ├── hooks
        │       ├── questions
        │       ├── runners
        │       ├── stepdefinitions
        │       ├── tasks
        │       └── ui
        └── resources
            └── features
```

## Ejecutar pruebas

Requisitos esperados:

- Java 17
- Maven 3.9+
- Google Chrome instalado

Comandos:

```bash
cd QA
mvn clean verify
```

Para usar el ambiente de docker de pruebas:

```bash
cd QA
mvn clean verify -Denvironment=test
```

Para filtrar escenarios por tags:

```bash
cd QA
mvn clean verify -Dcucumber.filter.tags="@smoke"
```

Para apuntar a otra URL del frontend:

```bash
cd QA
mvn clean verify -Dqa.base.url=http://localhost:4201
```

## Convenciones recomendadas

- `features`: escenarios escritos en Gherkin
- `stepdefinitions`: mapeo Given/When/Then
- `tasks`: acciones del actor
- `questions`: validaciones legibles
- `ui`: paginas y `Target`

## Siguiente paso sugerido

Extender las rutas privadas con acciones de negocio reales, como guardar perfil, publicar vacantes, cargar tarjetas de match o crear certificados, y sumar validaciones API usando `restapi.baseurl`.
