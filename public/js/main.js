const socket = io();

const sonidoMensaje = new Audio('audio/mensaje.mp3');
const sonidoParada = new Audio('audio/parada.mp3');
const sonidoGanador = new Audio('audio/ganador.mp3');
const sonidoEvento = new Audio('audio/evento.mp3');

let contadores = { A: 0, B: 0, C: 0 };
let enModoVotacion = false;
let votacionCerradaYEnPausa = false; 
let perspectivaActual = 'Nico'; 

const chatContainer = document.getElementById('chat-container');
const overlayParada = document.getElementById('overlay-parada');
const overlayFin = document.getElementById('overlay-fin');

// --- GUION ---
const guion = [
    { tipo: 'cambio_escena', perspectiva: 'Nico', titulo: 'Promo 5to - Oficial 🎓🔥', subtitulo: 'Nico, Sofí, Mati, Camila, Lucas...', avatar: 'img/grupo.jpg' },
    { tipo: 'msj', emisor: 'Nico', texto: 'Che, ¿alguien vio el buzo que dejé en el banco de atrás? Tenía $15.000 adentro para la fotocopiadora.' },
    { tipo: 'msj', emisor: 'Sofí', texto: 'Yo no vi nada.' },
    { tipo: 'msj', emisor: 'Mati', texto: 'Yo tampoco, pero recién lo vi a Lucas guardando algo rápido en la mochila antes de salir al recreo 👀.' },
    { tipo: 'msj', emisor: 'Nico', texto: 'Naaa, ¿posta? Lucas no seas careta, devolveme la plata loco.' },
    { tipo: 'msj', emisor: 'Lucas', texto: '¿Qué flashean? Yo guardé mi botellita de agua. No toqué la plata de nadie, dejen de acusar sin saber.' },
    { tipo: 'msj', emisor: 'Camila', imagen: 'img/pibe.png' },
    { tipo: 'msj', emisor: 'Mati', texto: 'JAAAAJAJAJA 💀💀💀' },
    { tipo: 'msj', emisor: 'Camila', texto: 'Si no aparece la plata, esta foto va directo al perfil del colegio o a un sticker para todos los grupos.' },
    { 
        tipo: 'parada', numero: 1, 
        titulo: 'La decisión del grupo ante la difamación',
        pregunta: '¿Qué hace el resto del grupo de WhatsApp ante la foto y el mensaje de Camila?',
        opciones: { 
            A: 'La Ola: Todos mandan stickers de risa, reenvían la foto a otros grupos y ponen "Manden más contexto".', 
            B: 'El Silencio: Nadie dice nada, leen los mensajes pero dejan pasar la situación para no meterse en problemas.', 
            C: 'El Freno: Un compañero escribe en el grupo: "Pará Cami, borrá eso. No da acusar ni subir fotos sin saber, nos vamos a comer un garrón todos".' 
        },
        ramificacion: {
            opcionA_B: [
                { tipo: 'sistema', texto: 'La foto fue reenviada 14 veces.' },
                { tipo: 'cambio_escena', perspectiva: 'Lucas', titulo: 'Número Desconocido', subtitulo: 'en línea', avatar: 'img/desconocido.jpg' },
                { tipo: 'sistema', texto: '⚠️ RIESGO DETECTADO: Delito contra la Intimidad / Coacción (Apriete) / Difamación.' }
            ],
            opcionC: [
                { tipo: 'msj', emisor: 'Sofí', texto: 'Pará Cami, borrá eso. No da acusar ni subir fotos sin saber, nos vamos a comer un garrón todos.' },
                { tipo: 'msj', emisor: 'Camila', texto: 'A mí no me van a decir qué hacer.' },
                { tipo: 'sistema', texto: 'Camila manda la amenaza por un grupo paralelo. Sin intervención institucional o adulta, la presión continúa por privado.' },
                { tipo: 'cambio_escena', perspectiva: 'Lucas', titulo: 'Número Desconocido', subtitulo: 'en línea', avatar: 'img/desconocido.jpg' },
                { tipo: 'sistema', texto: '⚠️ RIESGO DETECTADO: Delito contra la Intimidad / Extorsión / Difamación.' }
            ]
        }
    },
    { tipo: 'msj', emisor: 'Número Desconocido', texto: 'Tenés hasta la salida para poner los $15.000 de Nico más $10.000 "de multa" por hacerte el gil, o la foto circula por todo el colegio y les avisamos a tus viejos.' },
    { tipo: 'msj', emisor: 'Lucas', texto: 'No tengo esa plata, no fui yo. Borren eso por favor, me están arruinando.' },
    { tipo: 'sistema', texto: 'Lucas bloquea el celular, no entra a la siguiente hora de clase y se va solo a la plaza de enfrente.' },
    { 
        tipo: 'parada', numero: 2, 
        titulo: 'El punto de quiebre y la intervención',
        pregunta: 'Lucas está en la plaza desbordado y asustado. ¿Qué camino toma la situación en este momento?',
        opciones: { 
            A: 'Llegada de la Denuncia Judicial: Los padres de Lucas ven los mensajes, van directo a la comisaría y radican una denuncia por Extorsión y Violencia Digital.', 
            B: 'Intervención Institucional / Gabinete: Un compañero/a que vio el chat se acerca al Servicio de Orientación Escolar (SOE) / Directora y muestra las capturas antes de que explote afuera.', 
            C: 'Justicia por mano propia: Los amigos de Nico van a buscar a Lucas a la salida para sacarle las cosas de la mochila por la fuerza.' 
        }
    },
    { tipo: 'cambio_escena', perspectiva: 'Nico', titulo: 'Promo 5to - Oficial 🎓🔥', subtitulo: 'Nico, Sofí, Mati, Camila, Lucas...', avatar: 'img/grupo.jpg' },
    { tipo: 'sistema', texto: 'Lunes, 10:30 AM. Tres días después.' },
    { tipo: 'msj', emisor: 'Nico', texto: 'Gente, me llegó una citación de la fiscalía a mi casa. Mis viejos me quieren matar.' },
    { tipo: 'msj', emisor: 'Camila', texto: 'A mí también... dicen que la directora presentó capturas de pantalla y la justicia intervino.' },
    { tipo: 'msj', emisor: 'Mati', texto: 'Pero pará, ¡si era una joda! No hicimos nada grave, somos menores de edad.' },
    { tipo: 'sistema', texto: 'Llegó la notificación formal de la Fiscalía Penal Juvenil al colegio y a las familias de Camila, Mati y Nico.' },
    { 
        tipo: 'parada', numero: 3, 
        titulo: 'Resolución y consecuencias (Empalme Teórico)',
        pregunta: '¿Qué creen que pasa ahora según la Ley 27.801 y la Ley Provincial 9.735?',
        opciones: { 
            A: '"Son menores de edad, no pasa nada, se resuelve con una amonestación en la escuela y fue."', 
            B: '"A los pibes los llevan directamente a la comisaría del menor y a los padres no les dicen nada."', 
            C: '"Se abre una causa penal juvenil (a partir de los 14 años), intervienen supervisores especializados, los padres responden económicamente por los daños y se aplican pautas de conducta o reparación comunitaria."' 
        }
    },
    { tipo: 'fin_simulacion' }
];

let pasoActual = 0;

function avanzarHistoria() {
    if (enModoVotacion || votacionCerradaYEnPausa || pasoActual >= guion.length) return;

    const actual = guion[pasoActual];

    if (actual.tipo === 'cambio_escena') {
        chatContainer.innerHTML = '';
        perspectivaActual = actual.perspectiva;
        document.getElementById('chat-titulo').innerText = actual.titulo;
        document.getElementById('chat-subtitulo').innerText = actual.subtitulo;
        if (actual.avatar) document.getElementById('chat-avatar').src = actual.avatar;
        pasoActual++;
        return;
    }

    if (actual.tipo === 'msj') {
        const alineacion = (actual.emisor === perspectivaActual) ? 'der' : 'izq';
        let contenidoMensaje = '';
        if (actual.texto) {
            contenidoMensaje = `<span class="texto">${actual.texto}</span>`;
        } else if (actual.imagen) {
            contenidoMensaje = `<img src="${actual.imagen}" alt="Foto enviada" class="mensaje-imagen">`;
        }

        chatContainer.innerHTML += `
            <div class="mensaje ${alineacion}">
                <span class="emisor emisor-${actual.emisor}">${actual.emisor}</span> 
                ${contenidoMensaje}
            </div>
        `;
        sonidoMensaje.currentTime = 0;
        sonidoMensaje.play().catch(e => console.log(e));

    } else if (actual.tipo === 'sistema') {
        chatContainer.innerHTML += `<div class="mensaje-sistema"><span>${actual.texto}</span></div>`;
        sonidoEvento.currentTime = 0;
        sonidoEvento.play().catch(e => console.log(e));

    } else if (actual.tipo === 'parada') {
        sonidoParada.play().catch(() => {});
        enModoVotacion = true;
        
        // Restauramos los estilos visuales para que arranque limpia
        document.getElementById('caja-qr').style.display = 'flex'; // Volvemos a mostrar el QR lateral
        document.getElementById('instruccion-cierre').innerText = 'Presioná ENTER para cerrar votación y debatir';
        
        ['A', 'B', 'C'].forEach(op => {
            const caja = document.querySelector(`.opcion-item.${op}`);
            caja.style.opacity = '1';
            caja.style.transform = 'none';
            caja.style.boxShadow = 'none';
            caja.style.border = 'none';
        });

        document.getElementById('overlay-titulo').innerText = `🛑 PARADA ${actual.numero}: ${actual.titulo}`;
        document.getElementById('overlay-pregunta').innerText = actual.pregunta;
        document.getElementById('texto-A').innerText = actual.opciones.A;
        document.getElementById('texto-B').innerText = actual.opciones.B;
        document.getElementById('texto-C').innerText = actual.opciones.C;
        overlayParada.style.display = 'flex';

        socket.emit('abrir_votacion', actual.opciones);
        
    } else if (actual.tipo === 'fin_simulacion') {
        overlayFin.style.display = 'flex';
        socket.emit('fin_simulacion'); 
    }

    chatContainer.scrollTop = chatContainer.scrollHeight;
    pasoActual++;
}

// --- ACTUALIZACIÓN DE DATOS ---
socket.on('actualizar_votos', (opcion) => {
    if (enModoVotacion && contadores[opcion] !== undefined) {
        contadores[opcion]++;
        document.getElementById(`votos-${opcion}`).innerText = contadores[opcion];
    }
});

socket.on('actualizar_participantes', (cantidad) => {
    const contador = document.getElementById('contador-participantes');
    if (contador) contador.innerText = `👥 Participantes: ${cantidad}`;
    
    const contadorQR = document.getElementById('contador-qr');
    if (contadorQR) contadorQR.innerText = `👥 Participantes: ${cantidad}`;
});

// --- LÓGICA DE BOTONES ---
const btnTema = document.getElementById('btn-tema');
if (btnTema) {
    btnTema.addEventListener('click', (e) => {
        document.body.classList.toggle('modo-oscuro');
        if (document.body.classList.contains('modo-oscuro')) {
            e.target.innerText = '☀️ Modo Claro';
        } else {
            e.target.innerText = '🌙 Modo Oscuro';
        }
    });
}

// Botones para abrir y cerrar el QR gigante
document.getElementById('btn-mostrar-qr').addEventListener('click', () => {
    document.getElementById('overlay-qr-gigante').style.display = 'flex';
});

document.getElementById('btn-ocultar-qr').addEventListener('click', () => {
    document.getElementById('overlay-qr-gigante').style.display = 'none';
});

// --- LÓGICA DE TECLADO ---
document.addEventListener('keydown', (e) => {
    
    if (e.code === 'Space') {
        if (votacionCerradaYEnPausa) {
            votacionCerradaYEnPausa = false;
            overlayParada.style.display = 'none';
            
            let paradaActual = guion[pasoActual - 1];
            
            if (paradaActual.ramificacion) {
                let ramaElegida = [];
                if (paradaActual.ganador === 'A' || paradaActual.ganador === 'B') {
                    ramaElegida = paradaActual.ramificacion.opcionA_B;
                } else if (paradaActual.ganador === 'C') {
                    ramaElegida = paradaActual.ramificacion.opcionC;
                }
                guion.splice(pasoActual, 0, ...ramaElegida);
            }

            contadores = { A: 0, B: 0, C: 0 };
            document.getElementById('votos-A').innerText = '0';
            document.getElementById('votos-B').innerText = '0';
            document.getElementById('votos-C').innerText = '0';
            
            avanzarHistoria();
        } else {
            avanzarHistoria();
        }
        
    } else if (e.code === 'Enter' && enModoVotacion) {
        
        enModoVotacion = false;
        votacionCerradaYEnPausa = true; 
        
        // Escondemos la caja del QR para que el foco quede en el debate y la opción ganadora
        document.getElementById('caja-qr').style.display = 'none'; 
        
        let ganador = 'A'; 
        let maxVotos = contadores.A;
        if (contadores.B > maxVotos) { ganador = 'B'; maxVotos = contadores.B; }
        if (contadores.C > maxVotos) { ganador = 'C'; maxVotos = contadores.C; }
        
        guion[pasoActual - 1].ganador = ganador;

        sonidoGanador.currentTime = 0;
        sonidoGanador.play().catch(e => console.log(e));
        
        ['A', 'B', 'C'].forEach(op => {
            const caja = document.querySelector(`.opcion-item.${op}`);
            if (op === ganador) {
                caja.style.transform = 'scale(1.05)';
                caja.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.8)';
                caja.style.border = '3px solid #fff';
            } else {
                caja.style.opacity = '0.3'; 
            }
        });

        document.getElementById('instruccion-cierre').innerText = '✅ Votación Cerrada. Presioná BARRA ESPACIADORA para continuar con la historia.';

        let paradaActual = guion[pasoActual - 1];
        socket.emit('cerrar_votacion', { 
            parada: paradaActual.numero, 
            A: contadores.A, 
            B: contadores.B, 
            C: contadores.C 
        });

    } else if (e.code === 'KeyR') {
        if (confirm('⚠️ ¿Estás seguro de que querés REINICIAR el taller?')) {
            socket.emit('reiniciar_taller');
            location.reload(); 
        }
    }
});

avanzarHistoria();