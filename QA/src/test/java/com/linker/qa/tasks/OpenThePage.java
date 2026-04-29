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
        String configuredBaseUrl = resolveBaseUrl();

        String normalizedBaseUrl = configuredBaseUrl.replaceAll("/$", "");
        String normalizedPath = path.startsWith("/") ? path : "/" + path;

        actor.attemptsTo(Open.url(normalizedBaseUrl + normalizedPath));
    }

    private String resolveBaseUrl() {
        String configuredBaseUrl = System.getProperty("qa.base.url");
        if (isPresent(configuredBaseUrl)) {
            return configuredBaseUrl;
        }

        configuredBaseUrl = System.getProperty("webdriver.base.url");
        if (isPresent(configuredBaseUrl)) {
            return configuredBaseUrl;
        }

        configuredBaseUrl = System.getenv("QA_BASE_URL");
        if (isPresent(configuredBaseUrl)) {
            return configuredBaseUrl;
        }

        String environment = System.getProperty("environment");
        if (!isPresent(environment)) {
            environment = System.getProperty("env");
        }

        if ("test".equalsIgnoreCase(environment)) {
            return "http://host.docker.internal:4201";
        }

        return "http://localhost:4200";
    }

    private boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }
}
