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
    fin: false 
};

let participantesConectados = 0; // Contador en vivo

io.on('connection', (socket) => {
    // Mandamos el estado actual al que acaba de entrar
    socket.emit('estado_actual', estadoVotacion);

    // NUEVO: Escuchamos si el que se conectó es un celular
    socket.on('soy_participante', () => {
        socket.isParticipante = true; // Marcamos a este usuario como celular
        participantesConectados++;
        io.emit('actualizar_participantes', participantesConectados);
    });

    socket.on('abrir_votacion', (opciones) => {
        estadoVotacion = { activa: true, opciones: opciones, fin: false };
        io.emit('votacion_abierta', opciones);
    });

    socket.on('cerrar_votacion', () => {
        estadoVotacion = { activa: false, opciones: null, fin: false };
        io.emit('votacion_cerrada');
    });

    socket.on('fin_simulacion', () => {
        estadoVotacion = { activa: false, opciones: null, fin: true };
        io.emit('simulacion_finalizada');
    });

    socket.on('voto_enviado', (opcion) => {
        io.emit('actualizar_votos', opcion);
    });

    socket.on('reiniciar_taller', () => {
        estadoVotacion = { activa: false, opciones: null, fin: false };
        participantesConectados = 0; // Reseteamos el contador por las dudas
        io.emit('expulsar_clientes'); 
        io.emit('actualizar_participantes', participantesConectados);
    });

    socket.on('disconnect', () => {
        // NUEVO: Al desconectarse, solo restamos si era un celular
        if (socket.isParticipante) {
            participantesConectados--;
            io.emit('actualizar_participantes', participantesConectados);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});