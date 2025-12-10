/**
 * Utilidades para manejo de autenticación JWT
 */

const AUTH_TOKEN_KEY = 'casino_auth_token';

/**
 * Guardar token JWT en localStorage
 * @param {string} token - Token JWT a guardar
 */
function saveToken(token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/**
 * Obtener token JWT de localStorage
 * @returns {string|null} Token JWT o null si no existe
 */
function getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Eliminar token JWT de localStorage (logout)
 */
function removeToken() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
}

/**
 * Verificar si el usuario está autenticado
 * @returns {boolean} true si hay token, false si no
 */
function isAuthenticated() {
    return !!getToken();
}

/**
 * Obtener headers con Authorization Bearer para peticiones autenticadas
 * @returns {Object} Headers con Authorization
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
function logout() {
    removeToken();
    window.location.href = '/login';
}

/**
 * Verificar si el usuario debe estar autenticado para esta página
 * Si no está autenticado, redirige al login
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login';
    }
}

/**
 * Si el usuario ya está autenticado, redirigir a perfil
 * Útil para páginas de login/register
 */
function redirectIfAuthenticated() {
    if (isAuthenticated()) {
        window.location.href = '/perfil';
    }
}
