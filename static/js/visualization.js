/**
 * Módulo para la visualización y animación de métodos numéricos
 * Implementa gráficas interactivas y animaciones paso a paso
 */

class NumericalMethodsVisualizer {
    constructor(graphContainerId, infoContainerId) {
        this.graphContainer = document.getElementById(graphContainerId);
        this.infoContainer = document.getElementById(infoContainerId);

        if (!this.graphContainer) {
            console.error(`Contenedor de gráfica no encontrado: ${graphContainerId}`);
            return;
        }

        // Estado de la animación
        this.animationState = {
            isPlaying: false,
            currentStep: 0,
            totalSteps: 0,
            speed: 1000, // ms por paso
            intervalId: null
        };

        // Datos de la visualización
        this.plotData = null;
        this.iterations = [];
        this.animationData = [];
        this.method = '';

        // Inicializar la visualización vacía
        this.initPlot();
    }

    // Inicializar la gráfica vacía
    initPlot() {
        // Verificar si Plotly está disponible
        if (typeof Plotly === 'undefined') {
            console.error('Plotly no está disponible. Asegúrate de incluir el script de Plotly.');
            this.graphContainer.innerHTML = '<div class="alert alert-danger">Error: Plotly no está disponible</div>';
            return;
        }

        // Configuración básica de Plotly
        const layout = {
            title: 'Visualización de Método Numérico',
            xaxis: {
                title: 'x',
                zeroline: true,
                showgrid: true
            },
            yaxis: {
                title: 'y',
                zeroline: true,
                showgrid: true
            },
            showlegend: true,
            hovermode: 'closest',
            margin: { l: 50, r: 30, b: 50, t: 80, pad: 4 }
        };

        // Crear la gráfica inicial vacía
        Plotly.newPlot(this.graphContainer, [], layout, {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['lasso2d', 'select2d']
        });
    }

    // Cargar nuevos datos para visualizar
    loadData(plotData, iterations, animationData, method) {
        this.plotData = plotData;
        this.iterations = iterations || [];
        this.animationData = animationData || [];
        this.method = method;

        this.animationState.totalSteps = this.iterations.length;

        // Reiniciar estado de animación
        this.resetAnimation();

        // Dibujar la gráfica inicial
        this.drawInitialPlot();
    }

    // Dibujar la gráfica inicial sin iteraciones
    drawInitialPlot() {
        if (!this.plotData) return;

        const x = this.plotData.x_range;
        const y = this.plotData.y_values;

        const traces = [{
            x: x,
            y: y,
            type: 'scatter',
            mode: 'lines',
            name: `f(x) = ${this.plotData.func_str}`,
            line: { color: 'blue', width: 2 }
        }];

        // Si es método de punto fijo, agregar g(x) y y=x
        if (this.method === 'fixed_point' && this.plotData.g_values) {
            // Gráfica de g(x)
            traces.push({
                x: x,
                y: this.plotData.g_values,
                type: 'scatter',
                mode: 'lines',
                name: `g(x) = ${this.plotData.g_func_str}`,
                line: { color: 'green', width: 2 }
            });

            // Línea y = x
            traces.push({
                x: x,
                y: x,
                type: 'scatter',
                mode: 'lines',
                name: 'y = x',
                line: { color: 'black', dash: 'dash', width: 1 }
            });
        }

        // Eje x
        traces.push({
            x: x,
            y: Array(x.length).fill(0),
            type: 'scatter',
            mode: 'lines',
            name: 'y = 0',
            line: { color: 'gray', width: 1 },
            showlegend: false
        });

        // Agregar el punto de la raíz si está disponible
        if (this.plotData.root !== undefined && this.plotData.root !== null) {
            traces.push({
                x: [this.plotData.root],
                y: [0],
                type: 'scatter',
                mode: 'markers',
                name: 'Raíz',
                marker: {
                    color: 'red',
                    size: 10,
                    symbol: 'circle'
                }
            });
        }

        // Actualizar la gráfica
        try {
            Plotly.react(this.graphContainer, traces, {
                title: `Método de ${this.method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
                xaxis: {
                    title: 'x',
                    zeroline: true,
                },
                yaxis: {
                    title: 'y',
                    zeroline: true,
                }
            });
        } catch (error) {
            console.error('Error al actualizar la gráfica:', error);
            this.graphContainer.innerHTML = `<div class="alert alert-danger">Error al dibujar gráfica: ${error.message}</div>`;
        }

        // Limpiar la información de iteración
        if (this.infoContainer) {
            this.infoContainer.innerHTML = '<p>Presiona Play para iniciar la animación paso a paso.</p>';
        }
    }

    // Actualizar la visualización para mostrar la iteración actual
    updateVisualization(step) {
        if (!this.plotData || step >= this.iterations.length) return;

        const iteration = this.iterations[step];
        const animPoint = step < this.animationData.length ? this.animationData[step] : null;

        // Obtener los trazos actuales
        const traces = this.graphContainer.data;
        let updatedTraces = [...traces]; // Copia para trabajar

        // Eliminar los trazos de animación previos (posición 3 en adelante, dejando función, g(x) y y=x)
        const baseTraces = this.method === 'fixed_point' ? 4 : 2;
        if (updatedTraces.length > baseTraces) {
            updatedTraces = updatedTraces.slice(0, baseTraces);
        }

        // Generar nuevos trazos según el método
        const newTraces = this.generateMethodTraces(iteration, animPoint, step);

        // Combinar todos los trazos
        updatedTraces = [...updatedTraces, ...newTraces];

        // Actualizar la gráfica
        try {
            Plotly.react(this.graphContainer, updatedTraces, this.graphContainer.layout);
        } catch (error) {
            console.error('Error al actualizar la gráfica de iteración:', error);
        }

        // Actualizar información de la iteración
        this.updateIterationInfo(iteration, step);
    }

    // Generar trazos específicos para cada método
    generateMethodTraces(iteration, animPoint, step) {
        const traces = [];

        switch(this.method) {
            case 'bisection':
            case 'false_position':
                // Marcar los extremos del intervalo
                traces.push({
                    x: [iteration.a, iteration.b],
                    y: [0, 0],
                    type: 'scatter',
                    mode: 'markers',
                    name: 'Intervalo',
                    marker: {
                        color: ['orange', 'purple'],
                        size: 10,
                        symbol: ['circle', 'circle']
                    }
                });

                // Marcar el punto medio o de intersección
                traces.push({
                    x: [iteration.xr],
                    y: [iteration['f(xr)']],
                    type: 'scatter',
                    mode: 'markers',
                    name: 'Punto de corte',
                    marker: {
                        color: 'red',
                        size: 12,
                        symbol: 'star'
                    }
                });

                // Línea vertical desde el punto a la curva
                traces.push({
                    x: [iteration.xr, iteration.xr],
                    y: [0, iteration['f(xr)']],
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Evaluación',
                    line: { color: 'red', dash: 'dot', width: 1 },
                    showlegend: false
                });

                // Si es falsa posición, mostrar la recta secante
                if (this.method === 'false_position' && animPoint) {
                    const xa = iteration.a;
                    const xb = iteration.b;

                    // Intentar obtener fa y fb directamente del animPoint
                    let fa, fb;
                    if (animPoint && 'fa' in animPoint && 'fb' in animPoint) {
                        fa = animPoint.fa;
                        fb = animPoint.fb;
                    } else {
                        // Si no están disponibles, intentar evaluarlos
                        try {
                            fa = evaluate_function(this.plotData.func_str, xa);
                            fb = evaluate_function(this.plotData.func_str, xb);
                        } catch (error) {
                            console.error('Error al evaluar puntos para recta secante:', error);
                            return traces;
                        }
                    }

                    traces.push({
                        x: [xa, xb],
                        y: [fa, fb],
                        type: 'scatter',
                        mode: 'lines',
                        name: 'Recta Secante',
                        line: { color: 'purple', width: 2 },
                        showlegend: step === 0
                    });
                }
                break;

            case 'fixed_point':
                if (iteration.x_prev === undefined) return traces;

                const x_prev = iteration.x_prev;
                const g_x_prev = iteration.g_x_prev || evaluate_function(this.plotData.g_func_str, x_prev);

                // Marcar el punto (x, g(x))
                traces.push({
                    x: [x_prev],
                    y: [g_x_prev],
                    type: 'scatter',
                    mode: 'markers',
                    name: 'g(x)',
                    marker: {
                        color: 'green',
                        size: 10
                    }
                });

                // Línea horizontal desde (x, g(x)) a (g(x), g(x))
                traces.push({
                    x: [x_prev, iteration.xr],
                    y: [g_x_prev, g_x_prev],
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Paso horizontal',
                    line: { color: 'orange', dash: 'dot', width: 2 },
                    showlegend: false
                });

                // Línea vertical desde (g(x), g(x)) a (g(x), g(g(x)))
                traces.push({
                    x: [iteration.xr, iteration.xr],
                    y: [g_x_prev, iteration['f(xr)']],
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Paso vertical',
                    line: { color: 'purple', dash: 'dot', width: 2 },
                    showlegend: false
                });
                break;

            case 'newton_raphson':
                if (iteration.f_prime_x === undefined) return traces;

                // Calcular puntos para la tangente
                const tangent_m = iteration.f_prime_x;
                const tangent_b = iteration.tangent_b || (iteration['f(xr)'] - tangent_m * iteration.xr);

                // Determinar los límites de x para la tangente
                const x_range = this.plotData.x_range;
                const x_min = Math.min(...x_range);
                const x_max = Math.max(...x_range);

                const tangent_x = [x_min, x_max];
                const tangent_y = tangent_x.map(x => tangent_m * x + tangent_b);

                // Dibujar la tangente
                traces.push({
                    x: tangent_x,
                    y: tangent_y,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Tangente',
                    line: { color: 'red', width: 2 },
                    showlegend: step === 0
                });

                // Marcar el punto en la curva
                traces.push({
                    x: [iteration.xr],
                    y: [iteration['f(xr)']],
                    type: 'scatter',
                    mode: 'markers',
                    name: 'Punto actual',
                    marker: {
                        color: 'red',
                        size: 10
                    },
                    showlegend: step === 0
                });

                // Marcar la intersección con el eje x (próximo punto)
                if (iteration.x_next !== undefined) {
                    traces.push({
                        x: [iteration.x_next],
                        y: [0],
                        type: 'scatter',
                        mode: 'markers',
                        name: 'Próximo punto',
                        marker: {
                            color: 'green',
                            size: 10,
                            symbol: 'diamond'
                        },
                        showlegend: step === 0
                    });
                }

                // Línea vertical desde el punto a la curva
                traces.push({
                    x: [iteration.xr, iteration.xr],
                    y: [0, iteration['f(xr)']],
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Evaluación',
                    line: { color: 'gray', dash: 'dot', width: 1 },
                    showlegend: false
                });
                break;

            case 'secant':
                if (iteration.m_secant === undefined && animPoint === null) return traces;

                // Obtener los valores para la secante
                let secant_m, secant_b;

                if (iteration.m_secant !== undefined && iteration.b_secant !== undefined) {
                    secant_m = iteration.m_secant;
                    secant_b = iteration.b_secant;
                } else if (animPoint && animPoint.m_secant !== undefined && animPoint.b_secant !== undefined) {
                    secant_m = animPoint.m_secant;
                    secant_b = animPoint.b_secant;
                } else {
                    // Si no hay datos disponibles, intentar calcularlos
                    try {
                        const f_a = evaluate_function(this.plotData.func_str, iteration.a);
                        const f_b = evaluate_function(this.plotData.func_str, iteration.b);
                        secant_m = (f_b - f_a) / (iteration.b - iteration.a);
                        secant_b = f_b - secant_m * iteration.b;
                    } catch (error) {
                        console.error('Error al calcular secante:', error);
                        return traces;
                    }
                }

                const sec_x_min = Math.min(...this.plotData.x_range);
                const sec_x_max = Math.max(...this.plotData.x_range);
                const secant_x = [sec_x_min, sec_x_max];
                const secant_y = secant_x.map(x => secant_m * x + secant_b);

                // Dibujar la secante
                traces.push({
                    x: secant_x,
                    y: secant_y,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Secante',
                    line: { color: 'purple', width: 2 },
                    showlegend: step === 0
                });

                // Marcar los dos puntos anteriores
                try {
                    const f_a = evaluate_function(this.plotData.func_str, iteration.a);
                    const f_b = evaluate_function(this.plotData.func_str, iteration.b);

                    traces.push({
                        x: [iteration.a, iteration.b],
                        y: [f_a, f_b],
                        type: 'scatter',
                        mode: 'markers',
                        name: 'Puntos previos',
                        marker: {
                            color: ['blue', 'orange'],
                            size: 10
                        },
                        showlegend: step === 0
                    });
                } catch (error) {
                    console.error('Error al evaluar puntos para secante:', error);
                }

                // Marcar la intersección con el eje x (próximo punto)
                traces.push({
                    x: [iteration.xr],
                    y: [0],
                    type: 'scatter',
                    mode: 'markers',
                    name: 'Nuevo punto',
                    marker: {
                        color: 'red',
                        size: 10,
                        symbol: 'star'
                    },
                    showlegend: step === 0
                });
                break;
        }

        return traces;
    }

    // Actualizar la información textual sobre la iteración actual
    updateIterationInfo(iteration, step) {
        if (!this.infoContainer) return;

        // Formatear la información según el método
        let infoHTML = `
            <div class="iteration-info">
                <h4>Iteración ${step + 1} de ${this.iterations.length}</h4>
                <table class="iteration-table">
                    <tr>
                        <th>Iteración</th>
                        <td>${iteration.iteration}</td>
                    </tr>
        `;

        // Campos específicos según el método
        switch(this.method) {
            case 'bisection':
            case 'false_position':
                infoHTML += `
                    <tr>
                        <th>Intervalo [a, b]</th>
                        <td>[${iteration.a.toFixed(6)}, ${iteration.b.toFixed(6)}]</td>
                    </tr>
                `;
                break;

            case 'newton_raphson':
                if (iteration.f_prime_x !== undefined) {
                    infoHTML += `
                        <tr>
                            <th>f'(x)</th>
                            <td>${iteration.f_prime_x.toFixed(6)}</td>
                        </tr>
                    `;
                }
                break;

            case 'secant':
                infoHTML += `
                    <tr>
                        <th>Puntos [x₀, x₁]</th>
                        <td>[${iteration.a.toFixed(6)}, ${iteration.b.toFixed(6)}]</td>
                    </tr>
                `;
                break;
        }

        // Campos comunes a todos los métodos
        infoHTML += `
                <tr>
                    <th>x</th>
                    <td>${iteration.xr.toFixed(6)}</td>
                </tr>
                <tr>
                    <th>f(x)</th>
                    <td>${iteration['f(xr)'].toFixed(6)}</td>
                </tr>
                <tr>
                    <th>Error relativo (%)</th>
                    <td>${iteration.error.toFixed(6)}</td>
                </tr>
            </table>
        `;

        // Descripción del paso actual según el método
        let stepDescription = '';
        switch(this.method) {
            case 'bisection':
                stepDescription = `
                    <p>Se evalúa la función en el punto medio entre a = ${iteration.a.toFixed(4)} y b = ${iteration.b.toFixed(4)}.</p>
                    <p>El nuevo punto xr = ${iteration.xr.toFixed(6)} tiene f(xr) = ${iteration['f(xr)'].toFixed(6)}.</p>
                    <p>Para la siguiente iteración, se selecciona el subintervalo donde la función cambia de signo.</p>
                `;
                break;

            case 'false_position':
                stepDescription = `
                    <p>Se calcula el punto de corte de la recta que une los extremos del intervalo con el eje x.</p>
                    <p>El nuevo punto xr = ${iteration.xr.toFixed(6)} tiene f(xr) = ${iteration['f(xr)'].toFixed(6)}.</p>
                    <p>Para la siguiente iteración, se selecciona el subintervalo donde la función cambia de signo.</p>
                `;
                break;

            case 'fixed_point':
                stepDescription = `
                    <p>Se calcula g(x) para el valor actual de x.</p>
                    <p>El nuevo valor de x es ${iteration.xr.toFixed(6)} con f(x) = ${iteration['f(xr)'].toFixed(6)}.</p>
                    <p>El error relativo es ${iteration.error.toFixed(6)}%.</p>
                `;
                break;

            case 'newton_raphson':
                let nextPointMsg = '';
                if (iteration.x_next !== undefined) {
                    nextPointMsg = `<p>El próximo valor de x será ${iteration.x_next.toFixed(6)}.</p>`;
                }

                stepDescription = `
                    <p>Se calcula la tangente a la función en el punto x = ${iteration.xr.toFixed(6)}.</p>
                    ${iteration.f_prime_x !== undefined ? `<p>La pendiente de la tangente es f'(x) = ${iteration.f_prime_x.toFixed(6)}.</p>` : ''}
                    ${nextPointMsg}
                `;
                break;

            case 'secant':
                stepDescription = `
                    <p>Se traza una recta entre los puntos (${iteration.a.toFixed(4)}, f(${iteration.a.toFixed(4)})) y (${iteration.b.toFixed(4)}, f(${iteration.b.toFixed(4)})).</p>
                    <p>La intersección de esta recta con el eje x da el nuevo punto xr = ${iteration.xr.toFixed(6)}.</p>
                    <p>El error relativo es ${iteration.error.toFixed(6)}%.</p>
                `;
                break;
        }

        infoHTML += `
            <div class="step-description">
                <h5>Descripción del paso:</h5>
                ${stepDescription}
            </div>
        </div>
        `;

        this.infoContainer.innerHTML = infoHTML;
    }

    // Iniciar la animación paso a paso
    playAnimation(speed) {
        // Si ya está reproduciendo, detener
        if (this.animationState.isPlaying) {
            this.pauseAnimation();
            return;
        }

        // Actualizar velocidad si se proporciona
        if (speed !== undefined) {
            this.animationState.speed = speed;
        }

        // Si ya terminó, reiniciar
        if (this.animationState.currentStep >= this.iterations.length) {
            this.resetAnimation();
        }

        this.animationState.isPlaying = true;

        // Configurar el intervalo para la animación
        this.animationState.intervalId = setInterval(() => {
            // Mostrar el paso actual
            this.updateVisualization(this.animationState.currentStep);

            // Avanzar al siguiente paso
            this.animationState.currentStep++;

            // Si se alcanzó el final, detener
            if (this.animationState.currentStep >= this.iterations.length) {
                this.pauseAnimation();
            }
        }, this.animationState.speed);
    }

    // Pausar la animación
    pauseAnimation() {
        if (this.animationState.intervalId) {
            clearInterval(this.animationState.intervalId);
            this.animationState.intervalId = null;
        }
        this.animationState.isPlaying = false;
    }

    // Avanzar un paso
    stepForward() {
        // Detener si está reproduciendo
        if (this.animationState.isPlaying) {
            this.pauseAnimation();
        }

        // Verificar si hay más pasos
        if (this.animationState.currentStep < this.iterations.length) {
            this.updateVisualization(this.animationState.currentStep);
            this.animationState.currentStep++;
        }
    }

    // Retroceder un paso
    stepBackward() {
        // Detener si está reproduciendo
        if (this.animationState.isPlaying) {
            this.pauseAnimation();
        }

        // Verificar si se puede retroceder
        if (this.animationState.currentStep > 0) {
            this.animationState.currentStep--;
            this.updateVisualization(this.animationState.currentStep);
        }
    }

    // Reiniciar la animación
    resetAnimation() {
        // Detener si está reproduciendo
        if (this.animationState.isPlaying) {
            this.pauseAnimation();
        }

        this.animationState.currentStep = 0;
        this.drawInitialPlot();
    }

    // Cambiar la velocidad de animación
    setAnimationSpeed(speed) {
        this.animationState.speed = speed;

        // Si está reproduciendo, reiniciar con la nueva velocidad
        if (this.animationState.isPlaying) {
            this.pauseAnimation();
            this.playAnimation();
        }
    }

    // Obtener el estado actual de la animación
    getAnimationState() {
        return {
            isPlaying: this.animationState.isPlaying,
            currentStep: this.animationState.currentStep,
            totalSteps: this.iterations.length,
            speed: this.animationState.speed
        };
    }

    // Exportar la gráfica como imagen
    exportImage(filename = 'metodo-numerico.png') {
        if (!this.graphContainer) return;

        try {
            Plotly.downloadImage(this.graphContainer, {
                format: 'png',
                filename: filename,
                width: 800,
                height: 600,
                scale: 2
            });
        } catch (error) {
            console.error('Error al exportar la imagen:', error);
        }
    }
}

// Función auxiliar para evaluar expresiones matemáticas
function evaluate_function(func_str, x_val) {
    try {
        // Intentar usar math.js si está disponible
        if (typeof math !== 'undefined') {
            return math.evaluate(func_str, {x: x_val});
        }

        // Alternativa: evaluación usando Function (menos segura)
        const func = new Function('x', `return ${func_str.replace(/\^/g, '**')}`);
        return func(x_val);
    } catch (e) {
        console.error('Error evaluando función:', e);
        return 0;
    }
}