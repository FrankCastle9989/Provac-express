// Configuración de Servidor y Parámetros
const NUMERO_WHATSAPP = "528117616817";
const SAVEIRO_LIMITS = { MAX_PESO: 650, MAX_ANCHO_UTIL: 100, MAX_VOLUMEN: 0.825 };
const BODEGA_PROVAC = { lat: 25.6866, lon: -100.3161 };

const TARIFA_BASE = 200;
const PRECIO_KM = 14;
const PRECIO_MANIOBRA_CAJA = 3.5;

// Manejo del Modal Pop-up
const modalOverlay = document.getElementById('modalOverlay');
const openCalcHero = document.getElementById('openCalcHero');
const openCalcNav = document.getElementById('openCalcNav');
const closeModal = document.getElementById('closeModal');

function toggleModal() {
  modalOverlay.classList.toggle('active');
}

openCalcHero.addEventListener('click', toggleModal);
openCalcNav.addEventListener('click', toggleModal);
closeModal.addEventListener('click', toggleModal);

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) toggleModal();
});

// Inicialización de Inputs
const fechaInput = document.getElementById('fechaEnvio');
const hoy = new Date().toISOString().split('T')[0];
fechaInput.min = hoy;
fechaInput.value = hoy;

document.querySelectorAll('input, select').forEach(elem => {
  elem.addEventListener('input', calcularCotizacion);
});

// Lógica de GPS
function obtenerUbicacionYCalcular() {
  const gpsStatus = document.getElementById('gpsStatus');

  if (!navigator.geolocation) {
    gpsStatus.innerText = "GPS no compatible.";
    return;
  }

  gpsStatus.innerText = "Obteniendo ubicación...";

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const dist = calcularHaversine(pos.coords.latitude, pos.coords.longitude, BODEGA_PROVAC.lat, BODEGA_PROVAC.lon);
      const distVial = Math.round((dist * 1.30) * 10) / 10;

      document.getElementById('distanciaKm').value = distVial;
      gpsStatus.innerText = `Ubicación detectada (~${distVial} km)`;
      calcularCotizacion();
    },
    () => { gpsStatus.innerText = "No se pudo obtener la ubicación."; },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function calcularHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Algoritmo de Cotización
function calcularCotizacion() {
  const largo = parseFloat(document.getElementById('largo').value) || 0;
  const ancho = parseFloat(document.getElementById('ancho').value) || 0;
  const alto = parseFloat(document.getElementById('alto').value) || 0;
  const pesoUnitario = parseFloat(document.getElementById('peso').value) || 0;
  const cantidad = parseInt(document.getElementById('cantidad').value) || 0;
  const distanciaKm = parseFloat(document.getElementById('distanciaKm').value) || 0;
  const requiereManiobra = document.getElementById('maniobra').value === 'con';

  const alertBox = document.getElementById('alertBox');
  const precioTotalEl = document.getElementById('precioTotal');
  const desgloseText = document.getElementById('desgloseText');
  const btnWhatsapp = document.getElementById('btnWhatsapp');

  alertBox.style.display = 'none';
  btnWhatsapp.disabled = true;

  if (cantidad === 0 || pesoUnitario === 0) {
    actualizarBarraPeso(0);
    precioTotalEl.innerText = "$0 MXN";
    return;
  }

  const pesoTotal = pesoUnitario * cantidad;
  const volumenTotalM3 = ((largo * ancho * alto) / 1000000) * cantidad;
  actualizarBarraPeso(pesoTotal);

  if (pesoTotal > SAVEIRO_LIMITS.MAX_PESO) {
    mostrarError(`Exceso de peso: ${pesoTotal.toFixed(1)} kg excede el límite (650 kg).`, alertBox, precioTotalEl);
    return;
  }

  if (distanciaKm <= 0) {
    precioTotalEl.innerText = "$0 MXN";
    desgloseText.innerText = "Ingresa la distancia o usa el GPS";
    return;
  }

  let factorPeso = pesoTotal > 400 ? 1.15 : 1.0;
  let costoDistancia = distanciaKm * PRECIO_KM;
  let costoManiobra = requiereManiobra ? (cantidad * PRECIO_MANIOBRA_CAJA) : 0;
  let precioFinal = Math.round(((TARIFA_BASE + costoDistancia) * factorPeso) + costoManiobra);

  precioTotalEl.innerText = `$${precioFinal.toLocaleString()} MXN`;
  desgloseText.innerText = `${distanciaKm} km ${requiereManiobra ? '+ Maniobra' : ''}`;
  btnWhatsapp.disabled = false;

  btnWhatsapp.onclick = () => {
    const calle = document.getElementById('calle').value || 'No especificada';
    const colonia = document.getElementById('colonia').value || '';
    const msg = `Hola Provac, cotización de envío:%0A- Carga: ${cantidad} cajas (${pesoTotal} kg)%0A- Destino: ${calle}, ${colonia}%0A- Distancia: ${distanciaKm} km%0A- Total: $${precioFinal} MXN`;
    window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${msg}`, '_blank');
  };
}

function mostrarError(msg, alertBox, precioTotalEl) {
  alertBox.innerText = msg;
  alertBox.style.display = 'block';
  precioTotalEl.innerText = "N/A";
}

function actualizarBarraPeso(pesoTotal) {
  const pesoBar = document.getElementById('pesoBar');
  const pesoText = document.getElementById('pesoText');
  const pct = Math.min((pesoTotal / SAVEIRO_LIMITS.MAX_PESO) * 100, 100);

  pesoBar.style.width = `${pct}%`;
  pesoText.innerText = `${pesoTotal.toFixed(1)} kg / 650 kg`;
  pesoBar.style.background = pesoTotal > SAVEIRO_LIMITS.MAX_PESO ? 'var(--danger)' : 'var(--success)';
}