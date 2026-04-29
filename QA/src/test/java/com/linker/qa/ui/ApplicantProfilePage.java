package com.linker.qa.ui;

import net.serenitybdd.core.annotations.findby.By;
import net.serenitybdd.core.pages.PageObject;
import net.serenitybdd.screenplay.targets.Target;

public class ApplicantProfilePage extends PageObject {

    public static final Target CV_SECTION = Target.the("seccion mi cv")
        .located(By.xpath("//span[normalize-space()='Mi CV']"));

    public static final Target EXPERIENCE_SELECT = Target.the("selector de experiencia")
        .located(By.cssSelector("select[formcontrolname='experiencia']"));

    public static final Target STUDY_TITLE_INPUT = Target.the("campo de titulo de estudio")
        .located(By.cssSelector("input[formcontrolname='titulo']"));

    public static final Target SAVE_BUTTON = Target.the("boton guardar perfil postulante")
        .located(By.cssSelector("button.btn-guardar"));
}
