const socket = io();

// Acá ponés todas las frases que quieras debatir
const afirmaciones = [
    { texto: '"Si soy menor de 18 años, no puedo tener una causa penal ni sufrir consecuencias legales por lo que hago en internet."', correcta: 'mito' },
    { texto: '"Reenviar una foto íntima o editada de un compañero sin su permiso es un delito, aunque yo no la haya sacado ni editado originalmente."', correcta: 'realidad' },
    { texto: '"Si borro el mensaje o la foto del grupo, la evidencia desaparece y ya no me pueden denunciar."', correcta: 'mito' }
];

let pasoActual = -1;
let estado = 'esperando'; // 'esperando', 'votando', 'resultados'
let votosRealidad = 0;
let votosMito = 0;

const textoAfirmacion = document.getElementById('texto-afirmacion');
const panelResultados = document.getElementById('panel-resultados');
const instruccion = document.getElementById('instruccion-tribunal');

socket.on('actualizar_participantes', (cantidad) => {
    document.getElementById('contador-participantes').innerText = `👥 Participantes: ${cantidad}`;
});

socket.on('actualizar_votos_tribunal', (votos) => {
    if (estado === 'votando') {
        document.getElementById('votos-realidad').innerText = votos.realidad;
        document.getElementById('votos-mito').innerText = votos.mito;
    }
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (estado === 'esperando' || estado === 'resultados') {
            pasoActual++;
            if (pasoActual >= afirmaciones.length) {
                textoAfirmacion.innerText = "¡Fin de la actividad!";
                panelResultados.style.display = 'none';
                instruccion.innerText = "Presioná R para reiniciar el taller completo.";
                return;
            }
            
            // Mostrar nueva afirmación
            textoAfirmacion.innerText = afirmaciones[pasoActual].texto;
            panelResultados.style.display = 'flex';
            document.getElementById('votos-realidad').innerText = '0';
            document.getElementById('votos-mito').innerText = '0';
            
            // Limpiar estilos de ganador anterior
            document.getElementById('caja-realidad').style.opacity = '1';
            document.getElementById('caja-realidad').style.borderColor = 'transparent';
            document.getElementById('caja-mito').style.opacity = '1';
            document.getElementById('caja-mito').style.borderColor = 'transparent';

            instruccion.innerText = "Presioná ENTER para ABRIR la votación en los celulares";
            estado = 'esperando_abrir';
        }
        
    } else if (e.code === 'Enter') {
        if (estado === 'esperando_abrir') {
            // Abrimos votación
            socket.emit('abrir_votacion_tribunal');
            instruccion.innerText = "Votación Abierta. Presioná ENTER para CERRAR y ver la respuesta correcta";
            estado = 'votando';
            
        } else if (estado === 'votando') {
            // Cerramos votación y mostramos la verdad
            socket.emit('cerrar_votacion_tribunal');
            
            const correcta = afirmaciones[pasoActual].correcta; // 'mito' o 'realidad'
            
            if (correcta === 'realidad') {
                document.getElementById('caja-realidad').style.borderColor = 'white';
                document.getElementById('caja-realidad').style.boxShadow = '0 0 30px rgba(67, 160, 71, 0.8)';
                document.getElementById('caja-mito').style.opacity = '0.3';
            } else {
                document.getElementById('caja-mito').style.borderColor = 'white';
                document.getElementById('caja-mito').style.boxShadow = '0 0 30px rgba(229, 57, 53, 0.8)';
                document.getElementById('caja-realidad').style.opacity = '0.3';
            }
            
            instruccion.innerText = "Presioná ESPACIO para pasar a la siguiente afirmación";
            estado = 'resultados';
        }
    } else if (e.code === 'KeyR') {
        if (confirm('¿Reiniciar todo el taller?')) {
            socket.emit('reiniciar_taller');
            window.location.href = 'index.html'; // Vuelve al simulador principal
        }
    }
});