// Verificar autenticación
requireAuth();

console.log('[PERFIL.JS] Script cargado');

// Cargar información del usuario
async function loadUserInfo() {
    console.log('[PERFIL.JS] Cargando información del usuario...');
    try {
        const res = await fetch('/api/auth/me', {
            headers: getAuthHeaders()
        });

        console.log('[PERFIL.JS] Respuesta recibida:', res.status);

        if (res.ok) {
            const data = await res.json();
            const user = data.user;

            console.log('[PERFIL.JS] Usuario:', user);

            // Actualizar saldo
            const saldoElement = document.getElementById('perfil-saldo-display');
            console.log('[PERFIL.JS] Elemento saldo encontrado:', !!saldoElement);

            if (saldoElement) {
                const saldoFormateado = new Intl.NumberFormat('es-CL', {
                    style: 'currency',
                    currency: 'CLP',
                    maximumFractionDigits: 0
                }).format(user.saldo || 0);

                console.log('[PERFIL.JS] Saldo formateado:', saldoFormateado);
                saldoElement.textContent = saldoFormateado;
                console.log('[PERFIL.JS] Saldo actualizado en DOM');
            }

            // Actualizar email
            const headerTitle = document.querySelector('.perfil-header h1');
            const correoElement = document.querySelector('.correo');

            if (headerTitle) {
                headerTitle.textContent = user.email || user.firstName || 'Usuario';
                console.log('[PERFIL.JS] Email actualizado:', headerTitle.textContent);
            }

            if (correoElement) {
                correoElement.textContent = user.email;
            }
        } else if (res.status === 401) {
            removeToken();
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Error cargando información del usuario:', error);
    }
}

// Cargar historial de transacciones (depósitos/retiros)
async function loadTransactions() {
    try {
        const res = await fetch('/api/transactions/history', {
            headers: getAuthHeaders()
        });

        if (res.ok) {
            const data = await res.json();
            const transactions = data.transactions || [];

            const tbody = document.getElementById('transactionTable');
            if (tbody) {
                tbody.innerHTML = '';

                if (transactions.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">No hay transacciones</td></tr>';
                } else {
                    transactions.forEach(trans => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${trans.fecha}</td>
                            <td>${trans.tipo}</td>
                            <td>$${trans.monto.toLocaleString('es-CL')}</td>
                        `;
                        tbody.appendChild(row);
                    });
                }
            }
        } else if (res.status === 401) {
            removeToken();
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Error cargando transacciones:', error);
    }
}

// Cargar historial de apuestas
async function loadBetHistory() {
    try {
        const res = await fetch('/api/roulette/history', {
            headers: getAuthHeaders()
        });

        if (res.ok) {
            const data = await res.json();
            const bets = data.bets || [];

            const tbody = document.getElementById('historial-body');
            if (tbody) {
                tbody.innerHTML = '';

                if (bets.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No hay apuestas</td></tr>';
                } else {
                    bets.forEach(bet => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${bet.tipo}</td>
                            <td>${bet.valor}</td>
                            <td>$${bet.monto.toLocaleString('es-CL')}</td>
                            <td style="color:${bet.resultadoColor};">${bet.resultado}</td>
                        `;
                        tbody.appendChild(row);
                    });
                }
            }
        } else if (res.status === 401) {
            removeToken();
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Error cargando historial de apuestas:', error);
    }
}

// Cargar todos los datos al iniciar
loadUserInfo();
loadTransactions();
loadBetHistory();
