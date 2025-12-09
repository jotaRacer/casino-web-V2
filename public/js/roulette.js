document.addEventListener("DOMContentLoaded", () => {
    const ruleta = document.getElementById("ruleta");
    const bubble = document.querySelector(".bubble-ruleta");
    const estado = document.getElementById("estado-ruleta");
    const montoInput = document.getElementById("monto");
    const apostarBtn = document.getElementById("apostar-btn");
    const saldoDisplay = document.getElementById("saldo-display");
    const navbarsaldo = document.getElementById("navbar-saldo");
    const listaGanadores = document.getElementById("lista-ganadores");
    const historialBody = document.getElementById("historial-body");
    const numerosRojos = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    const numerosNegros = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

    const ordenRuleta = [
        0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
        5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
    ];

    let girando = false;
    let seleccionadas = [];

    // Permitir seleccionar celdas
    document.querySelectorAll(".celda").forEach(celda => {
        celda.addEventListener("click", () => {
            const valor = celda.dataset.num || celda.dataset.color || celda.dataset.seccion;
            if (seleccionadas.includes(valor)) {
                seleccionadas = seleccionadas.filter(v => v !== valor);
                celda.classList.remove("selected");
            } else {
                seleccionadas = [valor];
                document.querySelectorAll(".celda").forEach(c => c.classList.remove("selected"));
                celda.classList.add("selected");
            }
        });
    });
    // Manejar apuesta
    apostarBtn.addEventListener("click", async () => {
        if (girando) return;

        const monto = parseFloat(montoInput.value);
        if (isNaN(monto) || monto <= 0) {
            estado.textContent = "⚠️ Ingresa un monto válido.";
            return;
        }

        if (seleccionadas.length === 0) {
            estado.textContent = "⚠️ Selecciona una casilla.";
            return;
        }

        const valor = seleccionadas[0];
        const tipo = isNaN(valor) ? "color_o_seccion" : "numero";

        ruleta.querySelectorAll("div").forEach(d => d.classList.remove("winner-ruleta"));

        try {
            estado.textContent = "Girando la ruleta...";
            girando = true;

            const res = await fetch("/apostar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tipo, valor, monto })
            });

            const data = await res.json();

            if (!res.ok) {
                const mensajeError = data.error || "Error al conectar con el servidor.";
                estado.textContent = `⚠️ ${mensajeError}`;
                girando = false;
                return;
            }

            const numeroGanador = data.numeroGanador;
            const indiceGanador = ordenRuleta.indexOf(numeroGanador);
            const anguloPorNumero = 360 / 37;
            const anguloFinal = (360 * 5) - (indiceGanador * anguloPorNumero);

            ruleta.style.transition = "transform 3.5s cubic-bezier(0.23, 1, 0.32, 1)";
            ruleta.style.transform = `rotate(${anguloFinal}deg)`;

            setTimeout(() => {
                girando = false;
                ruleta.style.transition = 'none';
                const anguloReal = anguloFinal % 360;
                ruleta.style.transform = `rotate(${anguloReal}deg)`;

                const divGanador = ruleta.querySelector(`div[data-number="${numeroGanador}"]`);
                if (divGanador) {
                    divGanador.classList.add("winner-ruleta");
                }

                saldoDisplay.textContent = "$" + data.nuevoSaldo.toLocaleString("es-CL");
                if (navbarsaldo) navbarsaldo.textContent = data.nuevoSaldo.toLocaleString("es-CL");

                if (bubble) {
                    bubble.textContent = `Número ganador: ${numeroGanador}`;
                    bubble.classList.add("show");
                    setTimeout(() => bubble.classList.remove("show"), 2500);
                }

                estado.textContent = `Resultado: ${data.resultado.toUpperCase()} (${numeroGanador})`;

                let tipoMostrado = 'Apuesta';
                if (tipo === 'numero') {
                    tipoMostrado = 'Número';
                } else {
                    if (valor === 'rojo' || valor === 'negro') {
                        tipoMostrado = 'Color';
                    } else {
                        tipoMostrado = 'Sección';
                    }
                }

                // --- 1. ACTUALIZA HISTORIAL DE APUESTAS ---
                const maxHistorial = 5;

                let historial = Array.from(historialBody.querySelectorAll("tr")).map(tr => ({
                    tipo: tr.children[0]?.textContent || "",
                    valor: tr.children[1]?.textContent || "",
                    monto: tr.children[2]?.textContent || "",
                    resultado: tr.children[3]?.textContent || "",
                    color: tr.children[3]?.style.color || ""
                }));

                // Inserta la nueva apuesta al inicio
                historial.unshift({
                    tipo: tipoMostrado,
                    valor,
                    monto: `$${monto}`,
                    resultado: data.resultado.charAt(0).toUpperCase() + data.resultado.slice(1),
                    color: data.resultado === "ganada" ? "#4caf50" : "#f44336"
                });


                historial = historial.slice(0, maxHistorial);

                historialBody.innerHTML = "";
                historial.forEach(ap => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
            <td>${ap.tipo}</td>
            <td>${ap.valor}</td>
            <td>${ap.monto}</td>
            <td style="color:${ap.color};">${ap.resultado}</td>
          `;
                    historialBody.appendChild(row);
                });


                // --- ACTUALIZA ÚLTIMOS NÚMEROS ---
                const nuevoDiv = document.createElement("div");
                nuevoDiv.className = "numero-ganador";
                nuevoDiv.textContent = numeroGanador;

                // Color del número
                if (numeroGanador === 0) nuevoDiv.classList.add("verde");
                else if (numerosRojos.includes(numeroGanador)) nuevoDiv.classList.add("rojo");
                else nuevoDiv.classList.add("negro");

                //  Mantener SOLO los últimos 5 visibles
                const maxGanadores = 5;
                let ganadores = Array.from(listaGanadores.querySelectorAll(".numero-ganador"))
                    .map(div => div.textContent)
                    .filter(n => n !== "");

                ganadores.unshift(String(numeroGanador));

                // Cortar a los 5 últimos
                ganadores = ganadores.slice(0, maxGanadores);


                listaGanadores.innerHTML = "";
                ganadores.forEach(num => {
                    const div = document.createElement("div");
                    div.className = "numero-ganador";
                    const n = Number(num);
                    div.textContent = num;
                    if (n === 0) div.classList.add("verde");
                    else if (numerosRojos.includes(n)) div.classList.add("rojo");
                    else div.classList.add("negro");
                    listaGanadores.appendChild(div);
                });

            }, 3500); // Fin del setTimeout

        } catch (err) {
            console.error(err);
            estado.textContent = "⚠️ Error al conectar con el servidor.";
            girando = false;
        }
    });
});
