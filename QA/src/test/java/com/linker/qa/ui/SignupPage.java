package com.linker.qa.ui;

import net.serenitybdd.core.annotations.findby.By;
import net.serenitybdd.core.pages.PageObject;
import net.serenitybdd.screenplay.targets.Target;

public class SignupPage extends PageObject {

    public static final Target PAGE_TITLE = Target.the("titulo del registro de postulante")
        .located(By.xpath("//h2[normalize-space()='Regístrate']"));

    public static final Target COMPANY_SIGNUP_LINK = Target.the("enlace al registro de empresas")
        .located(By.cssSelector("a[routerlink='/signup-empresa']"));

    public static final Target LOGIN_LINK = Target.the("enlace para iniciar sesion desde registro")
        .located(By.cssSelector("a[routerlink='/login']"));

    public static final Target PERSONAL_STEP_LABEL = Target.the("etiqueta del paso datos personales")
        .located(By.xpath("//span[normalize-space()='Datos Personales']"));

    public static final Target CREDENTIALS_STEP_LABEL = Target.the("etiqueta del paso credenciales")
        .located(By.xpath("//span[normalize-space()='Credenciales']"));

    public static final Target NAME_INPUT = Target.the("campo nombres")
        .located(By.cssSelector("input[formcontrolname='name']"));

    public static final Target LASTNAME_INPUT = Target.the("campo apellidos")
        .located(By.cssSelector("input[formcontrolname='lastname']"));

    public static final Target EMAIL_INPUT = Target.the("campo email del registro")
        .located(By.cssSelector("input[formcontrolname='email']"));

    public static final Target PASSWORD_INPUT = Target.the("campo contrasena del registro")
        .located(By.cssSelector("input[formcontrolname='password']"));

    public static final Target REPASSWORD_INPUT = Target.the("campo confirmar contrasena")
        .located(By.cssSelector("input[formcontrolname='repassword']"));

    public static final Target CONTINUE_BUTTON = Target.the("boton continuar del registro")
        .located(By.xpath("//button[contains(.,'Continuar')]"));

    public static final Target BACK_BUTTON = Target.the("boton atras del registro")
        .located(By.xpath("//button[contains(.,'Atrás')]"));
}
