document.addEventListener("DOMContentLoaded", function () {

    const btnGuardar = document.getElementById("btnGuardar");
    const inputNombre = document.getElementById("nombreTarea");
    const inputPorcentaje = document.getElementById("porcentajeTarea");

    let asignaturaSeleccionada = "";
    let periodoSeleccionado = "";
    let actividadSeleccionada = "";

    const claveStorage = "homeworks";

    function obtenerTareas() {
        return JSON.parse(localStorage.getItem(claveStorage)) || [];
    }

    function guardarTareas(tareas) {
        localStorage.setItem(claveStorage, JSON.stringify(tareas));
    }

    // ===== Función reutilizable para cualquier dropdown =====
    function configurarDropdown(idBoton, idLista, alSeleccionar) {

        const boton = document.getElementById(idBoton);
        const lista = document.getElementById(idLista);
        const textoOriginal = boton.textContent.trim();

        // Abrir / cerrar ESTE dropdown (y cerrar los demás)
        boton.addEventListener("click", function (evento) {
            evento.stopPropagation();

            const yaEstabaActiva = lista.classList.contains("activa");

            // Cierra todas las listas antes de abrir la que corresponde
            document.querySelectorAll(".lista-asignaturas").forEach(function (l) {
                l.classList.remove("activa");
            });

            if (!yaEstabaActiva) {
                lista.classList.add("activa");
            }
        });

        // Elegir una opción
        lista.addEventListener("click", function (evento) {
            if (evento.target.tagName === "LI") {
                const valor = evento.target.textContent.trim();
                boton.textContent = valor + " ▾";
                lista.classList.remove("activa");
                alSeleccionar(valor);
            }
        });

        return { boton: boton, textoOriginal: textoOriginal };
    }

    const dropdownAsignatura = configurarDropdown("btnAsignatura", "listaAsignaturas", function (valor) {
        asignaturaSeleccionada = valor;
    });

    const dropdownPeriodo = configurarDropdown("btnPeriodo", "listaPeriodos", function (valor) {
        periodoSeleccionado = valor;
    });

    const dropdownActividad = configurarDropdown("btnActividad", "listaActividades", function (valor) {
        actividadSeleccionada = valor;
    });

    // Cerrar cualquier dropdown al hacer clic afuera
    document.addEventListener("click", function (evento) {
        if (!evento.target.closest(".dropdown")) {
            document.querySelectorAll(".lista-asignaturas").forEach(function (l) {
                l.classList.remove("activa");
            });
        }
    });

    // ===== Guardar tarea =====
    btnGuardar.addEventListener("click", function () {
        const nombre = inputNombre.value.trim();
        const porcentaje = Number(inputPorcentaje.value);

        if (!asignaturaSeleccionada) {
            alert("Selecciona una asignatura.");
            return;
        }

        if (!periodoSeleccionado) {
            alert("Selecciona un período.");
            return;
        }

        if (!actividadSeleccionada) {
            alert("Selecciona a qué actividad pertenece.");
            return;
        }

        if (!nombre) {
            alert("Escribe el nombre de la tarea.");
            return;
        }

        if (isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
            alert("Escribe un porcentaje válido entre 0 y 100.");
            return;
        }

        const nuevaTarea = {
            id: Date.now(),
            asignatura: asignaturaSeleccionada,
            periodo: periodoSeleccionado,
            actividad: actividadSeleccionada,
            nombre: nombre,
            porcentaje: porcentaje,
            estado: "pendiente"
        };

        const tareas = obtenerTareas();
        tareas.push(nuevaTarea);
        guardarTareas(tareas);

        alert("Tarea guardada correctamente.");

        // Limpiar formulario
        inputNombre.value = "";
        inputPorcentaje.value = "";

        asignaturaSeleccionada = "";
        periodoSeleccionado = "";
        actividadSeleccionada = "";

        dropdownAsignatura.boton.textContent = dropdownAsignatura.textoOriginal;
        dropdownPeriodo.boton.textContent = dropdownPeriodo.textoOriginal;
        dropdownActividad.boton.textContent = dropdownActividad.textoOriginal;
    });

});