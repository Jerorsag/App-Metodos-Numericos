# services/plotting.py
import numpy as np
import io
import base64
from matplotlib.figure import Figure
import sympy as sp

from app.numerical_methods.utils import evaluate_function


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