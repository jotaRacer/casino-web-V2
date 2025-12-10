/**
 * Manejo del formulario de registro
 */

// Redirigir si ya está autenticado
redirectIfAuthenticated();

// Obtener elementos del DOM
const registerForm = document.getElementById('registrationForm');
const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const dobInput = document.getElementById('dob');
const submitBtn = document.querySelector('.submit-btn');

// Crear contenedor para mensajes de error si no existe
let errorContainer = registerForm.querySelector('.error-message');
if (!errorContainer) {
    errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.style.cssText = 'color: #f44336; background: rgba(244, 67, 54, 0.1); padding: 12px; border-radius: 6px; margin: 15px 0; display: none; text-align: center; font-weight: bold;';
    registerForm.insertBefore(errorContainer, submitBtn);
}

// Crear contenedor para mensajes de éxito
let successContainer = registerForm.querySelector('.success-message');
if (!successContainer) {
    successContainer = document.createElement('div');
    successContainer.className = 'success-message';
    successContainer.style.cssText = 'color: #4caf50; background: rgba(76, 175, 80, 0.1); padding: 12px; border-radius: 6px; margin: 15px 0; display: none; text-align: center; font-weight: bold;';
    registerForm.insertBefore(successContainer, submitBtn);
}

/**
 * Mostrar mensaje de error
 */
function showError(message) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    successContainer.style.display = 'none';
    errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Mostrar mensaje de éxito
 */
function showSuccess(message) {
    successContainer.textContent = message;
    successContainer.style.display = 'block';
    errorContainer.style.display = 'none';
    successContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Ocultar mensajes
 */
function hideMessages() {
    errorContainer.style.display = 'none';
    successContainer.style.display = 'none';
}

/**
 * Calcular edad a partir de fecha de nacimiento
 */
function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}

/**
 * Validar formulario
 */
function validateForm() {
    hideMessages();

    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();
    const dob = dobInput.value;

    // Validar campos vacíos
    if (!firstName) {
        showError('Por favor ingrese su nombre');
        firstNameInput.focus();
        return false;
    }

    if (!lastName) {
        showError('Por favor ingrese su apellido');
        lastNameInput.focus();
        return false;
    }

    if (!email) {
        showError('Por favor ingrese su correo electrónico');
        emailInput.focus();
        return false;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Por favor ingrese un correo electrónico válido');
        emailInput.focus();
        return false;
    }

    if (!password) {
        showError('Por favor ingrese una contraseña');
        passwordInput.focus();
        return false;
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres');
        passwordInput.focus();
        return false;
    }

    if (!confirmPassword) {
        showError('Por favor confirme su contraseña');
        confirmPasswordInput.focus();
        return false;
    }

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
        showError('Las contraseñas no coinciden');
        confirmPasswordInput.focus();
        return false;
    }

    if (!dob) {
        showError('Por favor ingrese su fecha de nacimiento');
        dobInput.focus();
        return false;
    }

    // Validar edad mínima (18 años)
    const age = calculateAge(dob);
    if (age < 18) {
        showError('Debes tener al menos 18 años para registrarte');
        dobInput.focus();
        return false;
    }

    return true;
}

/**
 * Manejar submit del formulario
 */
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    // Deshabilitar botón mientras se procesa
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registrando...';

    const formData = {
        firstName: firstNameInput.value.trim(),
        lastName: lastNameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value.trim(),
        dob: dobInput.value
    };

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            // Mostrar mensaje de éxito
            showSuccess('¡Registro exitoso! Redirigiendo al login...');

            // Limpiar formulario
            registerForm.reset();

            // Redirigir al login después de 2 segundos
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } else {
            // Mostrar error del servidor
            showError(data.message || 'Error al registrar usuario');
            submitBtn.disabled = false;
            submitBtn.textContent = '¡Únete y empieza a ganar!';
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        showError('Error de conexión con el servidor. Por favor intente nuevamente.');
        submitBtn.disabled = false;
        submitBtn.textContent = '¡Únete y empieza a ganar!';
    }
});

// Limpiar mensajes cuando el usuario empiece a escribir
[firstNameInput, lastNameInput, emailInput, passwordInput, confirmPasswordInput, dobInput].forEach(input => {
    input.addEventListener('input', hideMessages);
});
