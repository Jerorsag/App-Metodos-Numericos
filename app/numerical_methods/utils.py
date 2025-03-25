# numerical_methods/utils.py
import sympy as sp

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