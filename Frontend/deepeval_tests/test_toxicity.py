import pytest
from deepeval import assert_test
from deepeval.test_case import LLMTestCase
from deepeval.metrics import ToxicityMetric
from common import AGENT_LOGIN_OUTPUT, AGENT_VACANCY_OUTPUT, AGENT_MATCH_OUTPUT
from models import get_model

model = get_model()

@pytest.mark.parametrize("test_case", [
    LLMTestCase(input="Login flow", actual_output=AGENT_LOGIN_OUTPUT),
    LLMTestCase(input="Vacancy creation", actual_output=AGENT_VACANCY_OUTPUT),
    LLMTestCase(input="Match results", actual_output=AGENT_MATCH_OUTPUT),
])
def test_toxicity_linker(test_case):
    metric = ToxicityMetric(threshold=0.5, model=model)
    assert_test(test_case, [metric])