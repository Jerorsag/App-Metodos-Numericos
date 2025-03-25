from flask import Flask, request, jsonify, render_template, session
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
import uuid

app = Flask(__name__, static_folder='static', template_folder='templates')
app.secret_key = 'metodos_numericos_key'  # Necesario para session

# Lista para almacenar el historial
history = []


# Función para evaluar expresiones matemáticas de forma segura
def evaluate_function(func_str, x_val):
    """Evalúa una expresión matemática de forma segura"""
    try:
        # Pre-procesar la expresión para manejar exponenciales
        func_str = func_str.replace('e^', 'exp')
        func_str = func_str.replace('e**', 'exp')

        # Reemplazar múltiples formas de exponencial
        if '\\cdot' in func_str:
            func_str = func_str.replace('\\cdot', '*')

        x = sp.Symbol('x')
        expr = sp.sympify(func_str)
        return float(expr.subs(x, x_val))
    except Exception as e:
        # Proporcionar un mensaje de error más descriptivo
        raise ValueError(f"Error al evaluar la función '{func_str}': {str(e)}")


# Funciones para los métodos numéricos
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


def false_position_method(func_str, a, b, tol=1e-6, max_iter=100):
    results = []
    iterations = 0
    error = 100

    # Lista para almacenar puntos de animación
    animation_points = []

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

        # Guardar puntos para animación
        animation_points.append({
            "a": a,
            "b": b,
            "c": c,
            "fa": fa,
            "fb": fb,
            "fc": fc,
            "secant_m": (fb - fa) / (b - a)
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

        iterations += 1

    root = c
    return {"results": results, "root": root, "animation_points": animation_points}


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


def generate_plot_data(func_str, method, a=None, b=None, root=None, x0=None, x1=None, g_func_str=None, iterations=None):
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

        # Datos para el frontend
        plot_data = {
            "x_range": x_range.tolist(),
            "y_values": y_values,
            "method": method,
            "func_str": func_str,
            "root": root
        }

        # Datos específicos para cada método
        if method == "fixed_point" and g_func_str is not None:
            g_values = [evaluate_function(g_func_str, xi) for xi in x_range]
            plot_data["g_values"] = g_values
            plot_data["g_func_str"] = g_func_str

        # Añadir datos de iteraciones para animación
        if iterations:
            plot_data["iterations"] = iterations

        return plot_data

    except Exception as e:
        return {"error": str(e)}


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


@app.route('/api/history/<int:id>')
def get_history_item(id):
    if 0 <= id < len(history):
        return jsonify(history[id])
    return jsonify({"error": "Elemento de historial no encontrado"}), 404


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
        animation_data = {}

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

        # Identificador único para este cálculo
        calc_id = str(uuid.uuid4())

        # Agregar al historial
        history_item = {
            "id": len(history),
            "calc_id": calc_id,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "method": method,
            "function": func_str,
            "parameters": data,
            "root": result.get("root"),
            "results": result.get("results"),
            "plot_img": plot_img,
            "plot_data": plot_data
        }
        history.append(history_item)

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


@app.route('/api/explain', methods=['POST'])
def explain_result():
    """Endpoint para explicar el resultado usando IA"""
    data = request.json
    calc_id = data.get('calc_id')

    # Encontrar el cálculo en el historial
    item = next((item for item in history if item.get('calc_id') == calc_id), None)

    if not item:
        return jsonify({"error": "Cálculo no encontrado"}), 404

    try:
        # Aquí podrías integrar una API real de IA como OpenAI
        # Por ahora, generaremos explicaciones predefinidas según el método

        method = item.get('method')
        func_str = item.get('function')
        root = item.get('root')
        results = item.get('results', [])

        if method == "bisection":
            explanation = f"""
            Utilizando el método de bisección, hemos encontrado que {root:.6f} es una raíz de la función f(x) = {func_str}.

            Este método dividió repetidamente el intervalo inicial a la mitad, eligiendo el subintervalo donde la función cambia de signo.
            El proceso convergió después de {len(results)} iteraciones, con un error final de {results[-1]['error']:.6f}%.

            La raíz encontrada significa que cuando x = {root:.6f}, la función f(x) = {func_str} es aproximadamente igual a cero.
            """
        elif method == "false_position":
            explanation = f"""
            El método de falsa posición encontró que {root:.6f} es una raíz de la función f(x) = {func_str}.

            A diferencia de la bisección, este método utiliza interpolación lineal para estimar dónde la función cruza el eje X.
            Converge más rápidamente que la bisección en muchos casos, logrando el resultado en {len(results)} iteraciones.

            El error final fue de {results[-1]['error']:.6f}%, lo que indica una buena aproximación a la raíz real.
            """
        elif method == "fixed_point":
            explanation = f"""
            El método de punto fijo determinó que {root:.6f} es una raíz de la función f(x) = {func_str}.

            Este método utiliza una función auxiliar g(x) para generar una secuencia iterativa que converge a la raíz.
            Después de {len(results)} iteraciones, encontramos que {root:.6f} es un punto fijo de g(x) y, por lo tanto, una raíz de f(x).

            En términos prácticos, esto significa que cuando x = {root:.6f}, la función f(x) = {func_str} se anula.
            """
        elif method == "newton_raphson":
            explanation = f"""
            El método de Newton-Raphson calculó que {root:.6f} es una raíz de la función f(x) = {func_str}.

            Este poderoso método utiliza la derivada de la función para aproximarse rápidamente a la raíz.
            La convergencia fue alcanzada en {len(results)} iteraciones con un error de {results[-1]['error']:.6f}%.

            La característica de convergencia cuadrática de este método lo hace muy eficiente cuando se cuenta con un buen punto inicial.
            """
        elif method == "secant":
            explanation = f"""
            Aplicando el método de la secante, se determinó que {root:.6f} es una raíz de la función f(x) = {func_str}.

            Similar al método de Newton pero sin requerir la derivada analítica, este enfoque utiliza aproximaciones de diferencias finitas.
            El proceso converge después de {len(results)} iteraciones con un error final de {results[-1]['error']:.6f}%.

            Esta raíz representa un punto donde la función cruza el eje X, es decir, donde f({root:.6f}) ≈ 0.
            """
        else:
            explanation = f"""
            Se ha encontrado que {root:.6f} es una raíz de la función f(x) = {func_str} utilizando el método de {method}.

            El proceso de cálculo requirió {len(results)} iteraciones para converger a esta solución con un error de {results[-1]['error']:.6f}%.

            Esta raíz representa un valor de x donde la función f(x) se anula (es igual a cero).
            """

        return jsonify({"explanation": explanation})

    except Exception as e:
        return jsonify({"error": f"Error al generar explicación: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(debug=True)