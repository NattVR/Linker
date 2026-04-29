package com.linker.qa.ui;

import net.serenitybdd.core.annotations.findby.By;
import net.serenitybdd.core.pages.PageObject;
import net.serenitybdd.screenplay.targets.Target;

public class MatchPage extends PageObject {

    public static final Target MATCH_LAYOUT = Target.the("contenedor principal del modulo match")
        .located(By.cssSelector("section.layout-section"));

    public static final Target LOAD_VACANCIES_BUTTON = Target.the("boton para cargar vacantes")
        .located(By.xpath("//button[contains(.,'¡Carguemos Vacantes!')]"));

    public static final Target LOAD_APPLICANTS_BUTTON = Target.the("boton para cargar postulantes")
        .located(By.xpath("//button[contains(.,'¡Carguemos Postulantes!')]"));

    public static final Target VACANCY_SELECTOR_BUTTON = Target.the("selector de vacante")
        .located(By.cssSelector("button.dropdown-button"));
}
