# -*- coding: utf-8 -*-
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import pytest
from deepeval import assert_test
from deepeval.test_case import LLMTestCase, LLMTestCaseParams
from deepeval.metrics import GEval
from common import LOGIN_HEADING, LOGIN_INVALID, LOGIN_SUCCESS, LOGIN_SIGNUP
from models import get_model

model = get_model()

def make_metric(name: str) -> GEval:
    return GEval(
        name=f"UI Task Completion - {name}",
        model=model,
        criteria=(
            "Evalua si el componente Angular completo exitosamente la tarea del usuario. "
            "La respuesta debe indicar una operacion exitosa, sin errores, "
            "con el comportamiento de UI esperado."
        ),
        evaluation_steps=[
            "Verificar que la respuesta no indica errores ni fallos.",
            "Verificar que el comportamiento descrito es el esperado para esa tarea.",
            "Verificar que la tarea fue completada desde la perspectiva del usuario.",
        ],
        evaluation_params=[
            LLMTestCaseParams.INPUT,
            LLMTestCaseParams.ACTUAL_OUTPUT,
        ],
        threshold=0.6,
    )

def test_login_muestra_bienvenida():
    assert_test(LLMTestCase(
        input="El componente de login debe mostrar un titulo de bienvenida al usuario.",
        actual_output=LOGIN_HEADING,
    ), [make_metric("Heading de bienvenida")])

def test_login_rechaza_credenciales_invalidas():
    assert_test(LLMTestCase(
        input="El componente de login debe rechazar credenciales incorrectas y no redirigir.",
        actual_output=LOGIN_INVALID,
    ), [make_metric("Rechazo credenciales invalidas")])

def test_login_redirige_tras_exito():
    assert_test(LLMTestCase(
        input="El componente de login debe redirigir a /match tras credenciales validas.",
        actual_output=LOGIN_SUCCESS,
    ), [make_metric("Redireccion exitosa")])

def test_login_enlace_signup():
    assert_test(LLMTestCase(
        input="El componente de login debe tener un enlace que navegue a /signup.",
        actual_output=LOGIN_SIGNUP,
    ), [make_metric("Enlace a registro")])