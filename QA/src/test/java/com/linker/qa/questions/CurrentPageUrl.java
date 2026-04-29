package com.linker.qa.questions;

import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.Question;
import net.serenitybdd.screenplay.abilities.BrowseTheWeb;

public class CurrentPageUrl implements Question<String> {

    public static CurrentPageUrl displayed() {
        return new CurrentPageUrl();
    }

    @Override
    public String answeredBy(Actor actor) {
        return BrowseTheWeb.as(actor).getDriver().getCurrentUrl();
    }
}
