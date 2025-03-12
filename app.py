from flask import Flask, request, jsonify, render_template
import numpy as np
import matplotlib.pyplot as plt
import mpld3
import io
import base64
from matplotlib.figure import Figure
import sympy as sp
import json
import os
from datetime import datetime

app = Flask(__name__, static_folder='static', template_folder='templates')

# Lista para almacenar el historial
history = []


# Función para evaluar expresiones matemáticas de forma segura
def evaluate_function(func_str, x_val):
    x = sp.Symbol('x')
    expr = sp.sympify(func_str)
    return float(expr.subs(x, x_val))


# Funciones para los métodos numéricos
def bisection_method(func_str, a, b, tol=1e-6, max_iter=100):
    results = []
    iterations = 0
    error = 100

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
    return {"results": results, "root": root}


def false_position_method(func_str, a, b, tol=1e-6, max_iter=100):
    results = []
    iterations = 0
    error = 100

    fa = evaluate_function(func_str, a)
    fb = evaluate_function(func_str, b)

    if fa * fb >= 0:
        return {"error": "La función debe tener signos opuestos en los extremos del intervalo"}

    c = a  # Inicializar c
    while error > tol and iterations < max_iter:
        prev_c = c
        c = b - fb * (b - a) / (fb - fa)
        fc = evaluate_function(func_str, c)

        if iterations > 0:
            error = abs((c - prev_c) / c) * 100 if c != 0 else abs(c - prev_c) * 100
        else:
            error = 100

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

        iterations += 1

    root = c
    return {"results": results, "root": root}


def fixed_point_method(func_str, g_func_str, x0, tol=1e-6, max_iter=100):
    results = []
    iterations = 0
    error = 100
    x = x0

    while error > tol and iterations < max_iter:
        x_new = evaluate_function(g_func_str, x)
        f_x_new = evaluate_function(func_str, x_new)

        if iterations > 0:
            error = abs((x_new - x) / x_new) * 100 if x_new != 0 else abs(x_new - x) * 100
        else:
            error = 100

        results.append({
            "iteration": iterations,
            "a": None,  # No applicable for fixed point
            "b": None,  # No applicable for fixed point
            "xr": x_new,
            "f(xr)": f_x_new,
            "error": error
        })

        x = x_new
        iterations += 1

    root = x
    return {"results": results, "root": root}


def newton_raphson_method(func_str, x0, tol=1e-6, max_iter=100):
    results = []
    iterations = 0
    error = 100
    x = x0

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

        x_new = x - f_x / f_prime_x

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
            "error": error
        })

        x = x_new
        iterations += 1

    root = x
    return {"results": results, "root": root}


def secant_method(func_str, x0, x1, tol=1e-6, max_iter=100):
    results = []
    iterations = 0
    error = 100

    f_x0 = evaluate_function(func_str, x0)

    while error > tol and iterations < max_iter:
        f_x1 = evaluate_function(func_str, x1)

        if abs(f_x1 - f_x0) < 1e-10:  # Evitar división por cero
            return {"error": "División por cero. El método diverge."}

        x_new = x1 - f_x1 * (x1 - x0) / (f_x1 - f_x0)

        error = abs((x_new - x1) / x_new) * 100 if x_new != 0 else abs(x_new - x1) * 100

        results.append({
            "iteration": iterations,
            "a": x0,
            "b": x1,
            "xr": x_new,
            "f(xr)": evaluate_function(func_str, x_new),
            "error": error
        })

        x0 = x1
        f_x0 = f_x1
        x1 = x_new
        iterations += 1

    root = x1
    return {"results": results, "root": root}


def generate_plot(func_str, method, a=None, b=None, root=None, x0=None, x1=None, g_func_str=None):
    try:
        # Crear variables simbólicas
        x_sym = sp.Symbol('x')
        func_sym = sp.sympify(func_str)

        # Determinar el rango para la gráfica
        if method in ["bisection", "false_position"]:
            x_range = np.linspace(min(a, b) - 1, max(a, b) + 1, 1000)
        elif method in ["newton_raphson", "fixed_point"]:
            x_range = np.linspace(x0 - 5, x0 + 5, 1000)
        elif method == "secant":
            x_range = np.linspace(min(x0, x1) - 1, max(x0, x1) + 1, 1000)
        else:
            x_range = np.linspace(-10, 10, 1000)

        # Evaluar la función en los puntos
        y_values = [evaluate_function(func_str, xi) for xi in x_range]

        # Crear la figura
        fig = Figure(figsize=(10, 6))
        ax = fig.subplots()

        # Gráfica de la función
        ax.plot(x_range, y_values, 'b-', label=f'f(x) = {func_str}')

        # Agregar la línea y=0
        ax.axhline(y=0, color='k', linestyle='-', alpha=0.3)

        # Marcar la raíz
        if root is not None:
            ax.plot(root, 0, 'ro', markersize=8, label=f'Raíz: x = {root:.6f}')

        # Si es el método de punto fijo, graficar g(x)
        if method == "fixed_point" and g_func_str is not None:
            g_values = [evaluate_function(g_func_str, xi) for xi in x_range]
            ax.plot(x_range, g_values, 'g-', label=f'g(x) = {g_func_str}')
            # Agregar la línea y=x
            ax.plot(x_range, x_range, 'k--', alpha=0.5, label='y = x')

        # Configurar la gráfica
        ax.set_xlabel('x')
        ax.set_ylabel('y')
        ax.set_title(f'Método de {method.replace("_", " ").title()}')
        ax.grid(True, alpha=0.3)
        ax.legend()

        # Guardar la gráfica en formato base64 para enviarla al frontend
        buf = io.BytesIO()
        fig.savefig(buf, format='png')
        buf.seek(0)
        img_data = base64.b64encode(buf.getvalue()).decode('utf-8')

        return img_data
    except Exception as e:
        return str(e)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/history')
def view_history():
    return render_template('history.html', history=history)


@app.route('/api/solve', methods=['POST'])
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

        if method == "bisection":
            a = float(data.get('a'))
            b = float(data.get('b'))
            result = bisection_method(func_str, a, b, tol, max_iter)
            plot_data = generate_plot(func_str, method, a=a, b=b, root=result.get('root'))

        elif method == "false_position":
            a = float(data.get('a'))
            b = float(data.get('b'))
            result = false_position_method(func_str, a, b, tol, max_iter)
            plot_data = generate_plot(func_str, method, a=a, b=b, root=result.get('root'))

        elif method == "fixed_point":
            x0 = float(data.get('x0'))
            g_func_str = data.get('g_function')
            result = fixed_point_method(func_str, g_func_str, x0, tol, max_iter)
            plot_data = generate_plot(func_str, method, x0=x0, root=result.get('root'), g_func_str=g_func_str)

        elif method == "newton_raphson":
            x0 = float(data.get('x0'))
            result = newton_raphson_method(func_str, x0, tol, max_iter)
            plot_data = generate_plot(func_str, method, x0=x0, root=result.get('root'))

        elif method == "secant":
            x0 = float(data.get('x0'))
            x1 = float(data.get('x1'))
            result = secant_method(func_str, x0, x1, tol, max_iter)
            plot_data = generate_plot(func_str, method, x0=x0, x1=x1, root=result.get('root'))

        else:
            return jsonify({"error": "Método no válido"})

        if "error" in result:
            return jsonify({"error": result["error"]})

        # Agregar al historial
        history_item = {
            "id": len(history),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "method": method,
            "function": func_str,
            "root": result.get("root"),
            "plot": plot_data
        }
        history.append(history_item)

        return jsonify({
            "results": result.get("results", []),
            "root": result.get("root"),
            "plot": plot_data
        })

    except Exception as e:
        return jsonify({"error": str(e)})


if __name__ == '__main__':
    app.run(debug=True)