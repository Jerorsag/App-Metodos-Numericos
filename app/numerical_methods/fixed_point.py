# numerical_methods/fixed_point.py
from .utils import evaluate_function

def fixed_point_method(func_str, g_func_str, x0, tol=1e-6, max_iter=100):
    results = []
    iterations = 0
    error = 100
    x = x0

    # Lista para almacenar los puntos de la animación
    animation_points = []

    while error > tol and iterations < max_iter:
        x_new = evaluate_function(g_func_str, x)
        f_x_new = evaluate_function(func_str, x_new)

        if iterations > 0:
            error = abs((x_new - x) / x_new) * 100 if x_new != 0 else abs(x_new - x) * 100
        else:
            error = 100

        # Almacenar puntos para la animación
        animation_points.append({
            "x": x,
            "g_x": x_new,
            "f_g_x": f_x_new
        })

        results.append({
            "iteration": iterations,
            "a": None,  # No applicable for fixed point
            "b": None,  # No applicable for fixed point
            "xr": x_new,
            "f(xr)": f_x_new,
            "error": error,
            "x_prev": x,  # Para la animación
            "g_x_prev": evaluate_function(g_func_str, x)  # Para la animación
        })

        x = x_new
        iterations += 1

    root = x
    return {"results": results, "root": root, "animation_points": animation_points}