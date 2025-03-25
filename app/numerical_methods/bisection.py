# numerical_methods/bisection.py
from .utils import evaluate_function

def bisection_method(func_str, a, b, tol=1e-6, max_iter=100):
    results = []
    iterations = 0
    error = 100

    # Lista para almacenar puntos de animación
    animation_points = []

    fa = evaluate_function(func_str, a)
    fb = evaluate_function(func_str, b)

    if fa * fb >= 0:
        return {"error": "La función debe tener signos opuestos en los extremos del intervalo"}

    while error > tol and iterations < max_iter:
        c = (a + b) / 2
        fc = evaluate_function(func_str, c)

        if iterations > 0:
            error = abs((c - prev_c) / c) * 100 if c != 0 else abs(c - prev_c) * 100
        else:
            error = 100

        # Guardar puntos para animación
        animation_points.append({
            "a": a,
            "b": b,
            "c": c,
            "fa": fa,
            "fb": fb,
            "fc": fc
        })

        results.append({
            "iteration": iterations,
            "a": a,
            "b": b,
            "xr": c,
            "f(xr)": fc,
            "error": error
        })

        if fa * fc < 0:
            b = c
            fb = fc
        else:
            a = c
            fa = fc

        prev_c = c
        iterations += 1

    root = c
    return {"results": results, "root": root, "animation_points": animation_points}