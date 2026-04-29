package com.linker.qa.ui;

import net.serenitybdd.core.annotations.findby.By;
import net.serenitybdd.core.pages.PageObject;
import net.serenitybdd.screenplay.targets.Target;
public class LoginPage extends PageObject {

    public static final Target WELCOME_TITLE = Target.the("titulo de bienvenida del login")
        .located(By.xpath("//h1[normalize-space()='Bienvenido de nuevo']"));

    public static final Target LOGIN_TITLE = Target.the("titulo del formulario de inicio de sesion")
        .located(By.xpath("//h2[normalize-space()='Iniciar Sesión']"));

    public static final Target EMAIL_INPUT = Target.the("campo de correo")
        .located(By.id("email"));

    public static final Target PASSWORD_INPUT = Target.the("campo de contrasena")
        .located(By.id("password"));

    public static final Target LOGIN_BUTTON = Target.the("boton para iniciar sesion")
        .located(By.cssSelector("button[type='submit']"));

    public static final Target SIGNUP_LINK = Target.the("enlace al registro de usuario")
        .located(By.cssSelector("a[routerlink='/signup']"));

    public static final Target FORGOT_PASSWORD_LINK = Target.the("enlace de olvido de contrasena")
        .located(By.xpath("//a[normalize-space()='¿Olvidaste tu contraseña?']"));
}
