document.addEventListener("DOMContentLoaded", function () {

    const claveStorage = "homeworks";
    const contenedor = document.getElementById("calificacionesContainer");

    const PESOS_ACTIVIDAD = {
        "Actividad 1": 0.35,
        "Actividad 2": 0.35,
        "Examen Final": 0.30
    };

    const ordenPeriodos = ["Período 1", "Período 2", "Período 3", "Período 4"];
    const ordenActividades = ["Actividad 1", "Actividad 2", "Examen Final"];

    const TODAS_LAS_MATERIAS = [
        "Inglés", "Matemáticas", "Cálculo", "Ciencias Sociales y Cívica",
        "Seminario", "Física", "Biología", "Química", "Filosofía",
        "Lenguaje y Literatura", "Informática"
    ];

    function obtenerTareas() {
        return JSON.parse(localStorage.getItem(claveStorage)) || [];
    }

    function guardarTareas(tareas) {
        localStorage.setItem(claveStorage, JSON.stringify(tareas));
    }

    function agruparAnidado(tareas) {
        const grupos = {};
        tareas.forEach(function (t) {
            grupos[t.asignatura] ??= {};
            grupos[t.asignatura][t.periodo] ??= {};
            grupos[t.asignatura][t.periodo][t.actividad] ??= [];
            grupos[t.asignatura][t.periodo][t.actividad].push(t);
        });
        return grupos;
    }

    // Calcula la nota total de la actividad sumando los % reales (ej: 9*0.5 + 10*0.5 = 9.5)
    function calcularNotaActividad(tareasActividad) {
        const conNota = tareasActividad.filter(function (t) {
            return t.nota !== null && t.nota !== undefined && t.nota !== "";
        });

        if (conNota.length === 0) return null;

        return conNota.reduce(function (acc, t) {
            const porcentajeDecimal = Number(t.porcentaje) / 100;
            return acc + (Number(t.nota) * porcentajeDecimal);
        }, 0);
    }

    // Calcula los puntos aportados al período (suma de notaActividad * pesoActividad)
    function calcularPromedioPeriodo(actividadesDelPeriodo) {
        let sumaPonderada = 0;
        let hayNotas = false;
        const detalle = {};

        ordenActividades.forEach(function (actividad) {
            const tareasActividad = actividadesDelPeriodo[actividad] || [];
            const nota = calcularNotaActividad(tareasActividad);
            detalle[actividad] = nota;

            if (nota !== null) {
                hayNotas = true;
                sumaPonderada += nota * PESOS_ACTIVIDAD[actividad];
            }
        });

        return { 
            promedio: hayNotas ? sumaPonderada : null, 
            detalle: detalle 
        };
    }

    function calcularPromedioGeneral(grupos, periodo) {
        let suma = 0;

        TODAS_LAS_MATERIAS.forEach(function (materia) {
            const periodosDeLaMateria = grupos[materia];

            if (!periodosDeLaMateria || !periodosDeLaMateria[periodo]) {
                suma += 0;
                return;
            }

            const resultado = calcularPromedioPeriodo(periodosDeLaMateria[periodo]);
            suma += resultado.promedio === null ? 0 : resultado.promedio;
        });

        return suma / TODAS_LAS_MATERIAS.length;
    }

    function renderPromedioGeneral() {
        const tareas = obtenerTareas();
        const grupos = agruparAnidado(tareas);
        const selectPeriodoGeneral = document.getElementById("selectPeriodoGeneral");
        const resultadoGeneral = document.getElementById("resultadoPromedioGeneral");

        if (!selectPeriodoGeneral || !resultadoGeneral) return;

        const periodo = selectPeriodoGeneral.value;
        const promedio = calcularPromedioGeneral(grupos, periodo);

        resultadoGeneral.textContent = promedio.toFixed(2);
    }

    function renderNotaEditable(tarea) {
        const valor = (tarea.nota === null || tarea.nota === undefined) ? "" : tarea.nota;
        return `
            <li class="nota-item">
                <span>${tarea.nombre} <small>(${tarea.porcentaje}% de la actividad)</small></span>
                <input
                    type="number"
                    class="input-nota"
                    min="0" max="10" step="0.1"
                    placeholder="-"
                    value="${valor}"
                    data-id="${tarea.id}"
                >
            </li>
        `;
    }
    

    function render() {
    const tareas = obtenerTareas();
    contenedor.innerHTML = "";

    const grupos = agruparAnidado(tareas);

    // Recorremos las 11 materias FIJAS, no solo las que ya tienen tareas
    TODAS_LAS_MATERIAS.forEach(function (asignatura) {

        const periodosDeLaAsignatura = grupos[asignatura];

        const tarjeta = document.createElement("section");
        tarjeta.className = "subject-card colapsada"; // colapsada por defecto

        let contenidoPeriodos = "";

        if (!periodosDeLaAsignatura) {
            // Materia sin ninguna tarea registrada todavía
            contenidoPeriodos = `<p class="empty-state-small">Aún no hay tareas registradas para esta materia.</p>`;
        } else {
            ordenPeriodos.forEach(function (periodo) {
                const actividadesDelPeriodo = periodosDeLaAsignatura[periodo];
                if (!actividadesDelPeriodo) return;

                const resultado = calcularPromedioPeriodo(actividadesDelPeriodo);

                let contenidoActividades = "";
                ordenActividades.forEach(function (actividad) {
                    const tareasActividad = actividadesDelPeriodo[actividad];
                    if (!tareasActividad) return;

                    const notaActividad = resultado.detalle[actividad];
                    const notaTexto = notaActividad === null ? "-" : notaActividad.toFixed(1);

                    contenidoActividades += `
                        <div class="activity-block">
                            <h4>${actividad} <span class="peso-tag">${PESOS_ACTIVIDAD[actividad]}%</span> — Nota: <strong>${notaTexto}</strong></h4>
                            <ul class="nota-list">
                                ${tareasActividad.map(renderNotaEditable).join("")}
                            </ul>
                        </div>
                    `;
                });

                const promedioTexto = resultado.promedio === null ? "-" : resultado.promedio.toFixed(1);

                contenidoPeriodos += `
                    <div class="period-block">
                        <h3>${periodo} — Promedio actual: <strong>${promedioTexto}</strong></h3>
                        ${contenidoActividades}
                    </div>
                `;
            });
        }

        tarjeta.innerHTML = `
            <button type="button" class="subject-toggle">
                <h2>${asignatura}</h2>
                <span class="toggle-arrow">▾</span>
            </button>
            <div class="subject-content">
                ${contenidoPeriodos}
            </div>
        `;

        contenedor.appendChild(tarjeta);
    });

    // Conecta cada input de nota para que guarde al escribir
    document.querySelectorAll(".input-nota").forEach(function (input) {
        input.addEventListener("change", function () {
            const id = Number(input.dataset.id);
            const tareasActuales = obtenerTareas();
            const tarea = tareasActuales.find(function (t) { return t.id === id; });

            if (tarea) {
                tarea.nota = input.value === "" ? null : Number(input.value);
                guardarTareas(tareasActuales);
                render();
                renderPromedioGeneral();
                llenarSelectsCalculadora();
            }
        });
    });
}
// Delegación de eventos: un solo listener detecta clics en CUALQUIER tarjeta, presente o futura
contenedor.addEventListener("click", function (evento) {
    const boton = evento.target.closest(".subject-toggle");
    if (!boton) return;

    const tarjeta = boton.closest(".subject-card");
    tarjeta.classList.toggle("colapsada");
});
    // ===== Calculadora Examen Final =====

    const selectMateria = document.getElementById("selectMateriaCalc");
    const selectPeriodo = document.getElementById("selectPeriodoCalc");
    const inputMeta = document.getElementById("inputMeta");
    const btnCalcular = document.getElementById("btnCalcular");
    const resultado = document.getElementById("resultadoCalculadora");

    function llenarSelectsCalculadora() {
        if (!selectMateria) return;
        const tareas = obtenerTareas();
        const grupos = agruparAnidado(tareas);
        const materias = Object.keys(grupos);

        selectMateria.innerHTML = materias.map(function (m) {
            return `<option value="${m}">${m}</option>`;
        }).join("");

        actualizarPeriodosDisponibles();
    }

    function actualizarPeriodosDisponibles() {
        if (!selectMateria || !selectPeriodo) return;
        const tareas = obtenerTareas();
        const grupos = agruparAnidado(tareas);
        const materiaElegida = selectMateria.value;
        const periodosDisponibles = grupos[materiaElegida] ? Object.keys(grupos[materiaElegida]) : [];

        selectPeriodo.innerHTML = ordenPeriodos
            .filter(function (p) { return periodosDisponibles.includes(p); })
            .map(function (p) { return `<option value="${p}">${p}</option>`; })
            .join("");
    }

    if (selectMateria) {
        selectMateria.addEventListener("change", actualizarPeriodosDisponibles);
    }

    if (btnCalcular) {
        btnCalcular.addEventListener("click", function () {
            const tareas = obtenerTareas();
            const grupos = agruparAnidado(tareas);

            const materia = selectMateria.value;
            const periodo = selectPeriodo.value;
            // Si el input está vacío, tomamos 7.0 por defecto
            const meta = inputMeta.value !== "" ? Number(inputMeta.value) : 7.0;

            if (!materia || !periodo) {
                resultado.textContent = "Selecciona una materia y un período.";
                return;
            }

            const actividadesDelPeriodo = grupos[materia][periodo];
            const notaAct1 = calcularNotaActividad(actividadesDelPeriodo["Actividad 1"] || []);
            const notaAct2 = calcularNotaActividad(actividadesDelPeriodo["Actividad 2"] || []);

            if (notaAct1 === null || notaAct2 === null) {
                resultado.textContent = "Necesitas tener registradas las notas de Actividad 1 y Actividad 2 para calcular esto.";
                return;
            }

            // Puntos ganados hasta ahora
            const puntosPonderadosActuales = (notaAct1 * 0.35) + (notaAct2 * 0.35);
            
            // Cuánto falta para la meta deseada (ej. 7.0)
            const puntosFaltantes = meta - puntosPonderadosActuales;
            
            // Nota necesaria en el examen (que vale 30%)
            const notaNecesariaExamen = puntosFaltantes / 0.30;

            if (notaNecesariaExamen > 10) {
                resultado.textContent = `Llevas ${puntosPonderadosActuales.toFixed(2)} pts. Imposible alcanzar ${meta} (necesitarías ${notaNecesariaExamen.toFixed(1)} en el examen).`;
            } else if (notaNecesariaExamen <= 0) {
                resultado.textContent = `¡Ya pasaste! Llevas ${puntosPonderadosActuales.toFixed(2)} pts acumulados. Tienes asegurado el ${meta} aun sacando 0 en el examen.`;
            } else {
                resultado.textContent = `Llevas ${puntosPonderadosActuales.toFixed(2)} pts acumulados. Necesitas al menos un ${notaNecesariaExamen.toFixed(1)} en el Examen Final para llegar a ${meta}.`;
            }
        });
    }

    const selectGeneral = document.getElementById("selectPeriodoGeneral");
    if (selectGeneral) {
        selectGeneral.addEventListener("change", renderPromedioGeneral);
    }

    render();
    renderPromedioGeneral();
    llenarSelectsCalculadora();

});