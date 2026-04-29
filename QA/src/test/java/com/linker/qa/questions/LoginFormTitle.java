package com.linker.qa.questions;

import com.linker.qa.ui.LoginPage;
import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.Question;
import net.serenitybdd.screenplay.questions.Text;

public class LoginFormTitle implements Question<String> {

    public static LoginFormTitle displayed() {
        return new LoginFormTitle();
    }

    @Override
    public String answeredBy(Actor actor) {
        return Text.of(LoginPage.LOGIN_TITLE).answeredBy(actor);
    }
}
