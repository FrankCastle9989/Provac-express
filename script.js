/**
 * Provac Express - Control de Interfaz, Modal Dinámico, Calculadora y Ruteo Vial Real
 */

// Datos de productos para el catálogo interactivo
const PRODUCTOS_CATALOGO = [
  { id: 1, categoria: 'seco', nombre: 'Snacks y Botanas Embolsadas', desc: 'Papas, fritos y secos en caja máster.', badge: 'Seco' },
  { id: 2, categoria: 'vacio', nombre: 'Carnes Frías y Embutidos', desc: 'Envasados al vacío con cadena de frío.', badge: 'Refrigerado' },
  { id: 3, categoria: 'latas', nombre: 'Refrescos y Bebidas en Lata', desc: 'Charolas y six-packs envasados.', badge: 'Bebidas' },
  { id: 4, categoria: 'botellas', nombre: 'Agua y Jugos PET', desc: 'Paquetes de botellas graduadas.', badge: 'Bebidas' },
  { id: 5, categoria: 'polvo', nombre: 'Sazonadores y Especias', desc: 'Bolsas y contenedores en polvo.', badge: 'Seco' },
  { id: 6, categoria: 'costales', nombre: 'Granos y Harinas', desc: 'Costales de 10kg a 25kg.', badge: 'Granel' },
  { id: 7, categoria: 'cosmeticos', nombre: 'Cuidado Personal y Cosméticos', desc: 'Cajas con producto frágil o empacado.', badge: 'Seco' },
  { id: 8, categoria: 'medicamentos', nombre: 'Medicamentos y Muestras (T. Ambiente)', desc: 'Sin cadena de frío. Control de temperatura ambiente.', badge: 'Especial' }
];

// Variables globales de la calculadora
let calcData = {
  capacidadMaxKg: 650,
  tarifaBase: 350,       // Tarifa base en MXN
  costoPorKm: 18,        // Costo por km en MXN
  costoManiobra: 150     // Adicional por maniobra
};

let map = null;
let markerOrigen = null;
let markerDestino = null;
let routeLine = null; // Línea trazada de la ruta

// Coordenadas por defecto (Apodaca y Centro Monterrey)
let coordsOrigen = [25.7800, -100.1800];
let coordsDestino = [25.6866, -100.3161];
let debounceTimer = null;

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
  renderCatalog(PRODUCTOS_CATALOGO);
  setupCatalogFilters();
  setupCatalogSearch();
  preloadCalculatorModal();
});

/**
 * Carga automáticamente calculadora.html si no está presente en el DOM
 */
async function preloadCalculatorModal() {
  if (!document.getElementById('modalBackdrop')) {
    try {
      const response = await fetch('calculadora.html');
      if (response.ok) {
        const html = await response.text();
        document.body.insertAdjacentHTML('beforeend', html);
        initCalculatorEvents();
        initFechaMinima();
      } else {
        console.warn('No se pudo cargar calculadora.html automáticamente.');
      }
    } catch (err) {
      console.error('Error al cargar la calculadora:', err);
    }
  } else {
    initCalculatorEvents();
    initFechaMinima();
  }
}

/**
 * Función global para abrir/cerrar el modal
 */
window.toggleModal = function(show) {
  const modal = document.getElementById('modalBackdrop');
  if (!modal) {
    preloadCalculatorModal().then(() => {
      const m = document.getElementById('modalBackdrop');
      if (m) {
        if (show) {
          m.classList.add('active');
          document.body.style.overflow = 'hidden';
          setTimeout(() => { if (typeof initMap === 'function') initMap(); }, 300);
        } else {
          m.classList.remove('active');
          document.body.style.overflow = '';
        }
      }
    });
    return;
  }

  if (show) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => { if (typeof initMap === 'function') initMap(); }, 300);
  } else {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
};

/**
 * Eventos y lógica del formulario
 */
function initCalculatorEvents() {
  const inputs = [
    'largo', 'ancho', 'alto', 'peso', 'cantidad', 
    'maniobra', 'fechaEnvio'
  ];
  
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', calcularCotizacion);
      el.addEventListener('change', calcularCotizacion);
    }
  });

  // Escuchadores para recalcular geocodificación automáticamente al escribir direcciones
  const addressInputs = [
    'calleOrigen', 'coloniaOrigen', 'municipioOrigen', 'cpOrigen',
    'calleDestino', 'coloniaDestino', 'municipioDestino', 'cpDestino'
  ];

  addressInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(procesarRutaDesdeInputs, 800); // Espera a que termine de escribir
      });
      el.addEventListener('change', procesarRutaDesdeInputs);
    }
  });

  // Forzar apertura del selector de fecha
  const fechaInput = document.getElementById('fechaEnvio');
  const labelFecha = document.getElementById('labelFechaEnvio');
  
  const abrirCalendario = () => {
    if (fechaInput && 'showPicker' in HTMLInputElement.prototype) {
      try {
        fechaInput.showPicker();
      } catch (err) {
        // Fallback nativo
      }
    }
  };

  if (fechaInput) fechaInput.addEventListener('click', abrirCalendario);
  if (labelFecha) labelFecha.addEventListener('click', abrirCalendario);

  // Botones GPS independientes para Origen y Destino
  const btnGpsOrigen = document.getElementById('btnGpsOrigen');
  if (btnGpsOrigen) {
    btnGpsOrigen.addEventListener('click', () => obtenerUbicacionGPS('origen'));
  }

  const btnGpsDestino = document.getElementById('btnGpsDestino');
  if (btnGpsDestino) {
    btnGpsDestino.addEventListener('click', () => obtenerUbicacionGPS('destino'));
  }

  // Botón WhatsApp
  const btnWa = document.getElementById('btnWhatsapp');
  if (btnWa) btnWa.addEventListener('click', enviarAWhatsApp);
}

/**
 * Configurar la fecha mínima (Hoy)
 */
function initFechaMinima() {
  const fechaInput = document.getElementById('fechaEnvio');
  if (fechaInput) {
    const hoy = new Date().toISOString().split('T')[0];
    fechaInput.min = hoy;
    if (!fechaInput.value) {
      fechaInput.value = hoy;
    }
  }
}

/**
 * Formatear fecha a texto en español
 */
function obtenerFechaTexto(fechaIso) {
  if (!fechaIso) return "A acordar con el cliente";
  
  const [year, month, day] = fechaIso.split('-');
  const fechaObj = new Date(year, month - 1, day);

  const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  let fechaTexto = fechaObj.toLocaleDateString('es-MX', opciones);

  return fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);
}

/**
 * Geocodifica direcciones de texto a Coordenadas GPS (OpenStreetMap / Nominatim)
 */
async function geocodificarDireccionTexto(calle, colonia, municipio, cp) {
  const query = encodeURIComponent(`${calle}, ${colonia}, ${cp ? cp + ',' : ''} ${municipio}, Nuevo León, México`);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch (error) {
    console.error("Error en geocodificación:", error);
  }
  return null;
}

/**
 * Consulta la ruta vial exacta por carretera (OSRM Routing Machine)
 */
async function calcularRutaVialExacta(cOrigen, cDestino) {
  // OSRM requiere [Longitud, Latitud]
  const url = `https://router.project-osrm.org/route/v1/driving/${cOrigen[1]},${cOrigen[0]};${cDestino[1]},${cDestino[0]}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.code === 'Ok' && data.routes.length > 0) {
      const ruta = data.routes[0];
      const distanciaKm = (ruta.distance / 1000).toFixed(1);
      return {
        distanciaKm: parseFloat(distanciaKm),
        geometry: ruta.geometry
      };
    }
  } catch (error) {
    console.error("Error calculando ruta vial:", error);
  }
  return null;
}

/**
 * Procesa y calcula la ruta automática leyendo los campos de dirección
 */
/**
 * Procesa y calcula la ruta automática leyendo los campos de dirección
 */
async function procesarRutaDesdeInputs() {
  const calleO = document.getElementById('calleOrigen')?.value.trim();
  const colO = document.getElementById('coloniaOrigen')?.value.trim();
  const munO = document.getElementById('municipioOrigen')?.value || 'Apodaca';
  const cpO = document.getElementById('cpOrigen')?.value.trim();

  const calleD = document.getElementById('calleDestino')?.value.trim();
  const colD = document.getElementById('coloniaDestino')?.value.trim();
  const munD = document.getElementById('municipioDestino')?.value || 'Monterrey';
  const cpD = document.getElementById('cpDestino')?.value.trim();

  const statusO = document.getElementById('statusGpsOrigen');

  if (calleO && colO && calleD && colD) {
    if (statusO) statusO.textContent = "⏳ Calculando ruta por carretera...";

    try {
      const geoOrigen = await geocodificarDireccionTexto(calleO, colO, munO, cpO);
      const geoDestino = await geocodificarDireccionTexto(calleD, colD, munD, cpD);

      if (geoOrigen) {
        coordsOrigen = geoOrigen;
        if (markerOrigen) markerOrigen.setLatLng(coordsOrigen);
      }
      if (geoDestino) {
        coordsDestino = geoDestino;
        if (markerDestino) markerDestino.setLatLng(coordsDestino);
      }

      await actualizarRutaYDistancia();

      if (statusO) statusO.textContent = "✅ Ruta y distancia calculadas correctamente.";
    } catch (err) {
      console.warn("Fallo en API remota, usando distancia estimada por mapa:", err);
      await actualizarRutaYDistancia();
      if (statusO) statusO.textContent = "📍 Distancia calculada con la ubicación del mapa.";
    }
  }
}

/**
 * Actualiza los pines, dibuja la línea de ruta en Leaflet y calcula el precio
 */
async function actualizarRutaYDistancia() {
  const inputDist = document.getElementById('distanciaKm');
  let kmFinales = 0;

  try {
    // Intenta consultar la ruta vial exacta por OSRM
    const resultadoRuta = await calcularRutaVialExacta(coordsOrigen, coordsDestino);

    if (resultadoRuta && resultadoRuta.distanciaKm > 0) {
      kmFinales = resultadoRuta.distanciaKm;

      // Dibujar línea de ruta en el mapa si está disponible
      if (map && typeof L !== 'undefined' && resultadoRuta.geometry) {
        if (routeLine) map.removeLayer(routeLine);
        routeLine = L.geoJSON(resultadoRuta.geometry, {
          style: { color: '#0052cc', weight: 4, opacity: 0.8 }
        }).addTo(map);

        map.fitBounds([coordsOrigen, coordsDestino], { padding: [40, 40] });
      }
    } else {
      throw new Error("No se obtuvo respuesta de la API de ruteo");
    }
  } catch (e) {
    // FALLBACK MATEMÁTICO RÁPIDO: Fórmula Haversine + 30% factor vial
    const R = 6371;
    const dLat = (coordsDestino[0] - coordsOrigen[0]) * Math.PI / 180;
    const dLng = (coordsDestino[1] - coordsOrigen[1]) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(coordsOrigen[0] * Math.PI / 180) * Math.cos(coordsDestino[0] * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    kmFinales = parseFloat((R * c * 1.3).toFixed(1)); // 1.3 estimado de curva vial
  }

  // Asignar el resultado y recalcular la cotización inmediatamente
  if (inputDist && kmFinales > 0) {
    inputDist.value = kmFinales;
  }
  
  calcularCotizacion();
}


/**
 * Lógica de cálculo de cotización
 */
function calcularCotizacion() {
  const pesoUnit = parseFloat(document.getElementById('peso')?.value) || 0;
  const cantidad = parseInt(document.getElementById('cantidad')?.value) || 0;
  const distanciaKm = parseFloat(document.getElementById('distanciaKm')?.value) || 0;
  const maniobra = document.getElementById('maniobra')?.value || 'sin';

  const calleO = document.getElementById('calleOrigen')?.value.trim();
  const colO = document.getElementById('coloniaOrigen')?.value.trim();
  const calleD = document.getElementById('calleDestino')?.value.trim();
  const colD = document.getElementById('coloniaDestino')?.value.trim();

  const pesoTotal = pesoUnit * cantidad;
  const gaugeFill = document.getElementById('gaugeFill');
  const gaugeText = document.getElementById('gaugeText');
  const alertNotice = document.getElementById('alertNotice');
  const precioTotalEl = document.getElementById('precioTotal');
  const desgloseText = document.getElementById('desgloseText');
  const btnWa = document.getElementById('btnWhatsapp');

  const porcentajeCarga = Math.min((pesoTotal / calcData.capacidadMaxKg) * 100, 100);
  if (gaugeFill) {
    gaugeFill.style.width = `${porcentajeCarga}%`;
    gaugeFill.style.backgroundColor = pesoTotal > calcData.capacidadMaxKg ? '#ef4444' : '#10b981';
  }
  if (gaugeText) {
    gaugeText.textContent = `${pesoTotal.toFixed(1)} kg / ${calcData.capacidadMaxKg} kg`;
  }

  if (pesoTotal > calcData.capacidadMaxKg) {
    if (alertNotice) {
      alertNotice.style.display = 'block';
      alertNotice.className = 'alert-banner error';
      alertNotice.innerHTML = `⚠️ El peso total (${pesoTotal.toFixed(1)} kg) supera los 650 kg por unidad Saveiro.`;
    }
  } else if (alertNotice) {
    alertNotice.style.display = 'none';
  }

  const direccionesCompletas = calleO && colO && calleD && colD;

  if (pesoTotal <= 0 || distanciaKm <= 0 || !direccionesCompletas) {
    if (precioTotalEl) precioTotalEl.innerHTML = `$0 <small>MXN</small>`;
    if (desgloseText) desgloseText.textContent = 'Completa las especificaciones de carga y direcciones de origen/destino.';
    if (btnWa) btnWa.disabled = true;
    return;
  }

  const unidadesNecesarias = Math.ceil(pesoTotal / calcData.capacidadMaxKg) || 1;
  let subtotal = (calcData.tarifaBase + (distanciaKm * calcData.costoPorKm)) * unidadesNecesarias;
  
  if (maniobra === 'con') {
    subtotal += (calcData.costoManiobra * unidadesNecesarias);
  }

  if (precioTotalEl) {
    precioTotalEl.innerHTML = `$${Math.round(subtotal).toLocaleString('es-MX')} <small>MXN</small>`;
  }

  if (desgloseText) {
    desgloseText.textContent = `${unidadesNecesarias} unidad(es) Saveiro • ${distanciaKm} km viales ${maniobra === 'con' ? '• Con maniobra' : ''}`;
  }

  if (btnWa) {
    btnWa.disabled = false;
  }
}

/**
 * Inicialización de Leaflet con marcadores Origen/Destino
 */
function initMap() {
  const mapContainer = document.getElementById('mapaFlete');
  if (!mapContainer || map !== null) return;

  if (typeof L === 'undefined') {
    console.warn('Leaflet no está cargado. Asegúrate de incluir Leaflet en index.html');
    return;
  }

  map = L.map('mapaFlete').setView([25.7333, -100.2480], 11);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  markerOrigen = L.marker(coordsOrigen, { draggable: true, icon: greenIcon }).addTo(map)
    .bindPopup('<b>📍 Origen (Remitente)</b>');

  markerDestino = L.marker(coordsDestino, { draggable: true, icon: redIcon }).addTo(map)
    .bindPopup('<b>🎯 Destino (Entrega)</b>');

  markerOrigen.on('dragend', function (e) {
    coordsOrigen = [e.target.getLatLng().lat, e.target.getLatLng().lng];
    actualizarRutaYDistancia();
  });

  markerDestino.on('dragend', function (e) {
    coordsDestino = [e.target.getLatLng().lat, e.target.getLatLng().lng];
    actualizarRutaYDistancia();
  });

  actualizarRutaYDistancia();
}

/**
 * Obtener ubicación por GPS según el punto seleccionado (Origen o Destino)
 */
function obtenerUbicacionGPS(target) {
  const statusEl = target === 'origen' 
    ? document.getElementById('statusGpsOrigen') 
    : document.getElementById('statusGpsDestino');

  if (!navigator.geolocation) {
    if (statusEl) statusEl.textContent = 'La geolocalización no es compatible con tu dispositivo.';
    return;
  }

  if (statusEl) statusEl.textContent = 'Obteniendo GPS...';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      if (target === 'origen') {
        coordsOrigen = [lat, lng];
        if (markerOrigen) markerOrigen.setLatLng(coordsOrigen);
        if (statusEl) statusEl.textContent = '📍 Origen fijado en tu ubicación actual.';
      } else {
        coordsDestino = [lat, lng];
        if (markerDestino) markerDestino.setLatLng(coordsDestino);
        if (statusEl) statusEl.textContent = '🎯 Destino fijado en tu ubicación actual.';
      }

      if (map) map.setView([lat, lng], 13);
      actualizarRutaYDistancia();
    },
    () => {
      if (statusEl) statusEl.textContent = 'No se pudo obtener el GPS. Puedes ingresar la dirección o mover los pines en el mapa.';
    }
  );
}

/**
 * Enviar mensaje con desglose formal a WhatsApp
 */
function enviarAWhatsApp() {
  const form = document.getElementById('calcForm');
  
  if (form && !form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const pesoUnit = document.getElementById('peso')?.value || 0;
  const cantidad = document.getElementById('cantidad')?.value || 0;
  const distanciaKm = document.getElementById('distanciaKm')?.value || 0;
  const maniobra = document.getElementById('maniobra')?.value === 'con' ? 'Con maniobra (Provac descarga)' : 'Sin maniobra (Cliente descarga)';
  
  const fechaRaw = document.getElementById('fechaEnvio')?.value;
  const fechaFormateada = obtenerFechaTexto(fechaRaw);

  const calleO = document.getElementById('calleOrigen')?.value.trim();
  const colO = document.getElementById('coloniaOrigen')?.value.trim();
  const munO = document.getElementById('municipioOrigen')?.value || 'Apodaca';
  const cpO = document.getElementById('cpOrigen')?.value.trim();

  const calleD = document.getElementById('calleDestino')?.value.trim();
  const colD = document.getElementById('coloniaDestino')?.value.trim();
  const munD = document.getElementById('municipioDestino')?.value || 'Monterrey';
  const cpD = document.getElementById('cpDestino')?.value.trim();

  const totalText = document.getElementById('precioTotal')?.innerText || '$0 MXN';
  const pesoTotal = (parseFloat(pesoUnit) * parseInt(cantidad)).toFixed(1);

  const mensaje = `¡Hola Provac Express! Solicitud de cotización de flete formal:%0A%0A` +
    `📅 *Fecha de Servicio:* ${fechaFormateada}%0A` +
    `📦 *Detalle de Carga:* ${cantidad} cajas (${pesoTotal} kg totales)%0A%0A` +
    `📍 *REMITENTE (Origen):*%0A` +
    `• Calle: ${calleO}%0A` +
    `• Colonia/Mpio: ${colO}, ${munO} ${cpO ? '(CP ' + cpO + ')' : ''}%0A%0A` +
    `🎯 *DESTINO (Entrega):*%0A` +
    `• Calle: ${calleD}%0A` +
    `• Colonia/Mpio: ${colD}, ${munD} ${cpD ? '(CP ' + cpD + ')' : ''}%0A%0A` +
    `🛣️ *Distancia Vial Calculada:* ${distanciaKm} km%0A` +
    `🚚 *Servicio Maniobra:* ${maniobra}%0A` +
    `💰 *COTIZACIÓN ESTIMADA:* ${totalText}%0A%0A` +
    `Quedo a la espera de la confirmación de la unidad.`;

  const telefono = '528117616817';
  window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
}

/**
 * Funciones del Catálogo
 */
function renderCatalog(items) {
  const grid = document.getElementById('catalogGrid');
  if (!grid) return;

  grid.innerHTML = items.map(item => `
    <div class="catalog-card" data-category="${item.categoria}">
      <span class="card-badge">${item.badge}</span>
      <h3>${item.nombre}</h3>
      <p>${item.desc}</p>
      <button class="btn-card-quote" onclick="toggleModal(true)">Cotizar Flete</button>
    </div>
  `).join('');
}

function setupCatalogFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const cat = btn.getAttribute('data-category');
      if (cat === 'todos') {
        renderCatalog(PRODUCTOS_CATALOGO);
      } else {
        const filtrados = PRODUCTOS_CATALOGO.filter(p => p.categoria === cat);
        renderCatalog(filtrados);
      }
    });
  });
}

function setupCatalogSearch() {
  const searchInput = document.getElementById('catalogSearch');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtrados = PRODUCTOS_CATALOGO.filter(p => 
      p.nombre.toLowerCase().includes(query) || 
      p.desc.toLowerCase().includes(query) ||
      p.badge.toLowerCase().includes(query)
    );
    renderCatalog(filtrados);
  });
}