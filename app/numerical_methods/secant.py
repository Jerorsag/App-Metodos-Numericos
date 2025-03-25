# numerical_methods/secant.py
from .utils import evaluate_function

def secant_method(func_str, x0, x1, tol=1e-6, max_iter=100):
    results = []
    iterations = 0
    error = 100

    # Lista para almacenar los puntos de la animación
    animation_points = []

    f_x0 = evaluate_function(func_str, x0)

    while error > tol and iterations < max_iter:
        f_x1 = evaluate_function(func_str, x1)

        if abs(f_x1 - f_x0) < 1e-10:  # Evitar división por cero
            return {"error": "División por cero. El método diverge."}

        # Calcular la secante para la visualización
        m_secant = (f_x1 - f_x0) / (x1 - x0)
        b_secant = f_x1 - m_secant * x1

        x_new = x1 - f_x1 * (x1 - x0) / (f_x1 - f_x0)

        # Almacenar puntos para la animación
        animation_points.append({
            "x0": x0,
            "x1": x1,
            "f_x0": f_x0,
            "f_x1": f_x1,
            "m_secant": m_secant,
            "b_secant": b_secant,
            "x_new": x_new
        })

        error = abs((x_new - x1) / x_new) * 100 if x_new != 0 else abs(x_new - x1) * 100

        results.append({
            "iteration": iterations,
            "a": x0,
            "b": x1,
            "xr": x_new,
            "f(xr)": evaluate_function(func_str, x_new),
            "error": error,
            "m_secant": m_secant,  # Para la animación
            "b_secant": b_secant  # Para la animación
        })

        x0 = x1
        f_x0 = f_x1
        x1 = x_new
        iterations += 1

    root = x1
    return {"results": results, "root": root, "animation_points": animation_points}