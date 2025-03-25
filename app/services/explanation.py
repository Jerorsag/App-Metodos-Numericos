# services/explanation.py

def generate_explanation(method, func_str, root, results):
    """Genera una explicación del resultado basada en el método utilizado"""
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

    return explanation