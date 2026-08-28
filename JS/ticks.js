export function actualizarColorTicksMensaje(messageId, isRead) {
    const messageElement = document.querySelector(`[data-id="${messageId}"]`);
    if (!messageElement) return;

    const tick = messageElement.querySelector('.tick');
    if (!tick) return;

    if (isRead) {
        tick.classList.add('tick-azul');
        tick.classList.remove('tick-gris');
    } else {
        tick.classList.add('tick-gris');
        tick.classList.remove('tick-azul');
    }
}