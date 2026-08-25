// Variable interna para almacenar el estado del interlocutor
let otroUsuarioConectado = false;

export function getOtroUsuarioConectado() {
    return otroUsuarioConectado;
}

/**
 * Actualiza el estado global de conexión y cambia el color de los ticks
 * @param {boolean} isOnline - Estado de conexión del otro usuario
 */
export function actualizarTicksColor(isOnline) {
    otroUsuarioConectado = isOnline;
    const ticks = document.querySelectorAll('.mensaje-propio .tick');
    ticks.forEach(tick => {
        if (isOnline) {
            tick.classList.add('tick-azul');
            tick.classList.remove('tick-gris');
        } else {
            tick.classList.add('tick-gris');
            tick.classList.remove('tick-azul');
        }
    });
}