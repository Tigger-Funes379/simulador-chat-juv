const socket = io();

// FRASES DEL TRIBUNAL
const afirmaciones = [
    { texto: '"Si soy menor de 18 años, no puedo tener una causa penal ni sufrir consecuencias legales por lo que hago en internet."', correcta: 'mito' },
    { texto: '"Reenviar una foto íntima o editada de un compañero sin su permiso es un delito, aunque yo no la haya sacado ni editado originalmente."', correcta: 'realidad' },
    { texto: '"Si borro el mensaje o la foto del grupo, la evidencia desaparece y ya no me pueden denunciar."', correcta: 'mito' }
];

let pasoActual = -1;
let estado = 'esperando'; 
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

// --- LÓGICA DE BOTONES EXTRAS ---
document.getElementById('btn-mostrar-qr').addEventListener('click', () => {
    document.getElementById('overlay-qr-gigante').style.display = 'flex';
});

document.getElementById('btn-ocultar-qr').addEventListener('click', () => {
    document.getElementById('overlay-qr-gigante').style.display = 'none';
});

// MODO OSCURO EN EL TRIBUNAL
document.getElementById('btn-tema').addEventListener('click', (e) => {
    const body = document.body;
    const cajaPrin = document.getElementById('caja-principal');
    const titCab = document.getElementById('titulo-cabecera');
    const inst = document.getElementById('instruccion-tribunal');
    const textQr = document.getElementById('texto-qr');
    const titQr = document.getElementById('titulo-qr');

    body.classList.toggle('modo-oscuro');
    
    if (body.classList.contains('modo-oscuro')) {
        e.target.innerText = '☀️ Modo Claro';
        body.style.backgroundImage = "url('img/fondo-tema-oscuro.png')";
        cajaPrin.style.backgroundColor = "rgba(11, 20, 26, 0.95)";
        cajaPrin.style.color = "#e9edef";
        textoAfirmacion.style.color = "#e9edef";
        titCab.style.backgroundColor = "rgba(32, 44, 51, 0.9)";
        titCab.style.color = "#e9edef";
        inst.style.color = "#ffeb3b";
        titQr.style.color = "#e9edef";
        textQr.style.color = "#8696a0";
    } else {
        e.target.innerText = '🌙 Modo Oscuro';
        body.style.backgroundImage = "url('img/fondo-tema-claro.jpg')";
        cajaPrin.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
        cajaPrin.style.color = "#111b21";
        textoAfirmacion.style.color = "#111b21";
        titCab.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
        titCab.style.color = "#111b21";
        inst.style.color = "#54656f";
        titQr.style.color = "#111b21";
        textQr.style.color = "#54656f";
    }
});


// --- LÓGICA DEL TECLADO ---
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
            
            textoAfirmacion.innerText = afirmaciones[pasoActual].texto;
            panelResultados.style.display = 'flex';
            document.getElementById('votos-realidad').innerText = '0';
            document.getElementById('votos-mito').innerText = '0';
            
            document.getElementById('caja-realidad').style.opacity = '1';
            document.getElementById('caja-realidad').style.borderColor = 'transparent';
            document.getElementById('caja-mito').style.opacity = '1';
            document.getElementById('caja-mito').style.borderColor = 'transparent';

            instruccion.innerText = "Presioná ENTER para ABRIR la votación en los celulares";
            estado = 'esperando_abrir';
        }
        
    } else if (e.code === 'Enter') {
        if (estado === 'esperando_abrir') {
            socket.emit('abrir_votacion_tribunal');
            instruccion.innerText = "Votación Abierta. Presioná ENTER para CERRAR y ver la respuesta";
            estado = 'votando';
            
        } else if (estado === 'votando') {
            socket.emit('cerrar_votacion_tribunal');
            
            const correcta = afirmaciones[pasoActual].correcta; 
            
            if (correcta === 'realidad') {
                document.getElementById('caja-realidad').style.borderColor = 'white';
                document.getElementById('caja-realidad').style.boxShadow = '0 0 30px rgba(67, 160, 71, 0.8)';
                document.getElementById('caja-mito').style.opacity = '0.3';
            } else {
                document.getElementById('caja-mito').style.borderColor = 'white';
                document.getElementById('caja-mito').style.boxShadow = '0 0 30px rgba(229, 57, 53, 0.8)';
                document.getElementById('caja-realidad').style.opacity = '0.3';
            }
            
            instruccion.innerText = "Presioná ESPACIO para la siguiente afirmación";
            estado = 'resultados';
        }
    } else if (e.code === 'KeyR') {
        if (confirm('¿Reiniciar todo el taller?')) {
            socket.emit('reiniciar_taller');
            window.location.href = 'index.html'; 
        }
    }
});