// CONFIGURACIÓN OPERATIVA DE PROVAC EXPRESS
const CONFIG = {
  WHATSAPP_PHONE: "528117616817",
  SAVEIRO_MAX_KG: 650,
  BODEGA_COORDS: { lat: 25.6866, lon: -100.3161 }, // Monterrey / Apodaca
  TARIFA_BASE: 200,
  COSTO_PER_KM: 14,
  COSTO_MANIOBRA_UNIDAD: 3.5
};

// DATOS DEL CATÁLOGO INTERACTIVO DE PRODUCTOS
const CATALOG_ITEMS = [
  {
    id: 1,
    category: "seco",
    categoryName: "Alimentos Secos",
    title: "Granos y Semillas Empacadas",
    desc: "Arroz, frijol, lenteja y cereales en presentación comercial para retail.",
    icon: "🌾",
    unit: "Caja / Tarima"
  },
  {
    id: 2,
    category: "seco",
    categoryName: "Alimentos Secos",
    title: "Snacks y Galletas",
    desc: "Botanas, galletas y frituras en empaque primario y secundario.",
    icon: "🍪",
    unit: "Caja Máster"
  },
  {
    id: 3,
    category: "vacio",
    categoryName: "Sellados al Vacío",
    title: "Embutidos y Quesos Curados",
    desc: "Carnes frías y quesos en empaque de thermoformado o al vacío.",
    icon: "🧀",
    unit: "Caja Térmica"
  },
  {
    id: 4,
    category: "vacio",
    categoryName: "Sellados al Vacío",
    title: "Proteínas Procesadas",
    desc: "Cortes de carne congelada o empacada listos para anaquel.",
    icon: "🥩",
    unit: "Caja Sellada"
  },
  {
    id: 5,
    category: "latas",
    categoryName: "Bebidas en Lata",
    title: "Refrescos y Cervezas",
    desc: "Aluminio en charolas retráctiles o cartón para tiendas de conveniencia.",
    icon: "🥫",
    unit: "Charola / 24 Pz"
  },
  {
    id: 6,
    category: "latas",
    categoryName: "Bebidas en Lata",
    title: "Jugos y Envasados",
    desc: "Bebidas energizantes, tés y jugos en lata de aluminio.",
    icon: "🥤",
    unit: "Charola / 12 Pz"
  },
  {
    id: 7,
    category: "botellas",
    categoryName: "Bebidas PET",
    title: "Agua Purificada y Sabores",
    desc: "Embotellados en PET de 500ml a 5L para canal de detalle.",
    icon: "🍾",
    unit: "Paquete / 12-24 Pz"
  },
  {
    id: 8,
    category: "polvo",
    categoryName: "Productos en Polvo",
    title: "Harinas e Ingredientes",
    desc: "Harina de trigo, maíz, sazonadores y formulados alimenticios.",
    icon: "📦",
    unit: "Caja / Saco"
  },
  {
    id: 9,
    category: "polvo",
    categoryName: "Productos en Polvo",
    title: "Suplementos y Leches",
    desc: "Fórmulas lácteas y suplementos nutricionales en bote o sobre.",
    icon: "🥛",
    unit: "Caja Comercial"
  },
  {
    id: 10,
    category: "costales",
    categoryName: "Costales y Granel",
    title: "Costalería Industrial",
    desc: "Sacos de 25kg a 50kg de azúcar, sal, alimento balanceado y granos.",
    icon: "🌾",
    unit: "Saco 25kg-50kg"
  },
  {
    id: 11,
    category: "cosmeticos",
    categoryName: "Cosméticos",
    title: "Cuidado Personal y Belleza",
    desc: "Shampoos, cremas, jabones y cosméticos en empaque final.",
    icon: "🧴",
    unit: "Caja Distribución"
  },
  {
    id: 12,
    category: "medicamentos",
    categoryName: "Medicamentos (Sin Frío)",
    title: "Fármacos OTC y Material Curación",
    desc: "Tabletas, jarabes y gasas que requieren conservación a temperatura ambiente.",
    icon: "💊",
    unit: "Caja Controlada"
  }
];

// INICIALIZACIÓN DE LA APLICACIÓN
document.addEventListener("DOMContentLoaded", () => {
  // Configurar fecha mínima de envío
  const fechaInput = document.getElementById('fechaEnvio');
  if (fechaInput) {
    const hoy = new Date().toISOString().split('T')[0];
    fechaInput.min = hoy;
    fechaInput.value = hoy;
  }

  // Cargar tarjetas del catálogo
  renderCatalog(CATALOG_ITEMS);

  // Escuchadores del filtro de categorías
  const filterBtns = document.querySelectorAll("#catalogFilters .filter-btn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      filterAndRender();
    });
  });

  // Escuchador de búsqueda en el catálogo
  const searchInput = document.getElementById("catalogSearch");
  if (searchInput) {
    searchInput.addEventListener("input", filterAndRender);
  }

  // Escuchador para actualizar las recomendaciones de empaque al cambiar el producto seleccionado
  const tipoProductoSelect = document.getElementById('tipoProducto');
  if (tipoProductoSelect) {
    tipoProductoSelect.addEventListener('change', actualizarSugerenciaEmpaque);
  }

  // Escuchador para el botón GPS
  const btnGps = document.getElementById('btnGps') || document.querySelector('[data-action="gps"]');
  if (btnGps) {
    btnGps.addEventListener('click', (e) => {
      e.preventDefault();
      obtenerUbicacionGPS();
    });
  }

  // Escuchadores dinámicos del formulario
  document.querySelectorAll('#calcForm input, #calcForm select').forEach(element => {
    element.addEventListener('input', ejecutarCalculo);
  });

  // Cerrar modal haciendo clic en el fondo
  const backdrop = document.getElementById('modalBackdrop');
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target.id === 'modalBackdrop') toggleModal(false);
    });
  }
});

// CONTROL DE MODAL
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

// LÓGICA DE FILTRADO Y RENDER DEL CATÁLOGO
function filterAndRender() {
  const activeBtn = document.querySelector("#catalogFilters .filter-btn.active");
  const selectedCat = activeBtn ? activeBtn.getAttribute("data-category") : "todos";
  const query = (document.getElementById("catalogSearch").value || "").toLowerCase().trim();

  const filtered = CATALOG_ITEMS.filter(item => {
    const matchesCat = (selectedCat === "todos") || (item.category === selectedCat);
    const matchesQuery = item.title.toLowerCase().includes(query) ||
                         item.desc.toLowerCase().includes(query) ||
                         item.categoryName.toLowerCase().includes(query);
    return matchesCat && matchesQuery;
  });

  renderCatalog(filtered);
}

function renderCatalog(items) {
  const grid = document.getElementById("catalogGrid");
  if (!grid) return;

  if (items.length === 0) {
    grid.innerHTML = `<div class="no-results">No se encontraron productos o categorías con el criterio especificado.</div>`;
    return;
  }

  grid.innerHTML = items.map(item => `
    <div class="catalog-card">
      <div class="catalog-card-icon">${item.icon}</div>
      <span class="catalog-card-tag">${item.categoryName}</span>
      <h3>${item.title}</h3>
      <p>${item.desc}</p>
      <div class="catalog-card-footer">
        <span class="spec-chip">${item.unit}</span>
        <button class="btn-card-quote" onclick="cotizarProductoDirecto('${item.title}')">Cotizar Flete</button>
      </div>
    </div>
  `).join('');
}

function cotizarProductoDirecto(nombreProducto) {
  toggleModal(true);
  
  // Seleccionar automáticamente el producto si existe en el select
  const selectProducto = document.getElementById('tipoProducto');
  if (selectProducto) {
    for (let option of selectProducto.options) {
      if (option.text.toLowerCase().includes(nombreProducto.toLowerCase()) || 
          nombreProducto.toLowerCase().includes(option.text.toLowerCase())) {
        selectProducto.value = option.value;
        break;
      }
    }
    actualizarSugerenciaEmpaque();
  }

  const calleInput = document.getElementById('calle');
  if (calleInput) calleInput.focus();
}

// LÓGICA DE RECOMENDACIÓN DE EMPAQUE Y MANEJO
function actualizarSugerenciaEmpaque() {
  const tipoProducto = document.getElementById('tipoProducto')?.value;
  const empaqueText = document.getElementById('empaqueText');
  const empaqueBox = document.getElementById('empaqueBox');

  if (!tipoProducto || !empaqueText) return;

  let recomendacion = "";

  switch (tipoProducto) {
    case "seco":
      recomendacion = "📦 <strong>Recomendación:</strong> Embalar en cajas de cartón corrugado estandarizadas y selladas con cinta reforzada. Utilizar tarimas estibadas adecuadamente.";
      break;
    case "vacio":
      recomendacion = "🧊 <strong>Recomendación:</strong> Requiere cajas térmicas aislantes o empaque termoformado con refrigerantes (hielos gélidos) para mantener la cadena de frío corta.";
      break;
    case "latas":
      recomendacion = "🥫 <strong>Recomendación:</strong> Empacar en charolas con película termoencogible (plastic shrink) o cajas máster para evitar abolladuras en el transporte.";
      break;
    case "botellas":
      recomendacion = "🍾 <strong>Recomendación:</strong> Utilizar empaques plásticos retráctiles con separadores o cajas con divisiones para prevenir colisiones e impactos.";
      break;
    case "polvo":
      recomendacion = "🌾 <strong>Recomendación:</strong> Usar sacos herméticos o cajas liner para evitar filtraciones y proteger contra la humedad durante la maniobra.";
      break;
    case "cosmeticos":
      recomendacion = "🧴 <strong>Recomendación:</strong> Proteger recipientes con plástico de burbuja dentro de cajas máster rígidas para evitar derrames o roturas.";
      break;
    case "medicamentos":
      recomendacion = "💊 <strong>Recomendación:</strong> Manejar en cajas de seguridad o contenedores sellados que protejan contra la luz directa y la humedad constante.";
      break;
    default:
      recomendacion = "ℹ️ Selecciona un tipo de producto para ver las recomendaciones de empaque sugeridas.";
  }

  empaqueText.innerHTML = recomendacion;
  if (empaqueBox) empaqueBox.style.display = 'block';
}

// GEOLOCALIZACIÓN GPS Y DISTANCIA
function obtenerUbicacionGPS() {
  const statusTxt = document.getElementById('gpsStatusText');

  if (!navigator.geolocation) {
    if (statusTxt) statusTxt.innerText = "Navegador no soporta geolocalización GPS.";
    return;
  }

  if (statusTxt) statusTxt.innerText = "Obteniendo coordenadas GPS y dirección...";

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      // 1. Cálculo de distancia a la bodega
      const distDirecta = haversineDistance(
        lat, lon,
        CONFIG.BODEGA_COORDS.lat, CONFIG.BODEGA_COORDS.lon
      );
      // Ajuste de red vial (+30%)
      const distVial = Math.round((distDirecta * 1.3) * 10) / 10;

      const distInput = document.getElementById('distanciaKm');
      if (distInput) distInput.value = distVial;

      // 2. Geocodificación inversa para autocompletar calle y colonia
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await response.json();

        if (data && data.address) {
          const calleInput = document.getElementById('calle');
          const coloniaInput = document.getElementById('colonia');

          const nombreCalle = data.address.road || data.address.pedestrian || data.address.suburb || "Ubicación GPS";
          const nombreColonia = data.address.neighbourhood || data.address.suburb || data.address.city_district || data.address.city || "Monterrey";

          if (calleInput) calleInput.value = nombreCalle;
          if (coloniaInput) coloniaInput.value = nombreColonia;
        }
      } catch (err) {
        console.error("No se pudo autocompletar la dirección exacta por red:", err);
      }

      if (statusTxt) statusTxt.innerText = `Distancia estimada: ~${distVial} km desde bodega`;
      ejecutarCalculo();
    },
    (error) => {
      if (statusTxt) statusTxt.innerText = "Permiso denegado o GPS no disponible.";
      console.warn("Error GPS:", error.message);
    },
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

// ALGORITMO DE CÁLCULO DE COTIZACIÓN
function ejecutarCalculo() {
  const pesoUnitario = parseFloat(document.getElementById('peso')?.value) || 0;
  const cantidad = parseInt(document.getElementById('cantidad')?.value) || 0;
  const distanciaKm = parseFloat(document.getElementById('distanciaKm')?.value) || 0;
  const requiereManiobra = document.getElementById('maniobra')?.value === 'con';

  const alertNotice = document.getElementById('alertNotice');
  const precioTotalEl = document.getElementById('precioTotal');
  const desgloseText = document.getElementById('desgloseText');
  const btnWhatsapp = document.getElementById('btnWhatsapp');

  if (alertNotice) alertNotice.style.display = 'none';
  if (btnWhatsapp) btnWhatsapp.disabled = true;

  if (cantidad === 0 || pesoUnitario === 0) {
    actualizarGauge(0);
    if (precioTotalEl) precioTotalEl.innerHTML = "$0 <small>MXN</small>";
    return;
  }

  const pesoTotal = pesoUnitario * cantidad;
  actualizarGauge(pesoTotal);

  if (pesoTotal > CONFIG.SAVEIRO_MAX_KG) {
    if (alertNotice) {
      alertNotice.innerText = `El peso total (${pesoTotal.toFixed(1)} kg) supera el límite de 1 Saveiro (650 kg).`;
      alertNotice.style.display = 'block';
    }
    if (precioTotalEl) precioTotalEl.innerText = "Exceso de Carga";
    if (desgloseText) desgloseText.innerText = "Ajusta la cantidad o solicita unidad de mayor tonelaje";
    return;
  }

  if (distanciaKm <= 0) {
    if (precioTotalEl) precioTotalEl.innerHTML = "$0 <small>MXN</small>";
    if (desgloseText) desgloseText.innerText = "Ingresa la distancia en km o activa GPS";
    return;
  }

  let factorSobrecarga = pesoTotal > 400 ? 1.15 : 1.0;
  let costoDistancia = distanciaKm * CONFIG.COSTO_PER_KM;
  let costoManiobra = requiereManiobra ? (cantidad * CONFIG.COSTO_MANIOBRA_UNIDAD) : 0;

  let tarifaTotal = Math.round(((CONFIG.TARIFA_BASE + costoDistancia) * factorSobrecarga) + costoManiobra);

  if (precioTotalEl) precioTotalEl.innerHTML = `$${tarifaTotal.toLocaleString()} <small>MXN</small>`;
  if (desgloseText) desgloseText.innerText = `${distanciaKm} km | ${cantidad} cajas (${pesoTotal} kg) ${requiereManiobra ? '| C/ Maniobra' : ''}`;
  if (btnWhatsapp) btnWhatsapp.disabled = false;

  if (btnWhatsapp) {
    btnWhatsapp.onclick = () => {
      const calle = document.getElementById('calle')?.value || 'No especificada';
      const colonia = document.getElementById('colonia')?.value || 'Monterrey';
      const fecha = document.getElementById('fechaEnvio')?.value;
      const selectProducto = document.getElementById('tipoProducto');
      const productoNombre = selectProducto ? selectProducto.options[selectProducto.selectedIndex]?.text : 'General';

      const mensaje = `Hola Provac Express, solicito flete:%0A- *Producto:* ${productoNombre}%0A- *Carga:* ${cantidad} cajas (${pesoTotal} kg)%0A- *Fecha:* ${fecha}%0A- *Destino:* ${calle}, ${colonia}%0A- *Distancia:* ${distanciaKm} km%0A- *Cotización:* $${tarifaTotal} MXN`;
      window.open(`https://wa.me/${CONFIG.WHATSAPP_PHONE}?text=${mensaje}`, '_blank');
    };
  }
}

function actualizarGauge(pesoTotal) {
  const gaugeFill = document.getElementById('gaugeFill');
  const gaugeText = document.getElementById('gaugeText');
  const pct = Math.min((pesoTotal / CONFIG.SAVEIRO_MAX_KG) * 100, 100);

  if (gaugeFill && gaugeText) {
    gaugeFill.style.width = `${pct}%`;
    gaugeText.innerText = `${pesoTotal.toFixed(1)} kg / 650 kg`;
    gaugeFill.style.backgroundColor = pesoTotal > CONFIG.SAVEIRO_MAX_KG ? 'var(--danger)' : 'var(--success)';
  }
}