document.addEventListener("DOMContentLoaded", function () {

    const calendarGrid = document.getElementById("calendarGrid");
    const monthTitle = document.getElementById("monthTitle");
    const btnPrevious = document.getElementById("btnPreviousMonth");
    const btnNext = document.getElementById("btnNextMonth");
    const pendingTasksContainer = document.getElementById("pendingTasks");

    const claveStorage = "homeworks";

    const nombresMeses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const hoy = new Date();
    let mesActual = hoy.getMonth();
    let anioActual = hoy.getFullYear();

    function obtenerTareas() {
        return JSON.parse(localStorage.getItem(claveStorage)) || [];
    }

    function guardarTareas(tareas) {
        localStorage.setItem(claveStorage, JSON.stringify(tareas));
    }

    function formatearFecha(anio, mes, dia) {
        const mesTexto = String(mes + 1).padStart(2, "0");
        const diaTexto = String(dia).padStart(2, "0");
        return `${anio}-${mesTexto}-${diaTexto}`;
    }

    // Busca una tarea por su id y le asigna (o quita) una fecha
    function reasignarFecha(idTarea, nuevaFecha) {
        const tareas = obtenerTareas();
        const tarea = tareas.find(function (t) { return t.id === idTarea; });

        if (tarea) {
            tarea.fecha = nuevaFecha; // null la regresa a "Pending Tasks"
            guardarTareas(tareas);
        }

        renderCalendario();
        renderPendingTasks();
    }

    function renderPendingTasks() {
        const tareas = obtenerTareas();
        pendingTasksContainer.innerHTML = "";

        const pendientes = tareas.filter(function (tarea) { return !tarea.fecha; });

        if (pendientes.length === 0) {
            pendingTasksContainer.innerHTML = `<p class="empty-calendar">No hay tareas pendientes.</p>`;
            return;
        }

        pendientes.forEach(function (tarea) {
            const tarjeta = document.createElement("div");
            tarjeta.className = "pending-task";
            tarjeta.draggable = true;

            tarjeta.innerHTML = `
                <strong>${tarea.nombre}</strong>
                <small>${tarea.asignatura} · ${tarea.porcentaje}%</small>
            `;

            tarjeta.addEventListener("dragstart", function (evento) {
                evento.dataTransfer.setData("text/plain", tarea.id);
            });

            pendingTasksContainer.appendChild(tarjeta);
        });
    }

    function renderCalendario() {

        monthTitle.textContent = `${nombresMeses[mesActual]} ${anioActual}`;
        calendarGrid.innerHTML = "";

        const tareas = obtenerTareas();

        const primerDia = new Date(anioActual, mesActual, 1);
        const diaSemanaInicio = (primerDia.getDay() + 6) % 7;
        const diasEnElMes = new Date(anioActual, mesActual + 1, 0).getDate();

        for (let i = 0; i < diaSemanaInicio; i++) {
            const celdaVacia = document.createElement("div");
            celdaVacia.className = "calendar-day empty";
            calendarGrid.appendChild(celdaVacia);
        }

        for (let dia = 1; dia <= diasEnElMes; dia++) {

            const celdaDia = document.createElement("div");
            celdaDia.className = "calendar-day";

            const fechaDeEstaCelda = formatearFecha(anioActual, mesActual, dia);
            celdaDia.dataset.fecha = fechaDeEstaCelda;

            const numero = document.createElement("span");
            numero.className = "day-number";
            numero.textContent = dia;
            celdaDia.appendChild(numero);

            const esHoy =
                dia === hoy.getDate() &&
                mesActual === hoy.getMonth() &&
                anioActual === hoy.getFullYear();

            if (esHoy) {
                celdaDia.classList.add("today");
            }

            // Tareas ya asignadas a este día
            tareas.forEach(function (tarea) {
                if (tarea.fecha !== fechaDeEstaCelda) return;

                const etiquetaTarea = document.createElement("div");
                etiquetaTarea.className = "day-task";
                etiquetaTarea.draggable = true; // ahora SÍ se puede volver a arrastrar

                etiquetaTarea.innerHTML = `
                    <span class="day-task-nombre">${tarea.nombre}</span>
                    <button class="day-task-quitar" title="Quitar fecha">×</button>
                `;

                // Arrastrar esta tarea a otro día = corregir la fecha
                etiquetaTarea.addEventListener("dragstart", function (evento) {
                    evento.stopPropagation(); // evita conflicto con el drop de la celda actual
                    evento.dataTransfer.setData("text/plain", tarea.id);
                });

                // Botón "×" = quitar la fecha, regresa a Pending Tasks
                etiquetaTarea.querySelector(".day-task-quitar").addEventListener("click", function (evento) {
                    evento.stopPropagation();
                    reasignarFecha(tarea.id, null);
                });

                celdaDia.appendChild(etiquetaTarea);
            });

            // Esta celda acepta que le suelten una tarea (nueva o reasignada)
            celdaDia.addEventListener("dragover", function (evento) {
                evento.preventDefault();
                celdaDia.classList.add("drag-over");
            });

            celdaDia.addEventListener("dragleave", function () {
                celdaDia.classList.remove("drag-over");
            });

            celdaDia.addEventListener("drop", function (evento) {
                evento.preventDefault();
                celdaDia.classList.remove("drag-over");

                const idTarea = Number(evento.dataTransfer.getData("text/plain"));
                reasignarFecha(idTarea, fechaDeEstaCelda);
            });

            calendarGrid.appendChild(celdaDia);
        }
    }

    btnPrevious.addEventListener("click", function () {
        mesActual--;
        if (mesActual < 0) { mesActual = 11; anioActual--; }
        renderCalendario();
    });

    btnNext.addEventListener("click", function () {
        mesActual++;
        if (mesActual > 11) { mesActual = 0; anioActual++; }
        renderCalendario();
    });

    renderCalendario();
    renderPendingTasks();

});