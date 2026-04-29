package com.linker.qa.runners;

import io.cucumber.junit.CucumberOptions;
import net.serenitybdd.cucumber.CucumberWithSerenity;
import org.junit.runner.RunWith;

@RunWith(CucumberWithSerenity.class)
@CucumberOptions(
    features = "src/test/resources/features",
    glue = "com.linker.qa",
    snippets = CucumberOptions.SnippetType.CAMELCASE,
    plugin = {"pretty"}
)
public class AcceptanceTestSuite {
}
