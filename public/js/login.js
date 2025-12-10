/**
 * Manejo del formulario de login
 */

// Redirigir si ya está autenticado
redirectIfAuthenticated();

// Obtener elementos del DOM
const loginForm = document.querySelector('.login-form');
const emailInput = document.getElementById('login-email');
const passwordInput = document.getElementById('login-password');
const submitBtn = document.querySelector('.login-submit-btn');

// Crear contenedor para mensajes de error si no existe
let errorContainer = loginForm.querySelector('.error-message');
if (!errorContainer) {
    errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.style.cssText = 'color: #f44336; background: rgba(244, 67, 54, 0.1); padding: 12px; border-radius: 6px; margin-bottom: 15px; display: none; text-align: center; font-weight: bold;';
    loginForm.insertBefore(errorContainer, submitBtn);
}

// Crear contenedor para mensajes de éxito
let successContainer = loginForm.querySelector('.success-message');
if (!successContainer) {
    successContainer = document.createElement('div');
    successContainer.className = 'success-message';
    successContainer.style.cssText = 'color: #4caf50; background: rgba(76, 175, 80, 0.1); padding: 12px; border-radius: 6px; margin-bottom: 15px; display: none; text-align: center; font-weight: bold;';
    loginForm.insertBefore(successContainer, submitBtn);
}

/**
 * Mostrar mensaje de error
 */
function showError(message) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    successContainer.style.display = 'none';
}

/**
 * Mostrar mensaje de éxito
 */
function showSuccess(message) {
    successContainer.textContent = message;
    successContainer.style.display = 'block';
    errorContainer.style.display = 'none';
}

/**
 * Ocultar mensajes
 */
function hideMessages() {
    errorContainer.style.display = 'none';
    successContainer.style.display = 'none';
}

/**
 * Validar formulario
 */
function validateForm() {
    hideMessages();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email) {
        showError('Por favor ingrese su correo electrónico');
        emailInput.focus();
        return false;
    }

    if (!password) {
        showError('Por favor ingrese su contraseña');
        passwordInput.focus();
        return false;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Por favor ingrese un correo electrónico válido');
        emailInput.focus();
        return false;
    }

    return true;
}

/**
 * Manejar submit del formulario
 */
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    // Deshabilitar botón mientras se procesa
    submitBtn.disabled = true;
    submitBtn.textContent = 'Iniciando sesión...';

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Guardar token
            saveToken(data.token);

            // Mostrar mensaje de éxito
            showSuccess('¡Login exitoso! Redirigiendo...');

            // Redirigir después de 1 segundo
            setTimeout(() => {
                window.location.href = '/roulette';
            }, 1000);
        } else {
            // Mostrar error del servidor
            showError(data.message || 'Error al iniciar sesión');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Iniciar sesión';
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        showError('Error de conexión con el servidor. Por favor intente nuevamente.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Iniciar sesión';
    }
});

// Limpiar mensajes cuando el usuario empiece a escribir
emailInput.addEventListener('input', hideMessages);
passwordInput.addEventListener('input', hideMessages);
