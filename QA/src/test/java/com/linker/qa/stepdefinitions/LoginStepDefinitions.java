package com.linker.qa.stepdefinitions;

import com.linker.qa.questions.LoginFormTitle;
import com.linker.qa.tasks.OpenThePage;
import com.linker.qa.ui.LoginPage;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import net.serenitybdd.screenplay.GivenWhenThen;
import net.serenitybdd.screenplay.actors.OnStage;
import net.serenitybdd.screenplay.matchers.WebElementStateMatchers;
import static org.hamcrest.Matchers.equalTo;
import static net.serenitybdd.screenplay.questions.WebElementQuestion.the;

public class LoginStepDefinitions {

    @Given("que {word} navega a la pantalla de login")
    public void actorNavigatesToLoginPage(String actorName) {
        OnStage.theActorCalled(actorName).attemptsTo(
            OpenThePage.called("/login")
        );
    }

    @When("intenta iniciar su autenticacion")
    public void actorAttemptsAuthentication() {
        OnStage.theActorInTheSpotlight().should(
            GivenWhenThen.seeThat(the(LoginPage.EMAIL_INPUT), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(LoginPage.PASSWORD_INPUT), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(LoginPage.LOGIN_BUTTON), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(LoginPage.SIGNUP_LINK), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(LoginPage.FORGOT_PASSWORD_LINK), WebElementStateMatchers.isVisible())
        );
    }

    @Then("deberia ver el titulo {string} en el formulario")
    public void shouldSeeTheExpectedTitle(String expectedTitle) {
        OnStage.theActorInTheSpotlight().should(
            GivenWhenThen.seeThat(LoginFormTitle.displayed(), equalTo(expectedTitle))
        );
    }

    @Then("deberia ver el mensaje de bienvenida {string}")
    public void shouldSeeTheWelcomeTitle(String welcomeTitle) {
        OnStage.theActorInTheSpotlight().should(
            GivenWhenThen.seeThat(the(LoginPage.WELCOME_TITLE), WebElementStateMatchers.containsText(welcomeTitle))
        );
    }
}
