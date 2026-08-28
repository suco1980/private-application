import { auth } from './Firebase.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('login-email');
const passwordInput = document.getElementById('login-password');
const errorMsg = document.getElementById('login-error');

// 1. Verifica si se activó el botón de pánico anteriormente para limpiar inputs
window.addEventListener('DOMContentLoaded', () => {
    const debeLimpiar = localStorage.getItem('limpiarLogin');
    
    if (debeLimpiar === 'true') {
        if (loginForm) loginForm.reset();
        if (emailInput) emailInput.value = '';
        if (passwordInput) passwordInput.value = '';
        
        localStorage.removeItem('limpiarLogin');
    }
});

// 2. Maneja el evento de inicio de sesión y redirección
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita que la página se recargue sola

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        try {
            if (errorMsg) errorMsg.textContent = '';

            // Intentamos iniciar sesión en Firebase
            await signInWithEmailAndPassword(auth, email, password);
            console.log("¡Login exitoso!");

            // Limpiamos los inputs antes de entrar
            loginForm.reset();

            // REDIRECCIÓN A LA PANTALLA DEL CHAT
            window.location.href = "chat.html";

        } catch (error) {
            console.error("Error al iniciar sesión:", error.code);
            if (errorMsg) {
                errorMsg.textContent = "Correo o contraseña incorrectos.";
            } else {
                alert("Correo o contraseña incorrectos.");
            }
        }
    });
}