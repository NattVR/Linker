package com.linker.qa.tasks;

import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.Task;
import net.serenitybdd.screenplay.Tasks;
import net.serenitybdd.screenplay.abilities.BrowseTheWeb;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;

public class StartAuthenticatedSession implements Task {

    private final String userId;
    private final String perfilId;
    private final String isEmpresa;
    private final String token;

    public StartAuthenticatedSession(String userId, String perfilId, String isEmpresa, String token) {
        this.userId = userId;
        this.perfilId = perfilId;
        this.isEmpresa = isEmpresa;
        this.token = token;
    }

    public static StartAuthenticatedSession forApplicant() {
        return Tasks.instrumented(
            StartAuthenticatedSession.class,
            "user-postulante-1",
            "perfil-postulante-1",
            "false",
            "token-postulante"
        );
    }

    public static StartAuthenticatedSession forCompany() {
        return Tasks.instrumented(
            StartAuthenticatedSession.class,
            "user-empresa-1",
            "perfil-empresa-1",
            "true",
            "token-empresa"
        );
    }

    @Override
    public <T extends Actor> void performAs(T actor) {
        WebDriver driver = BrowseTheWeb.as(actor).getDriver();
        JavascriptExecutor js = (JavascriptExecutor) driver;

        js.executeScript("window.sessionStorage.setItem('userId', arguments[0]);", userId);
        js.executeScript("window.sessionStorage.setItem('perfilId', arguments[0]);", perfilId);
        js.executeScript("window.sessionStorage.setItem('isEmpresa', arguments[0]);", isEmpresa);
        js.executeScript("window.sessionStorage.setItem('token', arguments[0]);", token);
    }
}
