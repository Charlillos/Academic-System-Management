document.addEventListener("DOMContentLoaded", function () {
    const contenedorDashboard = document.getElementById("dashboardContainer");
    const claveStorage = "homeworks";

    // Orden fijo para que no salgan desordenados según como los guardaste
    const ordenPeriodos = ["Período 1", "Período 2", "Período 3", "Período 4"];
    const ordenActividades = ["Actividad 1", "Actividad 2", "Examen Final"];

    function obtenerTareas() {
        return JSON.parse(localStorage.getItem(claveStorage)) || [];
    }

    // Agrupa en 3 niveles: asignatura -> período -> actividad -> [tareas]
    function agruparAnidado(tareas) {
        const grupos = {};

        tareas.forEach(function (tarea) {
            if (!grupos[tarea.asignatura]) {
                grupos[tarea.asignatura] = {};
            }
            if (!grupos[tarea.asignatura][tarea.periodo]) {
                grupos[tarea.asignatura][tarea.periodo] = {};
            }
            if (!grupos[tarea.asignatura][tarea.periodo][tarea.actividad]) {
                grupos[tarea.asignatura][tarea.periodo][tarea.actividad] = [];
            }
            grupos[tarea.asignatura][tarea.periodo][tarea.actividad].push(tarea);
        });

        return grupos;
    }

    function actualizarEstadisticas(tareas) {
        const totalTareas = document.getElementById("totalTareas");
        const totalAsignaturas = document.getElementById("totalAsignaturas");
        const totalPendientes = document.getElementById("totalPendientes");

        totalTareas.textContent = tareas.length;

        const asignaturasUnicas = new Set(tareas.map(function (tarea) {
            return tarea.asignatura;
        }));
        totalAsignaturas.textContent = asignaturasUnicas.size;

        const pendientes = tareas.filter(function (tarea) {
            return tarea.estado === "pendiente";
        });
        totalPendientes.textContent = pendientes.length;
    }

    // Genera el HTML de una lista de tareas (el nivel más profundo)
    function generarListaTareas(tareas) {
        return `
            <ul class="task-list">
                ${tareas.map(function (tarea) {
                    return `
                        <li class="task-item">
                            <div class="task-info">
                                <strong>${tarea.nombre}</strong>
                                <span>${tarea.porcentaje}%</span>
                            </div>
                            <div class="task-buttons">
                                <button class="btn-entregar" onclick="cambiarEstado(${tarea.id})">
                                    ${tarea.estado === "pendiente" ? "Entregar" : "Entregada ✓"}
                                </button>
                                <button class="btn-eliminar" onclick="eliminarTarea(${tarea.id})">
                                    Eliminar
                                </button>
                            </div>
                        </li>
                    `;
                }).join("")}
            </ul>
        `;
    }

    function renderDashboard() {
        const tareas = obtenerTareas();

        actualizarEstadisticas(tareas);

        if (!contenedorDashboard) return;

        contenedorDashboard.innerHTML = "";

        if (tareas.length === 0) {
            contenedorDashboard.innerHTML = `
                <div class="empty-state">
                    No hay tareas registradas.
                </div>
            `;
            return;
        }

        const grupos = agruparAnidado(tareas);

        Object.keys(grupos).forEach(function (asignatura) {

            const periodosDeLaAsignatura = grupos[asignatura];

            const tarjeta = document.createElement("section");
            tarjeta.className = "subject-card";

            let contenidoPeriodos = "";

            // Recorremos en el orden fijo, solo mostrando los períodos que sí tienen tareas
            ordenPeriodos.forEach(function (periodo) {
                if (!periodosDeLaAsignatura[periodo]) return;

                const actividadesDelPeriodo = periodosDeLaAsignatura[periodo];

                let contenidoActividades = "";

                ordenActividades.forEach(function (actividad) {
                    if (!actividadesDelPeriodo[actividad]) return;

                    contenidoActividades += `
                        <div class="activity-block">
                            <h4>${actividad}</h4>
                            ${generarListaTareas(actividadesDelPeriodo[actividad])}
                        </div>
                    `;
                });

                contenidoPeriodos += `
                    <div class="period-block">
                        <h3>${periodo}</h3>
                        ${contenidoActividades}
                    </div>
                `;
            });

            tarjeta.innerHTML = `
                <h2>${asignatura}</h2>
                ${contenidoPeriodos}
            `;

            contenedorDashboard.appendChild(tarjeta);
        });
    }

    renderDashboard();
});

function cambiarEstado(id) {
    const tareas = JSON.parse(localStorage.getItem("homeworks")) || [];
    const tarea = tareas.find(t => t.id === id);

    if (tarea) {
        tarea.estado = tarea.estado === "pendiente" ? "entregada" : "pendiente";
        localStorage.setItem("homeworks", JSON.stringify(tareas));
        location.reload();
    }
}

function eliminarTarea(id) {
    let tareas = JSON.parse(localStorage.getItem("homeworks")) || [];
    tareas = tareas.filter(t => t.id !== id);
    localStorage.setItem("homeworks", JSON.stringify(tareas));
    location.reload();
}