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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });

        const data = await res.json();

        if (res.ok) {
            document.getElementById('balance').textContent = fmtCLP(data.newBalance);
            alert("Depósito exitoso 💰");
            amountInput.value = '';
        } else {
            alert(data.message || "Error al depositar");
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });

        const data = await res.json();

        if (res.ok) {
            document.getElementById('balance').textContent = fmtCLP(data.newBalance);
            alert("Retiro exitoso 🏦");
            amountInput.value = '';
        } else {
            alert(data.message || "Error al retirar (¿Saldo insuficiente?)");
        }
    } catch (error) {
        console.error(error);
        alert("Error de conexión con el servidor");
    }
});
