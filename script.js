/**
 * Provac Express - Control de Interfaz, Modal Dinámico y Calculadora
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

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  renderCatalog(PRODUCTOS_CATALOGO);
  setupCatalogFilters();
  setupCatalogSearch();
  preloadCalculatorModal();
});

/**
 * Carga automáticamente calculadora.html si no está presente en el DOM
 */.
async function preloadCalculatorModal() {
  if (!document.getElementById('modalBackdrop')) {
    try {
      const response = await fetch('calculadora.html');
      if (response.ok) {
        const html = await response.text();
        document.body.insertAdjacentHTML('beforeend', html);
        initCalculatorEvents();
      } else {
        console.warn('No se pudo cargar calculadora.html automáticamente. Verifica que el archivo exista en la raíz.');
      }
    } catch (err) {
      console.error('Error al cargar la calculadora:', err);
    }
  } else {
    initCalculatorEvents();
  }
}

/**
 * Función global para abrir/cerrar el modal
 */
window.toggleModal = function(show) {
  const modal = document.getElementById('modalBackdrop');
  if (!modal) {
    // Si aún no se ha inyectado, reintentar cargar
    preloadCalculatorModal().then(() => {
      const m = document.getElementById('modalBackdrop');
      if (m) {
        if (show) m.classList.add('active');
        else m.classList.remove('active');
      }
    });
    return;
  }

  if (show) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Evita scroll de fondo
  } else {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
};

/**
 * Eventos y lógica de cálculo dentro del formulario
 */
function initCalculatorEvents() {
  const inputs = ['largo', 'ancho', 'alto', 'peso', 'cantidad', 'distanciaKm', 'maniobra', 'fechaEnvio', 'calle', 'colonia'];
  
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', calcularCotizacion);
      el.addEventListener('change', calcularCotizacion);
    }
  });

  // Botón GPS
  const btnGps = document.getElementById('btnGps');
  if (btnGps) {
    btnGps.addEventListener('click', obtenerUbicacionGPS);
  }

  // Botón WhatsApp
  const btnWa = document.getElementById('btnWhatsapp');
  if (btnWa) {
    btnWa.addEventListener('click', enviarAWhatsApp);
  }
}

/**
 * Lógica matemática de la calculadora de fletes
 */
function calcularCotizacion() {
  const largo = parseFloat(document.getElementById('largo')?.value) || 0;
  const ancho = parseFloat(document.getElementById('ancho')?.value) || 0;
  const alto = parseFloat(document.getElementById('alto')?.value) || 0;
  const pesoUnit = parseFloat(document.getElementById('peso')?.value) || 0;
  const cantidad = parseInt(document.getElementById('cantidad')?.value) || 0;
  const distanciaKm = parseFloat(document.getElementById('distanciaKm')?.value) || 0;
  const maniobra = document.getElementById('maniobra')?.value || 'sin';

  const pesoTotal = pesoUnit * cantidad;
  const gaugeFill = document.getElementById('gaugeFill');
  const gaugeText = document.getElementById('gaugeText');
  const alertNotice = document.getElementById('alertNotice');
  const precioTotalEl = document.getElementById('precioTotal');
  const desgloseText = document.getElementById('desgloseText');
  const btnWa = document.getElementById('btnWhatsapp');

  // Actualizar indicador de carga
  const porcentajeCarga = Math.min((pesoTotal / calcData.capacidadMaxKg) * 100, 100);
  if (gaugeFill) {
    gaugeFill.style.width = `${porcentajeCarga}%`;
    gaugeFill.style.backgroundColor = pesoTotal > calcData.capacidadMaxKg ? '#ef4444' : '#10b981';
  }
  if (gaugeText) {
    gaugeText.textContent = `${pesoTotal.toFixed(1)} kg / ${calcData.capacidadMaxKg} kg`;
  }

  // Alerta de exceso de capacidad
  if (pesoTotal > calcData.capacidadMaxKg) {
    if (alertNotice) {
      alertNotice.style.display = 'block';
      alertNotice.className = 'alert-banner error';
      alertNotice.innerHTML = `⚠️ El peso total (${pesoTotal.toFixed(1)} kg) supera los 650 kg por unidad Saveiro. Se requerirán unidades adicionales.`;
    }
  } else if (alertNotice) {
    alertNotice.style.display = 'none';
  }

  // Si no hay datos suficientes de distancia o peso, restablecer
  if (pesoTotal <= 0 || distanciaKm <= 0) {
    if (precioTotalEl) precioTotalEl.innerHTML = `$0 <small>MXN</small>`;
    if (desgloseText) desgloseText.textContent = 'Ingresa dimensiones, peso y distancia en km.';
    if (btnWa) btnWa.disabled = true;
    return;
  }

  // Cálculo del precio
  const unidadesNecesarias = Math.ceil(pesoTotal / calcData.capacidadMaxKg) || 1;
  let subtotal = (calcData.tarifaBase + (distanciaKm * calcData.costoPorKm)) * unidadesNecesarias;
  
  if (maniobra === 'con') {
    subtotal += (calcData.costoManiobra * unidadesNecesarias);
  }

  if (precioTotalEl) {
    precioTotalEl.innerHTML = `$${Math.round(subtotal).toLocaleString('es-MX')} <small>MXN</small>`;
  }

  if (desgloseText) {
    desgloseText.textContent = `${unidadesNecesarias} unidad(es) Saveiro • ${distanciaKm} km ${maniobra === 'con' ? '• Con maniobra' : ''}`;
  }

  if (btnWa) {
    btnWa.disabled = false;
  }
}

/**
 * Geolocalización del cliente para calcular distancia aproximada
 */
function obtenerUbicacionGPS() {
  const status = document.getElementById('gpsStatusText');
  const inputDist = document.getElementById('distanciaKm');

  if (!navigator.geolocation) {
    if (status) status.textContent = 'La geolocalización no es compatible con tu navegador.';
    return;
  }

  if (status) status.textContent = 'Obteniendo ubicación actual...';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      // Coordenadas fijas de la base/bodega en Apodaca/Monterrey
      const baseLat = 25.7800;
      const baseLng = -100.1800;

      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      // Cálculo de distancia mediante fórmula Haversine
      const R = 6371; 
      const dLat = (userLat - baseLat) * Math.PI / 180;
      const dLng = (userLng - baseLng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(baseLat * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distancia = R * c * 1.3; // Factor 1.3 para aproximación por vialidades

      if (inputDist) {
        inputDist.value = distancia.toFixed(1);
        calcularCotizacion();
      }
      if (status) status.textContent = `📍 Ubicación detectada (~${distancia.toFixed(1)} km a bodega).`;
    },
    () => {
      if (status) status.textContent = 'No se pudo obtener la ubicación. Ingresa los km manualmente.';
    }
  );
}

/**
 * Redirección con mensaje estructurado hacia WhatsApp
 */
function enviarAWhatsApp() {
  const pesoUnit = document.getElementById('peso')?.value || 0;
  const cantidad = document.getElementById('cantidad')?.value || 0;
  const distanciaKm = document.getElementById('distanciaKm')?.value || 0;
  const maniobra = document.getElementById('maniobra')?.value === 'con' ? 'Con maniobra' : 'Sin maniobra';
  const fecha = document.getElementById('fechaEnvio')?.value || 'A acordar';
  const calle = document.getElementById('calle')?.value || 'No especificada';
  const colonia = document.getElementById('colonia')?.value || 'No especificada';
  const totalText = document.getElementById('precioTotal')?.innerText || '$0 MXN';

  const pesoTotal = (parseFloat(pesoUnit) * parseInt(cantidad)).toFixed(1);

  const mensaje = `¡Hola Provac Express! Quisiera solicitar una cotización de flete:%0A%0A` +
    `📦 *Carga:* ${cantidad} cajas (${pesoTotal} kg totales)%0A` +
    `📍 *Destino:* ${calle}, ${colonia}%0A` +
    `🗺️ *Distancia estimada:* ${distanciaKm} km%0A` +
    `🚚 *Servicio:* ${maniobra}%0A` +
    `📅 *Fecha de Entrega:* ${fecha}%0A` +
    `💰 *Estimación:* ${totalText}%0A%0A` +
    `¿Me podrían confirmar disponibilidad de unidades?`;

  const telefono = '528117616817'; // Número Provac Express
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