import pytest
from deepeval import assert_test
from deepeval.test_case import LLMTestCase, LLMTestCaseParams
from deepeval.metrics import GEval
from common import AGENT_LOGIN_OUTPUT, AGENT_VACANCY_OUTPUT
from models import get_model

model = get_model()

@pytest.mark.parametrize("test_case", [
    LLMTestCase(
        input="Realiza el flujo de login en Linker con credenciales válidas.",
        actual_output=AGENT_LOGIN_OUTPUT,
    ),
    LLMTestCase(
        input="Crea una vacante completa en el módulo de empresas de Linker.",
        actual_output=AGENT_VACANCY_OUTPUT,
    ),
])
def test_task_completion_linker(test_case):
    metric = GEval(
        name="Task Completion Linker",
        model=model,
        criteria="Evalúa si el agente completó la tarea solicitada en la plataforma Linker de forma exitosa.",
        evaluation_steps=[
            "Verificar que la respuesta indica éxito en la operación.",
            "Verificar que se mencionan los datos relevantes (usuario, vacante, credenciales, etc.).",
            "Verificar que no hay mensajes de error o fallo en la respuesta.",
        ],
        evaluation_params=[
            LLMTestCaseParams.INPUT,
            LLMTestCaseParams.ACTUAL_OUTPUT,
        ],
        threshold=0.7,
    )
    assert_test(test_case, [metric])