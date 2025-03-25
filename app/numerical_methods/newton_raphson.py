# numerical_methods/newton_raphson.py
import sympy as sp
from .utils import evaluate_function

def newton_raphson_method(func_str, x0, tol=1e-6, max_iter=100):
    results = []
    iterations = 0
    error = 100
    x = x0

    # Lista para almacenar los puntos de la animación
    animation_points = []

    # Crear la función derivada usando sympy
    x_sym = sp.Symbol('x')
    func_sym = sp.sympify(func_str)
    derivative_sym = sp.diff(func_sym, x_sym)
    derivative_str = str(derivative_sym)

    while error > tol and iterations < max_iter:
        f_x = evaluate_function(func_str, x)
        f_prime_x = evaluate_function(derivative_str, x)

        if abs(f_prime_x) < 1e-10:  # Evitar división por cero
            return {"error": "Derivada muy cercana a cero. El método diverge."}

        # Calcular la tangente para la visualización
        tangent_b = f_x - f_prime_x * x
        x_new = x - f_x / f_prime_x

        # Almacenar puntos para la animación
        animation_points.append({
            "x": x,
            "f_x": f_x,
            "tangent_m": f_prime_x,
            "tangent_b": tangent_b,
            "x_new": x_new
        })

        if iterations > 0:
            error = abs((x_new - x) / x_new) * 100 if x_new != 0 else abs(x_new - x) * 100
        else:
            error = 100

        results.append({
            "iteration": iterations,
            "a": None,  # No applicable for Newton-Raphson
            "b": None,  # No applicable for Newton-Raphson
            "xr": x,
            "f(xr)": f_x,
            "error": error,
            "f_prime_x": f_prime_x,  # Para la animación
            "tangent_b": tangent_b,  # Para la animación
            "x_next": x_new  # Para la animación
        })

        x = x_new
        iterations += 1

    root = x
    return {"results": results, "root": root, "animation_points": animation_points}