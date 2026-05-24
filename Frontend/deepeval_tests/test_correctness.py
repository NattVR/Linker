import pytest
from deepeval import assert_test
from deepeval.test_case import LLMTestCase
from deepeval.metrics import GEval
from deepeval.test_case import LLMTestCaseParams
from common import AGENT_LOGIN_OUTPUT, AGENT_VACANCY_OUTPUT, AGENT_MATCH_OUTPUT
from models import get_model

model = get_model()

@pytest.mark.parametrize("test_case", [
    LLMTestCase(
        input="El usuario intentó iniciar sesión con credenciales válidas en Linker.",
        actual_output=AGENT_LOGIN_OUTPUT,
        expected_output="El usuario inició sesión correctamente y fue redirigido al dashboard."
    ),
    LLMTestCase(
        input="Se creó una vacante de Desarrollador Backend Senior con requisitos técnicos.",
        actual_output=AGENT_VACANCY_OUTPUT,
        expected_output="La vacante fue creada con título, idiomas y habilidades configuradas correctamente."
    ),
    LLMTestCase(
        input="Se buscaron candidatos compatibles con la vacante publicada.",
        actual_output=AGENT_MATCH_OUTPUT,
        expected_output="El sistema retornó candidatos con porcentaje de compatibilidad calculado."
    ),
])
def test_correctness_linker(test_case):
    metric = GEval(
        name="Correctness Linker",
        model=model,
        criteria="Determina si la respuesta del agente refleja correctamente el resultado esperado del sistema Linker.",
        evaluation_params=[
            LLMTestCaseParams.INPUT,
            LLMTestCaseParams.ACTUAL_OUTPUT,
            LLMTestCaseParams.EXPECTED_OUTPUT,
        ],
        threshold=0.7,
    )
    assert_test(test_case, [metric])