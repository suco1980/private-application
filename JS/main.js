import { db, auth } from './Firebase.js';
import { ref, push, set, onChildAdded, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { registrarPresencia, escucharEstadoOtroUsuario, setTypingStatus } from './presence.js';
import { getOtroUsuarioConectado } from './ticks.js'; // <- CAMBIO AQUÍ

const messageInput = document.getElementById('message-input');
const chatForm = document.getElementById('chatForm');
const chatBox = document.getElementById('chat-box');
const loginScreen = document.getElementById('login-screen');
const chatApp = document.getElementById('chat-app');
const btnPanico = document.getElementById('btn-panico');
const userStatusHeader = document.getElementById('user-status');

let usuarioActual = null;
let escuchandoOtroUsuario = false;
let typingTimeout = null;

function escucharMensajes() {
    const mensajesRef = ref(db, 'mensajes');
    chatBox.innerHTML = ''; 

    onChildAdded(mensajesRef, (snapshot) => {
        const mensaje = snapshot.val();

        const mensajeDiv = document.createElement('div');
        mensajeDiv.classList.add('mensaje-item');
        
        const horaMensaje = new Date(mensaje.timestamp || Date.now()).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });

        if (usuarioActual && mensaje.uid === usuarioActual.uid) {
            mensajeDiv.classList.add('mensaje-propio');
            
            // Consultar si el otro usuario está conectado al pintar este mensaje
            const claseTick = getOtroUsuarioConectado() ? 'tick-azul' : 'tick-gris';

            mensajeDiv.innerHTML = `
                <p>${mensaje.texto} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p>
                <div class="mensaje-info">
                    <span class="hora">${horaMensaje}</span>
                    <span class="tick ${claseTick}">✓✓</span>
                </div>
            `;
        } else {
            mensajeDiv.classList.add('mensaje-ajeno');
            mensajeDiv.innerHTML = `
                <p>${mensaje.texto} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p>
                <div class="mensaje-info">
                    <span class="hora">${horaMensaje}</span>
                </div>
            `;
        }

        chatBox.appendChild(mensajeDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

if (messageInput) {
    messageInput.addEventListener('input', () => {
        if (!usuarioActual) return;

        setTypingStatus(usuarioActual.uid, true);

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            setTypingStatus(usuarioActual.uid, false);
        }, 2000);
    });
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        usuarioActual = user;
        if (loginScreen) loginScreen.style.display = 'none';
        if (chatApp) chatApp.style.display = 'flex';
        
        registrarPresencia(user.uid);

        const statusRef = ref(db, 'status');
        onValue(statusRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const otroUsuarioUid = Object.keys(data).find(uid => uid !== user.uid);
                if (otroUsuarioUid && !escuchandoOtroUsuario) {
                    escucharEstadoOtroUsuario(otroUsuarioUid, userStatusHeader);
                    escuchandoOtroUsuario = true;
                }
            }
        });

        escucharMensajes();
    } else {
        usuarioActual = null;
        if (loginScreen) loginScreen.style.display = 'block';
        if (chatApp) chatApp.style.display = 'none';
    }
});

if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const texto = messageInput.value.trim();

        if (texto !== "" && usuarioActual) {
            setTypingStatus(usuarioActual.uid, false);
            clearTimeout(typingTimeout);

            const mensajesRef = ref(db, 'mensajes');
            const nuevoMensajeRef = push(mensajesRef);

            set(nuevoMensajeRef, {
                texto: texto,
                usuario: usuarioActual.email,
                uid: usuarioActual.uid,
                timestamp: Date.now()
            })
            .then(() => {
                messageInput.value = "";
            });
        }
    });
}

if (btnPanico) {
    btnPanico.addEventListener('click', () => {
        signOut(auth);
        window.location.replace("https://www.google.com");
    });
}