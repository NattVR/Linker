package com.linker.qa.stepdefinitions;

import com.linker.qa.questions.CurrentPageUrl;
import com.linker.qa.tasks.OpenThePage;
import com.linker.qa.ui.HomePage;
import com.linker.qa.ui.SignupCompanyPage;
import com.linker.qa.ui.SignupPage;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import net.serenitybdd.screenplay.GivenWhenThen;
import net.serenitybdd.screenplay.actions.Click;
import net.serenitybdd.screenplay.actions.Enter;
import net.serenitybdd.screenplay.actors.OnStage;
import net.serenitybdd.screenplay.matchers.WebElementStateMatchers;

import static net.serenitybdd.screenplay.questions.WebElementQuestion.the;
import static org.hamcrest.Matchers.containsString;

public class PublicPagesStepDefinitions {

    @Given("que {word} navega a la pagina {string}")
    public void actorNavigatesToPage(String actorName, String path) {
        OnStage.theActorCalled(actorName).attemptsTo(
            OpenThePage.called(path)
        );
    }

    @When("avanza al segundo paso del registro de postulante con nombre {string} y apellido {string}")
    public void actorAdvancesApplicantSignup(String name, String lastname) {
        OnStage.theActorInTheSpotlight().attemptsTo(
            Enter.theValue(name).into(SignupPage.NAME_INPUT),
            Enter.theValue(lastname).into(SignupPage.LASTNAME_INPUT),
            Click.on(SignupPage.CONTINUE_BUTTON)
        );
    }

    @When("regresa al primer paso del registro de postulante")
    public void actorReturnsToApplicantFirstStep() {
        OnStage.theActorInTheSpotlight().attemptsTo(
            Click.on(SignupPage.BACK_BUTTON)
        );
    }

    @When("avanza al segundo paso del registro de empresa con nombre {string} y NIT {string}")
    public void actorAdvancesCompanySignup(String companyName, String nit) {
        OnStage.theActorInTheSpotlight().attemptsTo(
            Enter.theValue(companyName).into(SignupCompanyPage.COMPANY_NAME_INPUT),
            Enter.theValue(nit).into(SignupCompanyPage.NIT_INPUT),
            Click.on(SignupCompanyPage.CONTINUE_BUTTON)
        );
    }

    @When("regresa al primer paso del registro de empresa")
    public void actorReturnsToCompanyFirstStep() {
        OnStage.theActorInTheSpotlight().attemptsTo(
            Click.on(SignupCompanyPage.BACK_BUTTON)
        );
    }

    @When("selecciona la opcion de login del encabezado")
    public void actorSelectsHeaderLogin() {
        OnStage.theActorInTheSpotlight().attemptsTo(
            Click.on(HomePage.HEADER_LOGIN_BUTTON)
        );
    }

    @Then("deberia visualizar la portada principal de Linker")
    public void shouldSeeHomePage() {
        OnStage.theActorInTheSpotlight().should(
            GivenWhenThen.seeThat(the(HomePage.HERO_TITLE), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(HomePage.FEATURES_TITLE), WebElementStateMatchers.isVisible())
        );
    }

    @Then("deberia visualizar el formulario inicial de registro de postulante")
    public void shouldSeeApplicantSignupFirstStep() {
        OnStage.theActorInTheSpotlight().should(
            GivenWhenThen.seeThat(the(SignupPage.PAGE_TITLE), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(SignupPage.PERSONAL_STEP_LABEL), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(SignupPage.NAME_INPUT), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(SignupPage.LASTNAME_INPUT), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(SignupPage.COMPANY_SIGNUP_LINK), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(SignupPage.LOGIN_LINK), WebElementStateMatchers.isVisible())
        );
    }

    @Then("deberia visualizar el formulario de credenciales del postulante")
    public void shouldSeeApplicantCredentialsStep() {
        OnStage.theActorInTheSpotlight().should(
            GivenWhenThen.seeThat(the(SignupPage.CREDENTIALS_STEP_LABEL), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(SignupPage.EMAIL_INPUT), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(SignupPage.PASSWORD_INPUT), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(SignupPage.REPASSWORD_INPUT), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(SignupPage.BACK_BUTTON), WebElementStateMatchers.isVisible())
        );
    }

    @Then("deberia visualizar el formulario inicial de registro de empresa")
    public void shouldSeeCompanySignupFirstStep() {
        OnStage.theActorInTheSpotlight().should(
            GivenWhenThen.seeThat(the(SignupCompanyPage.PAGE_TITLE), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(SignupCompanyPage.BUSINESS_STEP_LABEL), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(SignupCompanyPage.COMPANY_NAME_INPUT), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(SignupCompanyPage.NIT_INPUT), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(SignupCompanyPage.LOGIN_LINK), WebElementStateMatchers.isVisible())
        );
    }

    @Then("deberia visualizar el formulario de credenciales de empresa")
    public void shouldSeeCompanyCredentialsStep() {
        OnStage.theActorInTheSpotlight().should(
            GivenWhenThen.seeThat(the(SignupCompanyPage.CREDENTIALS_STEP_LABEL), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(SignupCompanyPage.EMAIL_INPUT), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(SignupCompanyPage.PASSWORD_INPUT), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(SignupCompanyPage.REPASSWORD_INPUT), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(SignupCompanyPage.BACK_BUTTON), WebElementStateMatchers.isVisible())
        );
    }

    @Then("deberia terminar en la ruta {string}")
    public void shouldEndOnRoute(String expectedRoute) {
        OnStage.theActorInTheSpotlight().should(
            GivenWhenThen.seeThat(CurrentPageUrl.displayed(), containsString(expectedRoute))
        );
    }
}
