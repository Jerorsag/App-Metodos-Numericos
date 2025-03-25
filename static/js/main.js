/**
 * Script principal para la aplicación de métodos numéricos
 * Integra la calculadora, la visualización y el historial
 */

document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const methodSelect = document.getElementById('method');
    const methodParams = document.getElementById('method-params');
    const form = document.getElementById('numeric-method-form');
    const resultsSection = document.getElementById('results-section');
    const backButton = document.getElementById('back-button');
    const plotImage = document.getElementById('plot-image');
    const resultsTable = document.getElementById('results-table');
    const rootValue = document.getElementById('root-value');

    // Elementos para la visualización
    const plotContainer = document.getElementById('plot-container');
    const iterationInfo = document.getElementById('iteration-info');
    const playButton = document.getElementById('play-button');
    const stepForwardButton = document.getElementById('step-forward-button');
    const stepBackButton = document.getElementById('step-back-button');
    const resetButton = document.getElementById('reset-button');
    const speedSlider = document.getElementById('animation-speed');

    // Elementos para la explicación IA
    const explainButton = document.getElementById('explain-button');
    const explanationContainer = document.getElementById('explanation-container');

    // Modal de error
    const errorModal = new bootstrap.Modal(document.getElementById('error-modal'));
    const errorMessage = document.getElementById('error-message');

    // Instancias de componentes
    let calculator = null;
    let visualizer = null;

    // Variables de estado
    let currentCalculationId = null;

    // Inicializar la calculadora
    function initCalculator() {
        // Verificar si existe el contenedor
        const calculatorContainer = document.getElementById('calculator-container');
        if (!calculatorContainer || typeof MathCalculator === 'undefined') return;

        // Inicializar la calculadora
        calculator = new MathCalculator('#calculator-container');

        // Conectar con el campo de función
        const functionInput = document.getElementById('function');
        if (functionInput) {
            // Escuchar cambios en la calculadora
            calculatorContainer.addEventListener('validation-change', function(e) {
                functionInput.value = e.detail.expression;
                validateForm();
            });

            // Inicializar con el valor actual si existe
            if (functionInput.value) {
                calculator.setExpression(functionInput.value);
            }
        }
    }

    // Inicializar el visualizador
    function initVisualizer() {
        // Verificar si existen los contenedores
        if (!plotContainer || !iterationInfo || typeof NumericalMethodsVisualizer === 'undefined') return;

        // Inicializar el visualizador
        visualizer = new NumericalMethodsVisualizer('plot-container', 'iteration-info');

        // Configurar controles de animación
        if (playButton) {
            playButton.addEventListener('click', function() {
                if (visualizer) {
                    if (this.innerHTML.includes('Reproducir')) {
                        visualizer.playAnimation();
                        this.innerHTML = '<i class="fas fa-pause"></i> Pausar';
                    } else {
                        visualizer.pauseAnimation();
                        this.innerHTML = '<i class="fas fa-play"></i> Reproducir';
                    }
                }
            });
        }

        if (stepForwardButton) {
            stepForwardButton.addEventListener('click', function() {
                if (visualizer) {
                    visualizer.stepForward();
                    // Actualizar botón de reproducción
                    if (playButton) {
                        playButton.innerHTML = '<i class="fas fa-play"></i> Reproducir';
                    }
                }
            });
        }

        if (stepBackButton) {
            stepBackButton.addEventListener('click', function() {
                if (visualizer) {
                    visualizer.stepBackward();
                    // Actualizar botón de reproducción
                    if (playButton) {
                        playButton.innerHTML = '<i class="fas fa-play"></i> Reproducir';
                    }
                }
            });
        }

        if (resetButton) {
            resetButton.addEventListener('click', function() {
                if (visualizer) {
                    visualizer.resetAnimation();
                    // Actualizar botón de reproducción
                    if (playButton) {
                        playButton.innerHTML = '<i class="fas fa-play"></i> Reproducir';
                    }
                }
            });
        }

        if (speedSlider) {
            speedSlider.addEventListener('change', function() {
                if (visualizer) {
                    const speed = parseInt(this.value);
                    visualizer.setAnimationSpeed(speed);
                }
            });

            // Actualizar el texto de la velocidad
            speedSlider.addEventListener('input', function() {
                const speedLabel = document.getElementById('speed-value');
                if (speedLabel) {
                    const speed = parseInt(this.value);
                    speedLabel.textContent = (speed / 1000).toFixed(1) + ' s';
                }
            });
        }
    }

    // Cambios en el método seleccionado
    if (methodSelect) {
        methodSelect.addEventListener('change', function() {
            updateMethodParams();
        });
    }

    // Evento de envío del formulario
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            calculateRoot();
        });
    }

    // Botón de volver
    if (backButton) {
        backButton.addEventListener('click', function() {
            resultsSection.style.display = 'none';
            form.parentElement.parentElement.style.display = 'block';
        });
    }

    // Botón de explicación
    if (explainButton) {
        explainButton.addEventListener('click', function() {
            if (!currentCalculationId) {
                showError('No hay cálculo actual para explicar.');
                return;
            }

            getExplanation(currentCalculationId);
        });
    }

    // Función para actualizar los parámetros según el método seleccionado
    function updateMethodParams() {
        const method = methodSelect.value;
        methodParams.innerHTML = '';

        if (!method) return;

        const paramsContainer = document.createElement('div');
        paramsContainer.className = 'method-params-container mt-3 mb-3';

        const paramsTitle = document.createElement('h5');
        paramsTitle.className = 'method-params-title';
        paramsTitle.textContent = 'Parámetros del método';
        paramsContainer.appendChild(paramsTitle);

        const row = document.createElement('div');
        row.className = 'row';

        // Parámetros específicos según el método
        switch(method) {
            case 'bisection':
            case 'false_position':
                // Intervalo [a, b]
                const colA = document.createElement('div');
                colA.className = 'col-md-6';
                colA.innerHTML = `
                    <label for="a" class="form-label">Extremo inferior (a):</label>
                    <input type="number" class="form-control" id="a" required step="any">
                `;

                const colB = document.createElement('div');
                colB.className = 'col-md-6';
                colB.innerHTML = `
                    <label for="b" class="form-label">Extremo superior (b):</label>
                    <input type="number" class="form-control" id="b" required step="any">
                `;

                row.appendChild(colA);
                row.appendChild(colB);
                break;

            case 'fixed_point':
                // Punto inicial x0 y función g(x)
                const colX0FP = document.createElement('div');
                colX0FP.className = 'col-md-6';
                colX0FP.innerHTML = `
                    <label for="x0" class="form-label">Punto inicial (x0):</label>
                    <input type="number" class="form-control" id="x0" required step="any">
                `;

                const colG = document.createElement('div');
                colG.className = 'col-md-6';
                colG.innerHTML = `
                    <label for="g_function" class="form-label">Función de iteración g(x):</label>
                    <input type="text" class="form-control" id="g_function" required placeholder="Ejemplo: (x+2)/2">
                    <small class="text-muted">La función debe cumplir que g(x) = x en la raíz</small>
                `;

                row.appendChild(colX0FP);
                row.appendChild(colG);
                break;

            case 'newton_raphson':
                // Punto inicial x0
                const colX0NR = document.createElement('div');
                colX0NR.className = 'col-md-6 mx-auto';
                colX0NR.innerHTML = `
                    <label for="x0" class="form-label">Punto inicial (x0):</label>
                    <input type="number" class="form-control" id="x0" required step="any">
                `;

                row.appendChild(colX0NR);
                break;

            case 'secant':
                // Puntos iniciales x0 y x1
                const colX0S = document.createElement('div');
                colX0S.className = 'col-md-6';
                colX0S.innerHTML = `
                    <label for="x0" class="form-label">Primer punto (x0):</label>
                    <input type="number" class="form-control" id="x0" required step="any">
                `;

                const colX1 = document.createElement('div');
                colX1.className = 'col-md-6';
                colX1.innerHTML = `
                    <label for="x1" class="form-label">Segundo punto (x1):</label>
                    <input type="number" class="form-control" id="x1" required step="any">
                `;

                row.appendChild(colX0S);
                row.appendChild(colX1);
                break;
        }

        paramsContainer.appendChild(row);
        methodParams.appendChild(paramsContainer);
    }

    // Función para validar el formulario
    function validateForm() {
        const method = methodSelect.value;
        const func = document.getElementById('function').value;
        const submitButton = form.querySelector('button[type="submit"]');

        let isValid = method && func;

        // Validar parámetros específicos según el método
        switch(method) {
            case 'bisection':
            case 'false_position':
                const a = document.getElementById('a');
                const b = document.getElementById('b');
                isValid = isValid && a && b && a.value !== '' && b.value !== '';
                break;

            case 'fixed_point':
                const x0FP = document.getElementById('x0');
                const g = document.getElementById('g_function');
                isValid = isValid && x0FP && g && x0FP.value !== '' && g.value !== '';
                break;

            case 'newton_raphson':
                const x0NR = document.getElementById('x0');
                isValid = isValid && x0NR && x0NR.value !== '';
                break;

            case 'secant':
                const x0S = document.getElementById('x0');
                const x1 = document.getElementById('x1');
                isValid = isValid && x0S && x1 && x0S.value !== '' && x1.value !== '';
                break;
        }

        // Actualizar estado del botón
        if (submitButton) {
            submitButton.disabled = !isValid;
        }

        return isValid;
    }

    // Función para calcular la raíz
    function calculateRoot() {
        const method = methodSelect.value;
        const func = document.getElementById('function').value;
        const tolerance = document.getElementById('tolerance').value;
        const maxIterations = document.getElementById('max_iterations').value;

        if (!validateForm()) {
            showError('Por favor, complete todos los campos requeridos.');
            return;
        }

        // Construir objeto de datos según el método
        const data = {
            method: method,
            function: func,
            tolerance: tolerance,
            max_iterations: maxIterations
        };

        // Añadir parámetros específicos según el método
        switch(method) {
            case 'bisection':
            case 'false_position':
                data.a = parseFloat(document.getElementById('a').value);
                data.b = parseFloat(document.getElementById('b').value);
                break;

            case 'fixed_point':
                data.x0 = parseFloat(document.getElementById('x0').value);
                data.g_function = document.getElementById('g_function').value;
                break;

            case 'newton_raphson':
                data.x0 = parseFloat(document.getElementById('x0').value);
                break;

            case 'secant':
                data.x0 = parseFloat(document.getElementById('x0').value);
                data.x1 = parseFloat(document.getElementById('x1').value);
                break;
        }

        // Mostrar indicador de carga
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Calculando...</span></div>';
        form.appendChild(loadingIndicator);

        // Enviar solicitud al servidor
        fetch('/api/solve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            // Eliminar indicador de carga
            loadingIndicator.remove();

            if (data.error) {
                showError(data.error);
                return;
            }

            // Guardar el ID del cálculo actual
            currentCalculationId = data.calc_id;

            // Mostrar resultados
            showResults(data);
        })
        .catch(error => {
            // Eliminar indicador de carga
            loadingIndicator.remove();

            showError('Error de conexión: ' + error.message);
        });
    }

    // Función para mostrar resultados
    function showResults(data) {
        // Mostrar la gráfica estática
        if (plotContainer && !visualizer) {
            // Si no tenemos visualizador, mostrar la imagen estática
            plotContainer.innerHTML = `<img src="data:image/png;base64,${data.plot_img}" class="img-fluid" alt="Gráfica">`;
        } else if (visualizer) {
            // Si tenemos visualizador, cargar los datos para la animación
            visualizer.loadData(
                data.plot_data,
                data.results,
                data.animation_data,
                methodSelect.value
            );

            // Habilitar controles de animación
            if (playButton) playButton.disabled = false;
            if (stepForwardButton) stepForwardButton.disabled = false;
            if (stepBackButton) stepBackButton.disabled = false;
            if (resetButton) resetButton.disabled = false;

            // Reiniciar el estado del botón de reproducción
            if (playButton) {
                playButton.innerHTML = '<i class="fas fa-play"></i> Reproducir';
            }
        }

        // Llenar la tabla de resultados
        resultsTable.innerHTML = '';
        data.results.forEach(row => {
            const tr = document.createElement('tr');

            // Iteración
            const tdIteracion = document.createElement('td');
            tdIteracion.textContent = row.iteration;
            tr.appendChild(tdIteracion);

            // a
            const tdA = document.createElement('td');
            tdA.textContent = row.a !== null ? row.a.toFixed(6) : '-';
            tr.appendChild(tdA);

            // b
            const tdB = document.createElement('td');
            tdB.textContent = row.b !== null ? row.b.toFixed(6) : '-';
            tr.appendChild(tdB);

            // xr
            const tdXr = document.createElement('td');
            tdXr.textContent = row.xr.toFixed(6);
            tr.appendChild(tdXr);

            // f(xr)
            const tdFxr = document.createElement('td');
            tdFxr.textContent = row['f(xr)'].toFixed(6);
            tr.appendChild(tdFxr);

            // Error
            const tdError = document.createElement('td');
            tdError.textContent = row.error.toFixed(6);
            tr.appendChild(tdError);

            resultsTable.appendChild(tr);
        });

        // Mostrar la raíz encontrada
        rootValue.textContent = data.root.toFixed(6);

        // Habilitar el botón de explicación
        if (explainButton) {
            explainButton.disabled = false;
        }

        // Limpiar contenedor de explicación
        if (explanationContainer) {
            explanationContainer.innerHTML = '<p class="text-muted">Haz clic en "Generar Explicación" para obtener una interpretación del resultado.</p>';
        }

        // Ocultar el formulario y mostrar resultados
        form.parentElement.parentElement.style.display = 'none';
        resultsSection.style.display = 'block';

        // Desplazarse al inicio de la sección de resultados
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Obtener explicación IA del resultado
    function getExplanation(calcId) {
        if (!calcId || !explanationContainer) return;

        // Mostrar indicador de carga
        explanationContainer.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Generando explicación...</span></div>';

        // Solicitar explicación al servidor
        fetch('/api/explain', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                calc_id: calcId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                explanationContainer.innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
                return;
            }

            // Mostrar la explicación
            explanationContainer.innerHTML = `
                <div class="explanation-box">
                    <div class="explanation-icon">
                        <i class="fas fa-lightbulb"></i>
                    </div>
                    <div class="explanation-content">
                        ${data.explanation}
                    </div>
                </div>
            `;
        })
        .catch(error => {
            explanationContainer.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        });
    }

    // Función para mostrar errores
    function showError(message) {
        errorMessage.textContent = message;
        errorModal.show();
    }

    // Inicializar la interfaz
    if (methodSelect && methodSelect.value) {
        updateMethodParams();
    }

    // Agregar validación en tiempo real
    document.addEventListener('input', function() {
        validateForm();
    });

    // Inicializar componentes avanzados
    initCalculator();
    initVisualizer();

    // Funcionalidad para los elementos del historial
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', function() {
            const historyId = this.getAttribute('data-id');
            if (historyId) {
                loadHistoryItem(historyId);
            }
        });
    });

    // Cargar un elemento del historial
    function loadHistoryItem(id) {
        fetch(`/api/history/${id}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    showError(data.error);
                    return;
                }

                // Llenar el formulario con los datos históricos
                methodSelect.value = data.method;
                updateMethodParams();

                // Esperar a que se creen los campos
                setTimeout(() => {
                    document.getElementById('function').value = data.function;

                    // Llenar los parámetros específicos según el método
                    const params = data.parameters;

                    switch(data.method) {
                        case 'bisection':
                        case 'false_position':
                            document.getElementById('a').value = params.a;
                            document.getElementById('b').value = params.b;
                            break;

                        case 'fixed_point':
                            document.getElementById('x0').value = params.x0;
                            document.getElementById('g_function').value = params.g_function;
                            break;

                        case 'newton_raphson':
                            document.getElementById('x0').value = params.x0;
                            break;

                        case 'secant':
                            document.getElementById('x0').value = params.x0;
                            document.getElementById('x1').value = params.x1;
                            break;
                    }

                    document.getElementById('tolerance').value = params.tolerance;
                    document.getElementById('max_iterations').value = params.max_iterations;

                    // Actualizar la calculadora si existe
                    if (calculator) {
                        calculator.setExpression(data.function);
                    }

                    // Simular un clic en el botón de calcular
                    calculateRoot();
                }, 500);
            })
            .catch(error => {
                showError('Error al cargar el historial: ' + error.message);
            });
    }

    // Verificar si hay un parámetro de historial en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const historyParam = urlParams.get('history');
    if (historyParam) {
        loadHistoryItem(historyParam);
    }
});