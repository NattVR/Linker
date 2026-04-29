package com.linker.qa.ui;

import net.serenitybdd.core.annotations.findby.By;
import net.serenitybdd.core.pages.PageObject;
import net.serenitybdd.screenplay.targets.Target;

public class SignupCompanyPage extends PageObject {

    public static final Target PAGE_TITLE = Target.the("titulo del registro de empresas")
        .located(By.xpath("//h2[normalize-space()='Registrate']"));

    public static final Target BUSINESS_STEP_LABEL = Target.the("etiqueta del paso empresarial")
        .located(By.xpath("//span[normalize-space()='Datos Empresariales']"));

    public static final Target CREDENTIALS_STEP_LABEL = Target.the("etiqueta de credenciales de empresa")
        .located(By.xpath("//span[normalize-space()='Credenciales']"));

    public static final Target COMPANY_NAME_INPUT = Target.the("campo nombre de empresa")
        .located(By.cssSelector("input[formcontrolname='name_empresa']"));

    public static final Target NIT_INPUT = Target.the("campo nit")
        .located(By.cssSelector("input[formcontrolname='NIT']"));

    public static final Target EMAIL_INPUT = Target.the("campo email empresa")
        .located(By.cssSelector("input[formcontrolname='email']"));

    public static final Target PASSWORD_INPUT = Target.the("campo contrasena empresa")
        .located(By.cssSelector("input[formcontrolname='password']"));

    public static final Target REPASSWORD_INPUT = Target.the("campo confirmacion empresa")
        .located(By.cssSelector("input[formcontrolname='repassword']"));

    public static final Target CONTINUE_BUTTON = Target.the("boton continuar empresa")
        .located(By.xpath("//button[contains(.,'Continuar')]"));

    public static final Target BACK_BUTTON = Target.the("boton atras empresa")
        .located(By.xpath("//button[contains(.,'Atrás')]"));

    public static final Target LOGIN_LINK = Target.the("enlace login desde empresa")
        .located(By.cssSelector("a[routerlink='/login']"));
}
