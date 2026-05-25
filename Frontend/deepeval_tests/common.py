# -*- coding: utf-8 -*-
import os, json

def load_output(filename: str, fallback: str) -> str:
    path = os.path.join(os.path.dirname(__file__), "outputs", filename)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f).get("output", fallback)
    return fallback

LOGIN_HEADING   = load_output("login_heading.json",
    "El componente de login muestra el encabezado de bienvenida.")

LOGIN_INVALID   = load_output("login_invalid.json",
    "El componente rechazó credenciales inválidas y mantuvo al usuario en /login.")

LOGIN_SUCCESS   = load_output("login_success.json",
    "El componente redirigió exitosamente a /match tras login con credenciales válidas.")

LOGIN_SIGNUP    = load_output("login_signup_link.json",
    "El enlace de registro navegó correctamente a /signup.")