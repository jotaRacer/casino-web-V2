/**
 * Utilidades para manejo de autenticación JWT con localStorage
 */

const AUTH_TOKEN_KEY = 'casino_auth_token';

/**
 * Guardar token JWT en localStorage
 */
function saveToken(token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/**
 * Obtener token JWT de localStorage
 */
function getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Eliminar token JWT de localStorage
 */
function removeToken() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
}

/**
 * Verificar si el usuario está autenticado
 */
function isAuthenticated() {
    return !!getToken();
}

/**
 * Obtener headers con Authorization Bearer
 */
function getAuthHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

/**
 * Hacer logout completo
 */
async function logout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: getAuthHeaders()
        });
    } catch (error) {
        console.error('Error en logout:', error);
    }
    removeToken();
    window.location.href = '/login';
}

/**
 * Verificar autenticación requerida
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login';
    }
}

/**
 * Redirigir si ya está autenticado
 */
function redirectIfAuthenticated() {
    if (isAuthenticated()) {
        window.location.href = '/perfil';
    }
}
