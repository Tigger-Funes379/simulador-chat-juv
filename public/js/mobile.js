const socket = io();
const pantallaCelular = document.getElementById('pantalla-celular');
let votoEnviado = false;

// Estado 1: Esperando a que el facilitador llegue a una Parada
function renderizarEspera() {
    pantallaCelular.innerHTML = `
        <div class="mensaje-exito" style="border-color: #ffeb3b;">
            <h2 style="color: #ffeb3b;">⏳ Esperando...</h2>
            <p>Mirá la pantalla principal.</p>
            <p>Las opciones aparecerán acá cuando lleguemos a una Parada Dilemática.</p>
        </div>
    `;
}

// Estado 2: Votación Abierta (Dibuja los botones simples)
function renderizarBotones() {
    pantallaCelular.innerHTML = `
        <h2>Elige tu opción</h2>
        <button class="btn-voto" data-opcion="A">Opción A</button>
        <button class="btn-voto" data-opcion="B">Opción B</button>
        <button class="btn-voto" data-opcion="C">Opción C</button>
    `;

    const botones = document.querySelectorAll('.btn-voto');
    botones.forEach(boton => {
        boton.addEventListener('click', (e) => {
            if (votoEnviado) return;

            const opcion = e.target.getAttribute('data-opcion');
            socket.emit('voto_enviado', opcion);
            votoEnviado = true;
            
            // Estado 3: Voto Enviado
            pantallaCelular.innerHTML = `
                <div class="mensaje-exito">
                    <h2>¡Voto enviado! 🚀</h2>
                    <p>Elegiste la Opción ${opcion}.</p>
                    <p>Esperá a que el facilitador continúe la historia.</p>
                </div>
            `;
        });
    });
}

// Escuchadores de eventos del servidor
socket.on('estado_actual', (estado) => {
    if (estado.activa && !votoEnviado) {
        renderizarBotones();
    } else if (!votoEnviado) {
        renderizarEspera();
    }
});

socket.on('votacion_abierta', () => {
    votoEnviado = false; // Reiniciamos el bloqueo para la nueva parada
    renderizarBotones();
});

socket.on('votacion_cerrada', () => {
    renderizarEspera();
});