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
  const calleInput = document.getElementById('calle');
  if (calleInput) calleInput.focus();
}

// GEOLOCALIZACIÓN GPS Y DISTANCIA
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
      // Ajuste de red vial (+30%)
      const distVial = Math.round((distDirecta * 1.3) * 10) / 10;

      document.getElementById('distanciaKm').value = distVial;
      statusTxt.innerText = `Distancia estimada: ~${distVial} km desde bodega`;
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

// ALGORITMO DE CÁLCULO DE COTIZACIÓN
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
    desgloseText.innerText = "Ajusta la cantidad o solicita unidad de mayor tonelaje";
    return;
  }

  if (distanciaKm <= 0) {
    precioTotalEl.innerHTML = "$0 <small>MXN</small>";
    desgloseText.innerText = "Ingresa la distancia en km o activa GPS";
    return;
  }

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

  if (gaugeFill && gaugeText) {
    gaugeFill.style.width = `${pct}%`;
    gaugeText.innerText = `${pesoTotal.toFixed(1)} kg / 650 kg`;
    gaugeFill.style.backgroundColor = pesoTotal > CONFIG.SAVEIRO_MAX_KG ? 'var(--danger)' : 'var(--success)';
  }
}
