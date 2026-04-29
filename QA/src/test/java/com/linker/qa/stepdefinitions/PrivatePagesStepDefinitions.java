package com.linker.qa.stepdefinitions;

import com.linker.qa.questions.CurrentPageUrl;
import com.linker.qa.tasks.OpenThePage;
import com.linker.qa.tasks.StartAuthenticatedSession;
import com.linker.qa.ui.ApplicantProfilePage;
import com.linker.qa.ui.CompanyProfilePage;
import com.linker.qa.ui.MatchPage;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import net.serenitybdd.screenplay.GivenWhenThen;
import net.serenitybdd.screenplay.actions.Click;
import net.serenitybdd.screenplay.actors.OnStage;
import net.serenitybdd.screenplay.matchers.WebElementStateMatchers;

import static net.serenitybdd.screenplay.questions.WebElementQuestion.the;

public class PrivatePagesStepDefinitions {

    @Given("que {word} inicia una sesion privada como postulante y navega a {string}")
    public void applicantNavigatesToPrivateRoute(String actorName, String path) {
        OnStage.theActorCalled(actorName).attemptsTo(
            OpenThePage.called("/"),
            StartAuthenticatedSession.forApplicant(),
            OpenThePage.called(path)
        );
    }

    @Given("que {word} inicia una sesion privada como empresa y navega a {string}")
    public void companyNavigatesToPrivateRoute(String actorName, String path) {
        OnStage.theActorCalled(actorName).attemptsTo(
            OpenThePage.called("/"),
            StartAuthenticatedSession.forCompany(),
            OpenThePage.called(path)
        );
    }

    @When("cambia a la pestana de certificados de empresa")
    public void actorChangesToCompanyCertificatesTab() {
        OnStage.theActorInTheSpotlight().attemptsTo(
            Click.on(CompanyProfilePage.CERTIFICATES_TAB)
        );
    }

    @Then("deberia visualizar el perfil privado del postulante")
    public void shouldSeeApplicantPrivateProfile() {
        OnStage.theActorInTheSpotlight().should(
            GivenWhenThen.seeThat(the(ApplicantProfilePage.CV_SECTION), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(ApplicantProfilePage.EXPERIENCE_SELECT), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(ApplicantProfilePage.STUDY_TITLE_INPUT), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(ApplicantProfilePage.SAVE_BUTTON), WebElementStateMatchers.isVisible())
        );
    }

    @Then("deberia visualizar el match privado para postulante")
    public void shouldSeeApplicantPrivateMatch() {
        OnStage.theActorInTheSpotlight().should(
            GivenWhenThen.seeThat(the(MatchPage.MATCH_LAYOUT), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(MatchPage.LOAD_VACANCIES_BUTTON), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(CurrentPageUrl.displayed(), org.hamcrest.Matchers.containsString("/match"))
        );
    }

    @Then("deberia visualizar el perfil privado de empresa")
    public void shouldSeeCompanyPrivateProfile() {
        OnStage.theActorInTheSpotlight().should(
            GivenWhenThen.seeThat(the(CompanyProfilePage.EDIT_PROFILE_BUTTON), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(CompanyProfilePage.VACANCIES_TAB), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(CompanyProfilePage.CERTIFICATES_TAB), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(CompanyProfilePage.STATISTICS_TAB), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(CompanyProfilePage.PUBLISH_JOB_BUTTON), WebElementStateMatchers.isVisible())
        );
    }

    @Then("deberia visualizar la gestion de certificados de empresa")
    public void shouldSeeCompanyCertificatesManagement() {
        OnStage.theActorInTheSpotlight().should(
            GivenWhenThen.seeThat(the(CompanyProfilePage.NEW_CERTIFICATE_BUTTON), WebElementStateMatchers.isVisible())
        );
    }

    @Then("deberia visualizar el match privado para empresa")
    public void shouldSeeCompanyPrivateMatch() {
        OnStage.theActorInTheSpotlight().should(
            GivenWhenThen.seeThat(the(MatchPage.MATCH_LAYOUT), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(MatchPage.VACANCY_SELECTOR_BUTTON), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(the(MatchPage.LOAD_APPLICANTS_BUTTON), WebElementStateMatchers.isVisible()),
            GivenWhenThen.seeThat(CurrentPageUrl.displayed(), org.hamcrest.Matchers.containsString("/match"))
        );
    }
}
