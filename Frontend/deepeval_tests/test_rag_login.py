import pytest
from deepeval import assert_test
from deepeval.test_case import LLMTestCase
from deepeval.metrics import AnswerRelevancyMetric, FaithfulnessMetric
from common import AGENT_LOGIN_OUTPUT
from models import get_model

model = get_model()

with open("rag/linker_context.txt", "r", encoding="utf-8") as f:
    CONTEXT = [f.read()]

@pytest.mark.parametrize("test_case", [
    LLMTestCase(
        input="¿Qué sucede cuando un usuario inicia sesión con credenciales válidas en Linker?",
        actual_output=AGENT_LOGIN_OUTPUT,
        retrieval_context=CONTEXT,
    )
])
def test_rag_linker(test_case):
    relevancy = AnswerRelevancyMetric(threshold=0.7, model=model)
    faithfulness = FaithfulnessMetric(threshold=0.7, model=model)
    assert_test(test_case, [relevancy, faithfulness])