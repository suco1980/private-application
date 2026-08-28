import { db } from './Firebase.js';
import { ref, set, onValue, onDisconnect, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

export function registerPresence(uid) {
    const userStatusRef = ref(db, `status/${uid}`);

    const statusData = {
        state: 'online',
        lastChanged: serverTimestamp()
    };

    onDisconnect(userStatusRef).set({
        state: 'offline',
        lastChanged: serverTimestamp()
    }).then(() => {
        set(userStatusRef, statusData);
    });
}

export function listenToOtherUserStatus(otherUserUid, statusElement) {
    const otherUserRef = ref(db, `status/${otherUserUid}`);

    onValue(otherUserRef, (snapshot) => {
        const data = snapshot.val();

        if (!statusElement) return;

        if (!data) {
            statusElement.textContent = "Offline";
            statusElement.style.color = "#ffffff";
            return;
        }

        if (data.state === 'online') {
            statusElement.textContent = "Online";
            statusElement.style.color = "#ffffff";
        } else {
            if (data.lastChanged) {
                const date = new Date(data.lastChanged);
                const disconnectionTime = date.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                });
                statusElement.textContent = `Last seen at ${disconnectionTime}`;
                statusElement.style.color = "#ffffff";
            } else {
                statusElement.textContent = "Offline";
                statusElement.style.color = "#ffffff";
            }
        }
    });
}