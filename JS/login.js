import { auth } from './Firebase.js';
import { 
    signInWithEmailAndPassword, 
    setPersistence, 
    inMemoryPersistence 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const errorMsg = document.getElementById('error-msg');
const loginScreen = document.getElementById('login-screen');
const chatApp = document.getElementById('chat-app');

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();

        // 1. Usa persistencia en memoria (se borra al recargar la página)
        setPersistence(auth, inMemoryPersistence)
            .then(() => {
                return signInWithEmailAndPassword(auth, email, password);
            })
            .then(() => {
                // 2. Muestra el chat inmediatamente tras el inicio exitoso
                if (errorMsg) errorMsg.textContent = "";
                loginForm.reset();
                if (loginScreen) loginScreen.style.display = 'none';
                if (chatApp) chatApp.style.display = 'flex';
            })
            .catch((error) => {
                console.error("Error de autenticación:", error);
                if (errorMsg) errorMsg.textContent = "Correo o contraseña incorrectos.";
            });
    });
}