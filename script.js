// Configuración de Parámetros de Operación
const CONFIG = {
  WHATSAPP_PHONE: "528117616817",
  SAVEIRO_MAX_KG: 650,
  BODEGA_COORDS: { lat: 25.6866, lon: -100.3161 }, // Monterrey / Apodaca
  TARIFA_BASE: 200,
  COSTO_PER_KM: 14,
  COSTO_MANIOBRA_UNIDAD: 3.5
};

// Control de Ventana Modal
function toggleModal(show) {
  const backdrop = document.getElementById('modalBackdrop');
  if (show) {
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  } else {
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }
}

document.getElementById('modalBackdrop').addEventListener('click', (e) => {
  if (e.target.id === 'modalBackdrop') toggleModal(false);
});

// Autoselección de fecha mínima
const fechaInput = document.getElementById('fechaEnvio');
const hoy = new Date().toISOString().split('T')[0];
fechaInput.min = hoy;
fechaInput.value = hoy;

// Escuchadores de cambio en tiempo real
document.querySelectorAll('#calcForm input, #calcForm select').forEach(element => {
  element.addEventListener('input', ejecutarCalculo);
});

// Geolocalización GPS en Tiempo Real
function obtenerUbicacionGPS() {
  const statusTxt = document.getElementById('gpsStatusText');

  if (!navigator.geolocation) {
    statusTxt.innerText = "Navegador no soporta geolocalización GPS.";
    return;
  }

  statusTxt.innerText = "Obteniendo coordenadas GPS...";

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const distDirecta = haversineDistance(
        pos.coords.latitude, pos.coords.longitude,
        CONFIG.BODEGA_COORDS.lat, CONFIG.BODEGA_COORDS.lon
      );
      // Factor de ajuste para red vial urbana (+30%)
      const distVial = Math.round((distDirecta * 1.3) * 10) / 10;

      document.getElementById('distanciaKm').value = distVial;
      statusTxt.innerText = `Distancia calculada: ~${distVial} km desde bodega`;
      ejecutarCalculo();
    },
    () => { statusTxt.innerText = "Permiso denegado o GPS no disponible."; },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Algoritmo de Cálculo Dinámico
function ejecutarCalculo() {
  const pesoUnitario = parseFloat(document.getElementById('peso').value) || 0;
  const cantidad = parseInt(document.getElementById('cantidad').value) || 0;
  const distanciaKm = parseFloat(document.getElementById('distanciaKm').value) || 0;
  const requiereManiobra = document.getElementById('maniobra').value === 'con';

  const alertNotice = document.getElementById('alertNotice');
  const precioTotalEl = document.getElementById('precioTotal');
  const desgloseText = document.getElementById('desgloseText');
  const btnWhatsapp = document.getElementById('btnWhatsapp');

  alertNotice.style.display = 'none';
  btnWhatsapp.disabled = true;

  if (cantidad === 0 || pesoUnitario === 0) {
    actualizarGauge(0);
    precioTotalEl.innerHTML = "$0 <small>MXN</small>";
    return;
  }

  const pesoTotal = pesoUnitario * cantidad;
  actualizarGauge(pesoTotal);

  if (pesoTotal > CONFIG.SAVEIRO_MAX_KG) {
    alertNotice.innerText = `El peso total (${pesoTotal.toFixed(1)} kg) supera el límite de 1 Saveiro (650 kg).`;
    alertNotice.style.display = 'block';
    precioTotalEl.innerText = "Exceso de Carga";
    desgloseText.innerText = "Ajusta la cantidad o contacta para unidad grande";
    return;
  }

  if (distanciaKm <= 0) {
    precioTotalEl.innerHTML = "$0 <small>MXN</small>";
    desgloseText.innerText = "Ingresa la distancia en km o activa GPS";
    return;
  }

  // Reglas de Cobro Operativo
  let factorSobrecarga = pesoTotal > 400 ? 1.15 : 1.0;
  let costoDistancia = distanciaKm * CONFIG.COSTO_PER_KM;
  let costoManiobra = requiereManiobra ? (cantidad * CONFIG.COSTO_MANIOBRA_UNIDAD) : 0;

  let tarifaTotal = Math.round(((CONFIG.TARIFA_BASE + costoDistancia) * factorSobrecarga) + costoManiobra);

  precioTotalEl.innerHTML = `$${tarifaTotal.toLocaleString()} <small>MXN</small>`;
  desgloseText.innerText = `${distanciaKm} km | ${cantidad} cajas (${pesoTotal} kg) ${requiereManiobra ? '| C/ Maniobra' : ''}`;
  btnWhatsapp.disabled = false;

  btnWhatsapp.onclick = () => {
    const calle = document.getElementById('calle').value || 'No especificada';
    const colonia = document.getElementById('colonia').value || 'Monterrey';
    const fecha = document.getElementById('fechaEnvio').value;

    const mensaje = `Hola Provac Express, solicito flete:%0A- *Carga:* ${cantidad} cajas (${pesoTotal} kg)%0A- *Fecha:* ${fecha}%0A- *Destino:* ${calle}, ${colonia}%0A- *Distancia:* ${distanciaKm} km%0A- *Cotización:* $${tarifaTotal} MXN`;
    window.open(`https://wa.me/${CONFIG.WHATSAPP_PHONE}?text=${mensaje}`, '_blank');
  };
}

function actualizarGauge(pesoTotal) {
  const gaugeFill = document.getElementById('gaugeFill');
  const gaugeText = document.getElementById('gaugeText');
  const pct = Math.min((pesoTotal / CONFIG.SAVEIRO_MAX_KG) * 100, 100);

  gaugeFill.style.width = `${pct}%`;
  gaugeText.innerText = `${pesoTotal.toFixed(1)} kg / 650 kg`;
  gaugeFill.style.backgroundColor = pesoTotal > CONFIG.SAVEIRO_MAX_KG ? 'var(--danger)' : 'var(--success)';
}