import { db } from './Firebase.js';
import { 
    ref, 
    set, 
    onValue, 
    onDisconnect, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { actualizarTicksColor } from './ticks.js';

export function registrarPresencia(uid) {
    if (!uid) return;

    const userStatusRef = ref(db, `status/${uid}`);
    const connectedRef = ref(db, '.info/connected');

    onValue(connectedRef, (snapshot) => {
        if (snapshot.val() === false) return;

        onDisconnect(userStatusRef).set({
            state: 'offline',
            last_changed: serverTimestamp()
        }).then(() => {
            set(userStatusRef, {
                state: 'online',
                last_changed: serverTimestamp()
            });
        });
    });
}

export function setTypingStatus(uid, isTyping) {
    if (!uid) return;
    const typingRef = ref(db, `typing/${uid}`);
    set(typingRef, isTyping);
}

export function formatearUltimaVez(timestamp) {
    if (!timestamp) return 'last seen recently';
    
    const fecha = new Date(timestamp);
    const ahora = new Date();

    const hora = fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const esHoy = fecha.toDateString() === ahora.toDateString();

    const ayer = new Date();
    ayer.setDate(ahora.getDate() - 1);
    const esAyer = fecha.toDateString() === ayer.toDateString();

    if (esHoy) return `last seen today at ${hora}`;
    if (esAyer) return `last seen yesterday at ${hora}`;

    return `last seen on ${fecha.toLocaleDateString()} at ${hora}`;
}

export function escucharEstadoOtroUsuario(targetUid, elementoDOM) {
    if (!targetUid || !elementoDOM) return;

    const statusRef = ref(db, `status/${targetUid}`);
    const typingRef = ref(db, `typing/${targetUid}`);

    let isOnline = false;
    let lastSeenText = '';

    onValue(statusRef, (snapshot) => {
        const data = snapshot.val();

        if (!data) {
            lastSeenText = 'last seen recently';
            isOnline = false;
        } else if (data.state === 'online') {
            lastSeenText = 'Online';
            isOnline = true;
        } else {
            lastSeenText = formatearUltimaVez(data.last_changed);
            isOnline = false;
        }
        
        actualizarUI();
        actualizarTicksColor(isOnline); // Esto actualiza tanto la variable como el DOM
    });

    onValue(typingRef, (snapshot) => {
        const isTyping = snapshot.val();
        if (isTyping) {
            elementoDOM.textContent = 'typing...';
            elementoDOM.classList.add('typing-tag');
        } else {
            actualizarUI();
        }
    });

    function actualizarUI() {
        elementoDOM.textContent = lastSeenText;
        elementoDOM.classList.remove('typing-tag');
        if (isOnline) {
            elementoDOM.classList.add('online-tag');
        } else {
            elementoDOM.classList.remove('online-tag');
        }
    }
}