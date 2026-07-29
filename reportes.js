document.addEventListener("DOMContentLoaded", function () {

    const claveStorage = "homeworks";
    const contenedorResultado = document.getElementById("reporteResultado");
    const selectTipo = document.getElementById("selectTipoReporte");
    const btnGenerar = document.getElementById("btnGenerar");

    const PESOS_ACTIVIDAD = { "Actividad 1": 35, "Actividad 2": 35, "Examen Final": 30 };
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

    function calcularNotaActividad(tareasActividad) {
        const conNota = tareasActividad.filter(function (t) {
            return t.nota !== null && t.nota !== undefined && t.nota !== "";
        });
        if (conNota.length === 0) return null;

        const sumaPesos = conNota.reduce(function (acc, t) { return acc + Number(t.porcentaje); }, 0);
        const sumaPonderada = conNota.reduce(function (acc, t) { return acc + Number(t.nota) * Number(t.porcentaje); }, 0);
        return sumaPonderada / sumaPesos;
    }

    function calcularPromedioPeriodo(actividadesDelPeriodo) {
        let sumaPesos = 0;
        let sumaPonderada = 0;
        const detalle = {};

        ordenActividades.forEach(function (actividad) {
            const tareasActividad = (actividadesDelPeriodo && actividadesDelPeriodo[actividad]) || [];
            const nota = calcularNotaActividad(tareasActividad);
            detalle[actividad] = nota;

            if (nota !== null) {
                sumaPesos += PESOS_ACTIVIDAD[actividad];
                sumaPonderada += nota * PESOS_ACTIVIDAD[actividad];
            }
        });

        const promedio = sumaPesos === 0 ? null : sumaPonderada / sumaPesos;
        return { promedio: promedio, detalle: detalle };
    }

    function textoNota(nota) {
        return nota === null || nota === undefined ? "-" : nota.toFixed(1);
    }

    // ===== Tabla: un período específico =====
    function generarTablaPeriodo(periodo) {
        const grupos = agruparAnidado(obtenerTareas());

        let filas = "";
        let sumaPromediosGenerales = 0;

        TODAS_LAS_MATERIAS.forEach(function (materia) {
            const periodosDeLaMateria = grupos[materia];
            const actividadesDelPeriodo = periodosDeLaMateria ? periodosDeLaMateria[periodo] : null;
            const resultado = calcularPromedioPeriodo(actividadesDelPeriodo);

            sumaPromediosGenerales += resultado.promedio === null ? 0 : resultado.promedio;

            filas += `
                <tr>
                    <td class="celda-materia">${materia}</td>
                    <td>${textoNota(resultado.detalle["Actividad 1"])}</td>
                    <td>${textoNota(resultado.detalle["Actividad 2"])}</td>
                    <td>${textoNota(resultado.detalle["Examen Final"])}</td>
                    <td class="celda-promedio">${textoNota(resultado.promedio)}</td>
                </tr>
            `;
        });

        const promedioGeneral = sumaPromediosGenerales / TODAS_LAS_MATERIAS.length;

        return `
            <table class="tabla-reporte">
                <thead>
                    <tr>
                        <th>Materia</th>
                        <th>Actividad 1 <span>(35%)</span></th>
                        <th>Actividad 2 <span>(35%)</span></th>
                        <th>Examen Final <span>(30%)</span></th>
                        <th>Promedio</th>
                    </tr>
                </thead>
                <tbody>
                    ${filas}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="4">Promedio general del ${periodo}</td>
                        <td class="celda-promedio">${promedioGeneral.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        `;
    }

    // ===== Tabla: promedio general de los 4 períodos =====
    function generarTablaGeneral() {
        const grupos = agruparAnidado(obtenerTareas());

        let filas = "";
        const sumaPorPeriodo = [0, 0, 0, 0];
        let sumaAnualTotal = 0;

        TODAS_LAS_MATERIAS.forEach(function (materia) {
            const periodosDeLaMateria = grupos[materia];
            const promediosPorPeriodo = ordenPeriodos.map(function (periodo, indice) {
                const actividadesDelPeriodo = periodosDeLaMateria ? periodosDeLaMateria[periodo] : null;
                const resultado = calcularPromedioPeriodo(actividadesDelPeriodo);
                const valor = resultado.promedio === null ? 0 : resultado.promedio;
                sumaPorPeriodo[indice] += valor;
                return resultado.promedio;
            });

            const promedioAnual = promediosPorPeriodo.reduce(function (acc, p) { return acc + (p === null ? 0 : p); }, 0) / 4;
            sumaAnualTotal += promedioAnual;

            filas += `
                <tr>
                    <td class="celda-materia">${materia}</td>
                    ${promediosPorPeriodo.map(function (p) { return `<td>${textoNota(p)}</td>`; }).join("")}
                    <td class="celda-promedio">${promedioAnual.toFixed(2)}</td>
                </tr>
            `;
        });

        const promedioGeneralPorPeriodo = sumaPorPeriodo.map(function (suma) {
            return (suma / TODAS_LAS_MATERIAS.length).toFixed(2);
        });
        const promedioAnualDelEstudiante = (sumaAnualTotal / TODAS_LAS_MATERIAS.length).toFixed(2);

        return `
            <table class="tabla-reporte">
                <thead>
                    <tr>
                        <th>Materia</th>
                        <th>Período 1</th>
                        <th>Período 2</th>
                        <th>Período 3</th>
                        <th>Período 4</th>
                        <th>Promedio Anual</th>
                    </tr>
                </thead>
                <tbody>
                    ${filas}
                </tbody>
                <tfoot>
                    <tr>
                        <td>Promedio general</td>
                        <td>${promedioGeneralPorPeriodo[0]}</td>
                        <td>${promedioGeneralPorPeriodo[1]}</td>
                        <td>${promedioGeneralPorPeriodo[2]}</td>
                        <td>${promedioGeneralPorPeriodo[3]}</td>
                        <td class="celda-promedio">${promedioAnualDelEstudiante}</td>
                    </tr>
                </tfoot>
            </table>
        `;
    }

    btnGenerar.addEventListener("click", function () {
        const tipoSeleccionado = selectTipo.value;

        if (tipoSeleccionado === "general") {
            contenedorResultado.innerHTML = generarTablaGeneral();
        } else {
            contenedorResultado.innerHTML = generarTablaPeriodo(tipoSeleccionado);
        }
    });

});