package com.linker.qa.ui;

import net.serenitybdd.core.annotations.findby.By;
import net.serenitybdd.core.pages.PageObject;
import net.serenitybdd.screenplay.targets.Target;

public class CompanyProfilePage extends PageObject {

    public static final Target EDIT_PROFILE_BUTTON = Target.the("boton editar perfil empresa")
        .located(By.xpath("//button[contains(.,'Editar Perfil')]"));

    public static final Target VACANCIES_TAB = Target.the("tab vacantes")
        .located(By.xpath("//button[contains(.,'Vacantes')]"));

    public static final Target CERTIFICATES_TAB = Target.the("tab certificados")
        .located(By.xpath("//button[contains(.,'Certificados')]"));

    public static final Target STATISTICS_TAB = Target.the("tab estadisticas")
        .located(By.xpath("//button[contains(.,'Estadisticas')]"));

    public static final Target PUBLISH_JOB_BUTTON = Target.the("boton publicar vacante")
        .located(By.cssSelector("button.publish-button"));

    public static final Target NEW_CERTIFICATE_BUTTON = Target.the("boton nuevo certificado")
        .located(By.xpath("//button[contains(.,'Nuevo Certificado')]"));
}
