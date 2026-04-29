package com.linker.qa.tasks;

import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.Task;
import net.serenitybdd.screenplay.Tasks;
import net.serenitybdd.screenplay.actions.Open;

public class OpenThePage implements Task {

    private final String path;

    public OpenThePage(String path) {
        this.path = path;
    }

    public static OpenThePage called(String path) {
        return Tasks.instrumented(OpenThePage.class, path);
    }

    @Override
    public <T extends Actor> void performAs(T actor) {
        String configuredBaseUrl = System.getProperty(
            "qa.base.url",
            System.getenv().getOrDefault("QA_BASE_URL", "http://localhost:4200")
        );

        String normalizedBaseUrl = configuredBaseUrl.replaceAll("/$", "");
        String normalizedPath = path.startsWith("/") ? path : "/" + path;

        actor.attemptsTo(Open.url(normalizedBaseUrl + normalizedPath));
    }
}
