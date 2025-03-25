/**
 * Módulo para la calculadora matemática avanzada
 * Implementa una interfaz similar a GeoGebra para entrada de funciones
 */

class MathCalculator {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) {
            console.error(`Contenedor no encontrado: ${containerSelector}`);
            return;
        }

        this.inputExpression = ''; // Expresión actual
        this.isValid = false; // Estado de validación

        this.initCalculator();
    }

    initCalculator() {
        // Crear estructura de la calculadora
        this.container.innerHTML = `
            <div class="calculator-container">
                <div class="input-display">
                    <div class="math-input" id="math-input"></div>
                    <div class="validation-feedback" id="validation-feedback"></div>
                    <input type="hidden" id="expression-output">
                </div>
                <div class="calculator-keyboard">
                    <div class="keyboard-row">
                        <button class="calc-btn func-btn" data-value="sin(">sin</button>
                        <button class="calc-btn func-btn" data-value="cos(">cos</button>
                        <button class="calc-btn func-btn" data-value="tan(">tan</button>
                        <button class="calc-btn" data-value="(">(</button>
                        <button class="calc-btn" data-value=")">)</button>
                        <button class="calc-btn operator-btn" data-value="^">x<sup>y</sup></button>
                    </div>
                    <div class="keyboard-row">
                        <button class="calc-btn func-btn" data-value="asin(">asin</button>
                        <button class="calc-btn func-btn" data-value="acos(">acos</button>
                        <button class="calc-btn func-btn" data-value="atan(">atan</button>
                        <button class="calc-btn func-btn" data-value="sqrt(">√</button>
                        <button class="calc-btn" data-value="x">x</button>
                        <button class="calc-btn operator-btn" data-value="*">×</button>
                    </div>
                    <div class="keyboard-row">
                        <button class="calc-btn func-btn" data-value="log(">log</button>
                        <button class="calc-btn func-btn" data-value="ln(">ln</button>
                        <button class="calc-btn func-btn" data-value="exp(">exp</button>
                        <button class="calc-btn func-btn" data-value="e^x">e^x</button> <!-- Nuevo botón e^x -->
                        <button class="calc-btn number-btn" data-value="7">7</button>
                        <button class="calc-btn number-btn" data-value="8">8</button>
                        <button class="calc-btn number-btn" data-value="9">9</button>
                    </div>
                    <div class="keyboard-row">
                        <button class="calc-btn func-btn" data-value="abs(">|x|</button>
                        <button class="calc-btn" data-value="pi">π</button>
                        <button class="calc-btn" data-value="e">e</button>
                        <button class="calc-btn number-btn" data-value="4">4</button>
                        <button class="calc-btn number-btn" data-value="5">5</button>
                        <button class="calc-btn number-btn" data-value="6">6</button>
                    </div>
                    <div class="keyboard-row">
                        <button class="calc-btn operator-btn" data-value="+">+</button>
                        <button class="calc-btn operator-btn" data-value="-">−</button>
                        <button class="calc-btn operator-btn" data-value="/"">÷</button>
                        <button class="calc-btn number-btn" data-value="1">1</button>
                        <button class="calc-btn number-btn" data-value="2">2</button>
                        <button class="calc-btn number-btn" data-value="3">3</button>
                    </div>
                    <div class="keyboard-row">
                        <button class="calc-btn clear-btn" data-action="clear">C</button>
                        <button class="calc-btn backspace-btn" data-action="backspace">⌫</button>
                        <button class="calc-btn number-btn" data-value=".">.</button>
                        <button class="calc-btn number-btn" data-value="0">0</button>
                        <button class="calc-btn equals-btn" data-action="equals">=</button>
                    </div>
                </div>
            </div>
        `;

        // Configurar el campo de entrada matemática con MathQuill
        const mathFieldSpan = document.getElementById('math-input');
        this.mathField = MQ.MathField(mathFieldSpan, {
            spaceBehavesLikeTab: true,
            handlers: {
                edit: () => this.onInputChange()
            }
        });

        // Configurar los eventos para los botones
        this.setupButtonEvents();

        // Configurar evento especial para el botón e^x
    const exponentButton = this.container.querySelector('.calc-btn[data-value="e^x"]');
    if (exponentButton) {
        exponentButton.addEventListener('click', () => {
            this.mathField.write('e^{x}');
            this.mathField.focus();
            this.onInputChange();
        });
    }
    }

    setupButtonEvents() {
        // Botones con valores
        const buttons = this.container.querySelectorAll('.calc-btn[data-value]');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const value = button.getAttribute('data-value');
                this.insertValue(value);
            });
        });

        // Botones de acción
        const actionButtons = this.container.querySelectorAll('.calc-btn[data-action]');
        actionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-action');
                this.performAction(action);
            });
        });
    }

    insertValue(value) {
        // Insertar el valor en la posición actual del cursor
        this.mathField.write(value);
        this.mathField.focus();
        this.onInputChange();
    }

    performAction(action) {
        switch(action) {
            case 'clear':
                this.mathField.latex('');
                break;
            case 'backspace':
                this.mathField.keystroke('Backspace');
                break;
            case 'equals':
                // Evaluar la expresión
                this.evaluateExpression();
                break;
        }
        this.onInputChange();
    }

    onInputChange() {
        const latex = this.mathField.latex();
        this.inputExpression = this.latexToMathJS(latex);

        // Actualizar el campo oculto con la expresión
        const outputField = document.getElementById('expression-output');
        if (outputField) {
            outputField.value = this.inputExpression;
        }

        // Actualizar el campo de función si existe
        const functionInput = document.getElementById('function');
        if (functionInput) {
            functionInput.value = this.inputExpression;
        }

        // Validar la expresión
        this.validateExpression();
    }

    latexToMathJS(latex) {
    // Conversión básica de LaTeX a sintaxis de math.js
    let expr = latex;

    // Manejar expresiones con e^x específicamente
    expr = expr.replace(/e\^{([^}]+)}/g, 'exp($1)');
    expr = expr.replace(/e\^([a-zA-Z0-9]+)/g, 'exp($1)');

    // Reemplazar comandos LaTeX con funciones de math.js
    expr = expr.replace(/\\sin/g, 'sin');
    expr = expr.replace(/\\cos/g, 'cos');
    expr = expr.replace(/\\tan/g, 'tan');
    expr = expr.replace(/\\log/g, 'log10');
    expr = expr.replace(/\\ln/g, 'log');
    expr = expr.replace(/\\sqrt/g, 'sqrt');
    expr = expr.replace(/\\pi/g, 'pi');
    expr = expr.replace(/\\exp/g, 'exp');
    expr = expr.replace(/\\cdot/g, '*');  // Reemplazar \cdot por *

    // Reemplazar potencias
    expr = expr.replace(/\^{([^}]+)}/g, '^($1)');

    return expr;
}

    validateExpression() {
        const feedbackElement = document.getElementById('validation-feedback');
        if (!feedbackElement) return;

        try {
            // Evaluar la expresión con x = 1 para validar
            if (this.inputExpression) {
                math.evaluate(this.inputExpression.replace(/x/g, '1'));
                feedbackElement.textContent = "✓ Expresión válida";
                feedbackElement.className = "validation-feedback valid";
                this.isValid = true;
            } else {
                feedbackElement.textContent = "Ingrese una expresión";
                feedbackElement.className = "validation-feedback";
                this.isValid = false;
            }
        } catch (e) {
            feedbackElement.textContent = "✗ Error: " + e.message;
            feedbackElement.className = "validation-feedback invalid";
            this.isValid = false;
        }

        // Emitir evento de cambio de validación
        const event = new CustomEvent('validation-change', {
            detail: { isValid: this.isValid, expression: this.inputExpression }
        });
        this.container.dispatchEvent(event);
    }

    evaluateExpression() {
        try {
            if (!this.inputExpression) return;

            // Crear una función a partir de la expresión
            const f = x => math.evaluate(this.inputExpression, {x: x});

            // Generar algunos valores de prueba
            const testValues = [-2, -1, 0, 1, 2];
            const results = testValues.map(x => ({x, y: f(x)}));

            console.log('Evaluación de la función:', results);

            // Emitir evento con los resultados
            const event = new CustomEvent('expression-evaluated', {
                detail: {
                    expression: this.inputExpression,
                    results: results
                }
            });
            this.container.dispatchEvent(event);

        } catch (e) {
            console.error('Error al evaluar la expresión:', e);
        }
    }

    getExpression() {
        return this.inputExpression;
    }

    isExpressionValid() {
        return this.isValid;
    }

    setExpression(expr) {
        // Convertir la expresión a LaTeX e insertarla
        this.mathField.latex(expr);
        this.onInputChange();
    }
}

// Inicializar MathQuill
var MQ = MathQuill.getInterface(2);

// Exportar la clase para uso global
window.MathCalculator = MathCalculator;