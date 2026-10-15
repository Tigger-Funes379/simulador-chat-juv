const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Variable para saber si los celulares deben mostrar botones o esperar
let estadoVotacion = {
    activa: false,
    opciones: null
};

io.on('connection', (socket) => {
    console.log('Un usuario se ha conectado:', socket.id);

    // Cuando alguien escanea el QR, le mandamos el estado actual al instante
    socket.emit('estado_actual', estadoVotacion);

    // El proyector avisa que se abrió una parada
    socket.on('abrir_votacion', (opciones) => {
        estadoVotacion = { activa: true, opciones: opciones };
        io.emit('votacion_abierta', opciones);
    });

    // El proyector avisa que se cerró la parada (tecla Enter)
    socket.on('cerrar_votacion', () => {
        estadoVotacion = { activa: false, opciones: null };
        io.emit('votacion_cerrada');
    });

    // Un celular envía un voto
    socket.on('voto_enviado', (opcion) => {
        io.emit('actualizar_votos', opcion);
    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});