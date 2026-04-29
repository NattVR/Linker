package com.linker.qa.hooks;

import io.cucumber.java.After;
import io.cucumber.java.Before;
import net.serenitybdd.screenplay.actors.OnStage;
import net.serenitybdd.screenplay.actors.OnlineCast;

public class AutomationHooks {

    @Before
    public void prepareStage() {
        OnStage.setTheStage(new OnlineCast());
    }

    @After
    public void closeStage() {
        OnStage.drawTheCurtain();
    }
}
