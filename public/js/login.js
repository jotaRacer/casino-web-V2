/**
 * Manejo del formulario de login - Versión simplificada para debug
 */

console.log('[LOGIN.JS] Script cargado');

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('[LOGIN.JS] DOM ready');

    // Verificar si ya está autenticado (AHORA dentro de DOMContentLoaded)
    try {
        if (typeof redirectIfAuthenticated === 'function') {
            console.log('[LOGIN.JS] Llamando redirectIfAuthenticated()');
            redirectIfAuthenticated();
        } else {
            console.warn('[LOGIN.JS] redirectIfAuthenticated no está definida');
        }
    } catch (error) {
        console.error('[LOGIN.JS] Error en redirectIfAuthenticated:', error);
    }

    // Obtener elementos del DOM
    const loginForm = document.querySelector('.login-form');
    const loginBox = document.querySelector('.login-box');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const submitBtn = document.querySelector('.login-submit-btn');

    console.log('[LOGIN.JS] Elementos encontrados:', {
        loginForm: !!loginForm,
        loginBox: !!loginBox,
        emailInput: !!emailInput,
        passwordInput: !!passwordInput,
        submitBtn: !!submitBtn
    });

    if (!loginForm || !loginBox) {
        console.error('[LOGIN.JS] ERROR: No se encontró el formulario o login-box');
        return;
    }

    // Crear contenedor para mensajes de error
    let errorContainer = loginBox.querySelector('.error-message');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.className = 'error-message';
        errorContainer.style.cssText = 'color: #f44336; background: rgba(244, 67, 54, 0.1); padding: 12px; border-radius: 6px; margin-bottom: 15px; display: none; text-align: center; font-weight: bold;';
        loginBox.insertBefore(errorContainer, submitBtn);
    }

    // Crear contenedor para mensajes de éxito
    let successContainer = loginBox.querySelector('.success-message');
    if (!successContainer) {
        successContainer = document.createElement('div');
        successContainer.className = 'success-message';
        successContainer.style.cssText = 'color: #4caf50; background: rgba(76, 175, 80, 0.1); padding: 12px; border-radius: 6px; margin-bottom: 15px; display: none; text-align: center; font-weight: bold;';
        loginBox.insertBefore(successContainer, submitBtn);
    }

    function showError(message) {
        console.log('[LOGIN.JS] Mostrando error:', message);
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        successContainer.style.display = 'none';
    }

    function showSuccess(message) {
        console.log('[LOGIN.JS] Mostrando éxito:', message);
        successContainer.textContent = message;
        successContainer.style.display = 'block';
        errorContainer.style.display = 'none';
    }

    function hideMessages() {
        errorContainer.style.display = 'none';
        successContainer.style.display = 'none';
    }

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

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError('Por favor ingrese un correo electrónico válido');
            emailInput.focus();
            return false;
        }

        return true;
    }

    // Manejar submit del formulario
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('[LOGIN.JS] Formulario enviado');

        if (!validateForm()) {
            console.log('[LOGIN.JS] Validación falló');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Iniciando sesión...';

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        console.log('[LOGIN.JS] Enviando petición a /api/auth/login');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            console.log('[LOGIN.JS] Respuesta recibida:', response.status);

            const data = await response.json();
            console.log('[LOGIN.JS] Datos:', data);

            if (response.ok) {
                console.log('[LOGIN.JS] Login exitoso, guardando token');

                // Guardar token
                if (typeof saveToken === 'function') {
                    saveToken(data.token);
                    console.log('[LOGIN.JS] Token guardado');
                } else {
                    console.error('[LOGIN.JS] saveToken no está definida');
                }

                showSuccess('¡Login exitoso! Redirigiendo...');

                setTimeout(() => {
                    console.log('[LOGIN.JS] Redirigiendo a /perfil');
                    window.location.href = '/perfil';
                }, 1000);
            } else {
                console.log('[LOGIN.JS] Login falló:', data.message);
                showError(data.message || 'Error al iniciar sesión');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Iniciar sesión';
            }
        } catch (error) {
            console.error('[LOGIN.JS] Error de conexión:', error);
            showError('Error de conexión con el servidor. Por favor intente nuevamente.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Iniciar sesión';
        }
    });

    emailInput.addEventListener('input', hideMessages);
    passwordInput.addEventListener('input', hideMessages);

    console.log('[LOGIN.JS] Event listeners configurados');
});
