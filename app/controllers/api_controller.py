# controllers/api_controller.py
from flask import request, jsonify
import sympy as sp

from app.controllers.view_controller import history_manager
from app.numerical_methods.bisection import bisection_method
from app.numerical_methods.false_position import false_position_method
from app.numerical_methods.fixed_point import fixed_point_method
from app.numerical_methods.newton_raphson import newton_raphson_method
from app.numerical_methods.secant import secant_method
from app.services.explanation import generate_explanation
from app.services.plotting import generate_plot, generate_plot_data


# Importamos el history_manager desde view_controller para compartir la instancia


def solve():
    data = request.json
    method = data.get('method')
    func_str = data.get('function')

    try:
        # Parámetros comunes para todos los métodos
        tol = float(data.get('tolerance', 1e-6))
        max_iter = int(data.get('max_iterations', 100))

        # Verificar si la función es válida
        x = sp.Symbol('x')
        sp.sympify(func_str)

        result = {}
        animation_data = []

        if method == "bisection":
            a = float(data.get('a'))
            b = float(data.get('b'))
            result = bisection_method(func_str, a, b, tol, max_iter)
            plot_img = generate_plot(func_str, method, a=a, b=b, root=result.get('root'))
            plot_data = generate_plot_data(func_str, method, a=a, b=b, root=result.get('root'),
                                           iterations=result.get("results"))
            animation_data = result.get("animation_points", [])

        elif method == "false_position":
            a = float(data.get('a'))
            b = float(data.get('b'))
            result = false_position_method(func_str, a, b, tol, max_iter)
            plot_img = generate_plot(func_str, method, a=a, b=b, root=result.get('root'))
            plot_data = generate_plot_data(func_str, method, a=a, b=b, root=result.get('root'),
                                           iterations=result.get("results"))
            animation_data = result.get("animation_points", [])

        elif method == "fixed_point":
            x0 = float(data.get('x0'))
            g_func_str = data.get('g_function')
            result = fixed_point_method(func_str, g_func_str, x0, tol, max_iter)
            plot_img = generate_plot(func_str, method, x0=x0, root=result.get('root'), g_func_str=g_func_str)
            plot_data = generate_plot_data(func_str, method, x0=x0, root=result.get('root'), g_func_str=g_func_str,
                                           iterations=result.get("results"))
            animation_data = result.get("animation_points", [])

        elif method == "newton_raphson":
            x0 = float(data.get('x0'))
            result = newton_raphson_method(func_str, x0, tol, max_iter)
            plot_img = generate_plot(func_str, method, x0=x0, root=result.get('root'))
            plot_data = generate_plot_data(func_str, method, x0=x0, root=result.get('root'),
                                           iterations=result.get("results"))
            animation_data = result.get("animation_points", [])

        elif method == "secant":
            x0 = float(data.get('x0'))
            x1 = float(data.get('x1'))
            result = secant_method(func_str, x0, x1, tol, max_iter)
            plot_img = generate_plot(func_str, method, x0=x0, x1=x1, root=result.get('root'))
            plot_data = generate_plot_data(func_str, method, x0=x0, x1=x1, root=result.get('root'),
                                           iterations=result.get("results"))
            animation_data = result.get("animation_points", [])

        else:
            return jsonify({"error": "Método no válido"})

        if "error" in result:
            return jsonify({"error": result["error"]})

        # Agregar al historial
        calc_id = history_manager.add_calculation(
            method, func_str, data, result.get("root"),
            result.get("results"), plot_img, plot_data
        )

        return jsonify({
            "calc_id": calc_id,
            "results": result.get("results", []),
            "root": result.get("root"),
            "plot_img": plot_img,
            "plot_data": plot_data,
            "animation_data": animation_data
        })

    except Exception as e:
        return jsonify({"error": str(e)})


def explain_result():
    data = request.json
    calc_id = data.get('calc_id')

    item = history_manager.get_by_calc_id(calc_id)

    if not item:
        return jsonify({"error": "Cálculo no encontrado"}), 404

    try:
        explanation = generate_explanation(
            item.get('method'),
            item.get('function'),
            item.get('root'),
            item.get('results', [])
        )

        return jsonify({"explanation": explanation})

    except Exception as e:
        return jsonify({"error": f"Error al generar explicación: {str(e)}"}), 500


def get_history_item(id):
    item = history_manager.get_by_id(id)
    if item:
        return jsonify(item)
    return jsonify({"error": "Elemento de historial no encontrado"}), 404