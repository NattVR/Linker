package com.linker.qa.ui;

import net.serenitybdd.core.annotations.findby.By;
import net.serenitybdd.core.pages.PageObject;
import net.serenitybdd.screenplay.targets.Target;

public class HomePage extends PageObject {

    public static final Target HERO_TITLE = Target.the("titulo principal del home")
        .located(By.xpath("//h1[contains(.,'Haz match')]"));

    public static final Target FEATURES_TITLE = Target.the("titulo de la seccion de beneficios")
        .located(By.xpath("//h2[contains(.,'¿Por qué')]"));

    public static final Target HEADER_LOGIN_BUTTON = Target.the("boton login del encabezado")
        .located(By.cssSelector("button.login-button"));
}
