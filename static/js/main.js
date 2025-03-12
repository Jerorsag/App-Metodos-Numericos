// Inicialización al cargar la página
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

    // Error modal
    const errorModal = new bootstrap.Modal(document.getElementById('error-modal'));
    const errorMessage = document.getElementById('error-message');

    // Cambios en el método seleccionado
    methodSelect.addEventListener('change', function() {
        updateMethodParams();
    });

    // Evento de envío del formulario
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateRoot();
    });

    // Botón de volver
    backButton.addEventListener('click', function() {
        resultsSection.style.display = 'none';
        form.parentElement.parentElement.style.display = 'block';
    });

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

    // Función para calcular la raíz
    function calculateRoot() {
        const method = methodSelect.value;
        const func = document.getElementById('function').value;
        const tolerance = document.getElementById('tolerance').value;
        const maxIterations = document.getElementById('max_iterations').value;

        if (!method || !func) {
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
            if (data.error) {
                showError(data.error);
                return;
            }

            // Mostrar resultados
            showResults(data);
        })
        .catch(error => {
            showError('Error de conexión: ' + error.message);
        });
    }

    // Función para mostrar resultados
    function showResults(data) {
        // Mostrar la gráfica
        plotImage.src = 'data:image/png;base64,' + data.plot;

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

        // Ocultar el formulario y mostrar resultados
        form.parentElement.parentElement.style.display = 'none';
        resultsSection.style.display = 'block';

        // Desplazarse al inicio de la sección de resultados
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Función para mostrar errores
    function showError(message) {
        errorMessage.textContent = message;
        errorModal.show();
    }

    // Inicializar la interfaz
    if (methodSelect.value) {
        updateMethodParams();
    }
});