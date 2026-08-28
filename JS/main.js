import { auth, db } from './Firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, push, set, update, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { registerPresence, listenToOtherUserStatus } from './presence.js';
import { actualizarColorTicksMensaje } from './ticks.js';

onAuthStateChanged(auth, (user) => {
    if (user) {
        // 1. Registrar propia presencia
        registerPresence(user.uid);

        // 2. Escuchar el estado del otro usuario y su señal de "Escribiendo..."
        const statusElement = document.getElementById("user-status");
        const otherUserUid = "E4ltgYTHjpgjjdo8n1Kwk6JL32r2"; 

        if (otherUserUid) {
            listenToOtherUserStatus(otherUserUid, statusElement);

            // Escuchar si el otro usuario está escribiendo
            const otherUserTypingRef = ref(db, `typing/${otherUserUid}`);
            onValue(otherUserTypingRef, (snapshot) => {
                const isTyping = snapshot.val();
                if (isTyping) {
                    statusElement.textContent = "typing...";
                    statusElement.style.color = "#ffffff";
                } else {
                    listenToOtherUserStatus(otherUserUid, statusElement);
                }
            });
        }

        // 3. Envío de mensajes y detector de "Escribiendo..." propio
        const chatForm = document.getElementById("chatForm");
        const messageInput = document.getElementById("message-input");
        const typingIndicatorRef = ref(db, `typing/${user.uid}`);
        let typingTimer;

        if (messageInput) {
            messageInput.addEventListener("input", () => {
                set(typingIndicatorRef, true);
                clearTimeout(typingTimer);
                typingTimer = setTimeout(() => {
                    set(typingIndicatorRef, false);
                }, 2000);
            });
        }

        if (chatForm) {
            chatForm.onsubmit = (e) => {
                e.preventDefault();
                const messageText = messageInput.value.trim();
                if (!messageText) return;

                // Al enviar mensaje, apagamos inmediatamente el indicador de escritura
                set(typingIndicatorRef, false);
                clearTimeout(typingTimer);

                const messagesRef = ref(db, 'mensajes');
                const newMessage = {
                    senderId: user.uid,
                    text: messageText,
                    timestamp: serverTimestamp(),
                    leido: false
                };

                push(messagesRef, newMessage)
                    .then(() => {
                        messageInput.value = "";
                    })
                    .catch((error) => {
                        console.error("Error sending message:", error);
                    });
            };
        }

        // 4. Escuchar mensajes, formatear hora, ticks pequeños y lectura persistente
        const messagesRef = ref(db, 'mensajes');
        onValue(messagesRef, (snapshot) => {
            const chatBox = document.getElementById("chat-box");
            if (!chatBox) return;
            chatBox.innerHTML = ""; 

            const data = snapshot.val();
            if (!data) return;

            Object.keys(data).forEach((key) => {
                const message = data[key];
                const isMine = message.senderId === user.uid;

                let formattedTime = "";
                if (message.timestamp) {
                    const date = new Date(message.timestamp);
                    formattedTime = date.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true 
                    });
                }

                const messageDiv = document.createElement("div");
                messageDiv.className = isMine ? "mensaje-propio" : "mensaje-ajeno";
                messageDiv.setAttribute("data-id", key);

                messageDiv.innerHTML = `
                    <span class="texto-mensaje">${message.text}</span>
                    <div class="mensaje-info">
                        <span class="hora-mensaje">${formattedTime}</span>
                        ${isMine ? `<span class="tick ${message.leido ? 'tick-azul' : 'tick-gris'}">✔✔</span>` : ''}
                    </div>
                `;
                chatBox.appendChild(messageDiv);

                // Marcar como leído permanentemente si el receptor lo visualiza
                if (!isMine && !message.leido) {
                    const singleMessageRef = ref(db, `mensajes/${key}`);
                    update(singleMessageRef, { leido: true });
                }

                // Actualizar color de tick si es propio
                if (isMine) {
                    actualizarColorTicksMensaje(key, message.leido);
                }
            });
        });

        // 5. Botón de Pánico (Acción inmediata: offline, cierra sesión y abre Google sin avisos)
        const panicBtn = document.getElementById("btn-panico");

        if (panicBtn) {
            panicBtn.addEventListener("click", () => {
                const userStatusRef = ref(db, `status/${user.uid}`);
                const typingIndicatorRef = ref(db, `typing/${user.uid}`);

                // Limpiar estado de escritura y poner offline antes de salir
                set(typingIndicatorRef, false);
                set(userStatusRef, {
                    state: 'offline',
                    lastChanged: serverTimestamp()
                }).then(() => {
                    signOut(auth).then(() => {
                        window.location.href = "https://www.google.com";
                    });
                }).catch((error) => {
                    console.error("Error activating panic button:", error);
                });
            });
        }

    } else {
        console.log("No authenticated user. Credentials required.");
    }
});