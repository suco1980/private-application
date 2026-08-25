import { db, auth } from './Firebase.js';
import { ref, push, set, onChildAdded } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Elementos del HTML (IDs corregidos)
const messageInput = document.getElementById('message-input');
const chatForm = document.getElementById('chatForm');
const chatBox = document.getElementById('chat-box');
const loginScreen = document.getElementById('login-screen');
const chatApp = document.getElementById('chat-app');

let usuarioActual = null;

// 1. Controlar el estado de autenticación y la vista
onAuthStateChanged(auth, (user) => {
    if (user) {
        usuarioActual = user;
        loginScreen.style.display = 'none';
        chatApp.style.display = 'block';
        escucharMensajes(); // Cargar los mensajes en pantalla
    } else {
        loginScreen.style.display = 'block';
        chatApp.style.display = 'none';
    }
});

// 2. Función para enviar el mensaje a Firebase
if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Evita la recarga de la página

        const texto = messageInput.value.trim();

        if (texto !== "" && usuarioActual) {
            const mensajesRef = ref(db, 'mensajes');
            const nuevoMensajeRef = push(mensajesRef);

            set(nuevoMensajeRef, {
                texto: texto,
                usuario: usuarioActual.email,
                uid: usuarioActual.uid,
                timestamp: Date.now()
            })
            .then(() => {
                messageInput.value = ""; // Limpia la caja de texto
            })
            .catch((error) => {
                console.error("Error al guardar mensaje:", error);
            });
        }
    });
}

// 3. Función para mostrar mensajes en tiempo real dentro del chat
function escucharMensajes() {
    const mensajesRef = ref(db, 'mensajes');
    chatBox.innerHTML = ''; // Limpiar la caja antes de renderizar

    onChildAdded(mensajesRef, (snapshot) => {
        const mensaje = snapshot.val();
        
        const mensajeDiv = document.createElement('div');
        mensajeDiv.classList.add('mensaje-item');
        
        // Estilo diferenciado si el mensaje es del usuario actual
        if (usuarioActual && mensaje.uid === usuarioActual.uid) {
            mensajeDiv.classList.add('mensaje-propio');
        } else {
            mensajeDiv.classList.add('mensaje-ajeno');
        }

        mensajeDiv.innerHTML = `
            <p>${mensaje.texto}</p>
        `;

        chatBox.appendChild(mensajeDiv);
        chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll al final
    });
}