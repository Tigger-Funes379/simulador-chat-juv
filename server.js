const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Variables globales del servidor
let estadoVotacion = {
    activa: false,
    opciones: null,
    fin: false // Nuevo estado para el fin de la simulación
};

let participantesConectados = 0; // Contador en vivo

io.on('connection', (socket) => {
    // Al conectar sumamos uno y avisamos al proyector
    participantesConectados++;
    io.emit('actualizar_participantes', participantesConectados);

    // Mandamos el estado actual al celular que acaba de entrar
    socket.emit('estado_actual', estadoVotacion);

    socket.on('abrir_votacion', (opciones) => {
        estadoVotacion = { activa: true, opciones: opciones, fin: false };
        io.emit('votacion_abierta', opciones);
    });

    socket.on('cerrar_votacion', () => {
        estadoVotacion = { activa: false, opciones: null, fin: false };
        io.emit('votacion_cerrada');
    });

    // NUEVO: El proyector avisa que terminó la simulación
    socket.on('fin_simulacion', () => {
        estadoVotacion = { activa: false, opciones: null, fin: true };
        io.emit('simulacion_finalizada');
    });

    socket.on('voto_enviado', (opcion) => {
        io.emit('actualizar_votos', opcion);
    });

    // NUEVO: El facilitador apretó la "R" para limpiar el taller
    socket.on('reiniciar_taller', () => {
        estadoVotacion = { activa: false, opciones: null, fin: false };
        io.emit('expulsar_clientes'); // Le decimos a los celus que se desconecten
    });

    socket.on('disconnect', () => {
        // Al desconectarse restamos uno y avisamos
        participantesConectados--;
        io.emit('actualizar_participantes', participantesConectados);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});