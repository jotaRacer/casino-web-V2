// Verificar autenticación al cargar la página
requireAuth();

// Cargar saldo del usuario
async function loadBalance() {
    try {
        const res = await fetch('/api/auth/me', {
            headers: getAuthHeaders()
        });

        if (res.ok) {
            const data = await res.json();
            document.getElementById('balance').textContent = fmtCLP(data.user.saldo);
        } else if (res.status === 401) {
            removeToken();
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Error cargando saldo:', error);
        document.getElementById('balance').textContent = 'Error';
    }
}

// Cargar saldo al iniciar
loadBalance();

const fmtCLP = v => new Intl.NumberFormat('es-CL', {
    style: 'decimal',
    maximumFractionDigits: 0
}).format(Number(v ?? 0));

document.getElementById('transactionForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const amountInput = document.getElementById('amount');
    const amount = parseFloat(amountInput.value);

    if (isNaN(amount) || amount <= 0) return alert("Monto inválido");

    try {
        const res = await fetch('/api/transactions/deposit', {
            method: 'POST',
            headers: getAuthHeaders(), // ✅ Incluye Authorization: Bearer <token>
            body: JSON.stringify({ amount })
        });

        const data = await res.json();

        if (res.ok) {
            document.getElementById('balance').textContent = fmtCLP(data.newBalance);
            alert("Depósito exitoso 💰");
            amountInput.value = '';

            // Actualizar saldo en navbar (sin símbolo, CSS lo agrega)
            const navbarSaldo = document.getElementById('navbar-saldo');
            if (navbarSaldo) {
                navbarSaldo.textContent = new Intl.NumberFormat('es-CL', {
                    style: 'decimal',
                    maximumFractionDigits: 0
                }).format(data.newBalance);
            }
        } else {
            if (res.status === 401) {
                alert("Sesión expirada. Por favor inicia sesión nuevamente.");
                removeToken();
                window.location.href = '/login';
            } else {
                alert(data.message || "Error al depositar");
            }
        }
    } catch (error) {
        console.error(error);
        alert("Error de conexión con el servidor");
    }
});

document.getElementById('withdrawForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const amountInput = document.getElementById('amount2');
    const amount = parseFloat(amountInput.value);

    if (isNaN(amount) || amount <= 0) return alert("Monto inválido");

    try {
        const res = await fetch('/api/transactions/withdraw', {
            method: 'POST',
            headers: getAuthHeaders(), // ✅ Incluye Authorization: Bearer <token>
            body: JSON.stringify({ amount })
        });

        const data = await res.json();

        if (res.ok) {
            document.getElementById('balance').textContent = fmtCLP(data.newBalance);
            alert("Retiro exitoso 🏦");
            amountInput.value = '';

            // Actualizar saldo en navbar (sin símbolo, CSS lo agrega)
            const navbarSaldo = document.getElementById('navbar-saldo');
            if (navbarSaldo) {
                navbarSaldo.textContent = new Intl.NumberFormat('es-CL', {
                    style: 'decimal',
                    maximumFractionDigits: 0
                }).format(data.newBalance);
            }
        } else {
            if (res.status === 401) {
                alert("Sesión expirada. Por favor inicia sesión nuevamente.");
                removeToken();
                window.location.href = '/login';
            } else {
                alert(data.message || "Error al retirar (¿Saldo insuficiente?)");
            }
        }
    } catch (error) {
        console.error(error);
        alert("Error de conexión con el servidor");
    }
});
