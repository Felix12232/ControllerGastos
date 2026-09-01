// ==================== CONFIGURACIÓN ====================
// ⚠️ ACTUALIZA ESTA URL CON LA DE TU WEB APP
const API_URL = "https://script.google.com/macros/s/AKfycbycXBIUEOk6xQZgnEzQvntTiT056zLyZau1BUDCfocKvf3W8vgaMeYVaiZhv5bZbwNQzA/exec";

// ==================== FUNCIONES AUXILIARES ====================
async function apiGet(params) {
  try {
    const url = new URL(API_URL);
    Object.entries(params).forEach(([key, value]) => {
      // 🔥 Asegurar que los números se envíen correctamente
      url.searchParams.append(key, value);
    });

    console.log('🌐 GET URL:', url.toString());

    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📥 Respuesta GET:', data);
    return data;
  } catch (error) {
    console.error('❌ Error en apiGet:', error);
    throw error;
  }
}

// apiPost ahora usa GET porque Google Apps Script no soporta POST con CORS fácilmente
async function apiPost(params) {
  try {
    const url = new URL(API_URL);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    console.log('🌐 POST URL:', url.toString());

    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📥 Respuesta POST:', data);
    return data;
  } catch (error) {
    console.error('❌ Error en apiPost:', error);
    throw error;
  }
}

// ==================== INICIALIZACIÓN ====================
function init() {
  console.log('🚀 Iniciando aplicación...');
  cargarCategorias();
  cargarFechasDefault();
  cargarResumen();

  // Recargar resumen cada 30 segundos
  setInterval(cargarResumen, 30000);
}

function cargarFechasDefault() {
  const hoy = new Date();
  const fechaStr = hoy.toISOString().split('T')[0];
  document.getElementById('fecha').value = fechaStr;

  const mesActual = hoy.getMonth() + 1;
  document.getElementById('mesResumen').value = mesActual;
  document.getElementById('mesIngreso').value = mesActual;

  const añoActual = hoy.getFullYear();
  document.getElementById('anioResumen').value = añoActual;
  document.getElementById('anioIngreso').value = añoActual;
}

// ==================== TABS ====================
function mostrarTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));

  document.getElementById(tabId).classList.add('active');

  const tabs = document.querySelectorAll('.tab');
  const tabMap = {
    'nuevo-gasto': 0,
    'ingresos': 1,
    'resumen': 2
  };
  if (tabMap[tabId] !== undefined) {
    tabs[tabMap[tabId]].classList.add('active');
  }

  if (tabId === 'resumen') {
    cargarResumen();
  }
}

// ==================== CATEGORÍAS ====================
async function cargarCategorias() {
  try {
    console.log('🔄 Cargando categorías...');

    const response = await apiGet({ action: 'obtenerCategorias' });

    console.log('📦 Respuesta completa:', response);

    if (response.success && response.data) {
      const { categorias, subcategorias } = response.data;

      console.log('✅ Categorías cargadas:', categorias);
      console.log('📂 Subcategorías:', subcategorias);

      const select = document.getElementById('categoria');

      // Guardar subcategorías en dataset
      select.dataset.subcategorias = JSON.stringify(subcategorias || {});

      // Limpiar y llenar select
      select.innerHTML = '<option value="">Seleccionar categoría</option>';

      if (categorias && categorias.length > 0) {
        categorias.forEach(cat => {
          const option = document.createElement('option');
          option.value = cat;
          option.textContent = cat;
          select.appendChild(option);
        });
        mostrarMensaje('✅ Categorías cargadas correctamente (' + categorias.length + ')', 'success');
      } else {
        mostrarMensaje('⚠️ No hay categorías configuradas', 'error');
        agregarCategoriasRespaldo(select);
      }

      // Actualizar subcategorías
      if (select.value) {
        actualizarSubcategorias();
      }

    } else {
      console.error('❌ Error en respuesta:', response);
      mostrarMensaje('⚠️ ' + (response.message || 'Error al cargar categorías'), 'error');
      agregarCategoriasRespaldo(document.getElementById('categoria'));
    }

  } catch (error) {
    console.error('❌ Error cargando categorías:', error);
    mostrarMensaje('❌ Error al cargar categorías: ' + error.message, 'error');
    agregarCategoriasRespaldo(document.getElementById('categoria'));
  }
}

function agregarCategoriasRespaldo(select) {
  const categoriasDefault = [
    "Alimentación", "Vivienda", "Transporte", "Servicios",
    "Salud", "Educación", "Deudas", "Entretenimiento",
    "Ropa", "Compras", "Viajes", "Mascotas",
    "Familia", "Finanzas", "Impuestos", "Regalos", "Otros"
  ];

  select.innerHTML = '<option value="">Seleccionar categoría</option>';
  categoriasDefault.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });

  mostrarMensaje('⚠️ Usando categorías por defecto', 'error');
}

function actualizarSubcategorias() {
  const selectCat = document.getElementById('categoria');
  const selectSub = document.getElementById('subcategoria');
  const categoria = selectCat.value;

  if (!categoria) {
    selectSub.innerHTML = '<option value="">General</option>';
    return;
  }

  try {
    const subcategorias = JSON.parse(selectCat.dataset.subcategorias || '{}');
    const lista = subcategorias[categoria] || [];

    selectSub.innerHTML = '<option value="">General</option>';

    lista.forEach(sub => {
      const option = document.createElement('option');
      option.value = sub;
      option.textContent = sub;
      selectSub.appendChild(option);
    });

    if (lista.length > 0) {
      console.log('✅ Subcategorías actualizadas:', lista);
    }

  } catch (e) {
    selectSub.innerHTML = '<option value="">General</option>';
    console.error('Error actualizando subcategorías:', e);
  }
}

// ==================== REGISTRAR GASTO ====================
async function registrarGasto(event) {
  event.preventDefault();

  const fecha = document.getElementById('fecha').value;
  const categoria = document.getElementById('categoria').value;
  const subcategoria = document.getElementById('subcategoria').value;
  const monto = document.getElementById('monto').value;
  const descripcion = document.getElementById('descripcion').value;

  // Validaciones
  if (!categoria) {
    mostrarMensaje('⚠️ Por favor selecciona una categoría', 'error');
    return;
  }

  if (!fecha) {
    mostrarMensaje('⚠️ Por favor selecciona una fecha', 'error');
    return;
  }

  if (!monto || parseFloat(monto) <= 0) {
    mostrarMensaje('⚠️ Por favor ingresa un monto válido', 'error');
    return;
  }

  const btn = event.target.querySelector('.btn');
  btn.textContent = '⏳ Guardando...';
  btn.disabled = true;

  try {
    console.log('📤 Enviando gasto:', { fecha, categoria, subcategoria, monto, descripcion });

    const response = await apiPost({
      action: 'guardarGasto',
      fecha: fecha,
      categoria: categoria,
      subcategoria: subcategoria || '',
      monto: parseFloat(monto),
      descripcion: descripcion || ''
    });

    console.log('📥 Respuesta guardar gasto:', response);

    if (response.success) {
      mostrarMensaje(response.message, 'success');
      document.getElementById('formGasto').reset();
      cargarFechasDefault();
      cargarResumen();
    } else {
      mostrarMensaje('⚠️ ' + response.message, 'error');
    }
  } catch (error) {
    mostrarMensaje('❌ Error al guardar: ' + error.message, 'error');
    console.error('Error detallado:', error);
  } finally {
    btn.textContent = '💾 Guardar Gasto';
    btn.disabled = false;
  }
}

// ==================== REGISTRAR INGRESO ====================
async function registrarIngreso(event) {
  event.preventDefault();

  const mes = parseInt(document.getElementById('mesIngreso').value);
  const año = parseInt(document.getElementById('anioIngreso').value);
  const monto = document.getElementById('montoIngreso').value;

  if (!monto || parseFloat(monto) <= 0) {
    mostrarMensaje('⚠️ Por favor ingresa un monto válido', 'error');
    return;
  }

  const btn = event.target.querySelector('.btn');
  btn.textContent = '⏳ Guardando...';
  btn.disabled = true;

  try {
    console.log('📤 Enviando ingreso:', { mes, año, monto });

    const response = await apiPost({
      action: 'guardarIngreso',
      mes: mes,    // 🔥 Enviar como número
      anio: año,   // 🔥 Enviar como número
      monto: parseFloat(monto)
    });

    console.log('📥 Respuesta guardar ingreso:', response);

    if (response.success) {
      mostrarMensaje(response.message, 'success');
      document.getElementById('montoIngreso').value = '';
      cargarResumen();
    } else {
      mostrarMensaje('⚠️ ' + response.message, 'error');
    }
  } catch (error) {
    mostrarMensaje('❌ Error al guardar ingreso: ' + error.message, 'error');
    console.error('Error detallado:', error);
  } finally {
    btn.textContent = '💵 Guardar Ingreso';
    btn.disabled = false;
  }
}

// ==================== CARGAR RESUMEN ====================
async function cargarResumen() {
  const mes = parseInt(document.getElementById('mesResumen').value);
  const año = parseInt(document.getElementById('anioResumen').value);

  // 🔥 Validar que sean números válidos
  if (isNaN(mes) || isNaN(año)) {
    mostrarMensaje('⚠️ Selecciona un mes y año válidos', 'error');
    return;
  }

  const contenedor = document.getElementById('resumen-contenido');
  contenedor.innerHTML = '<div class="loading">🔄 Cargando datos...</div>';

  try {
    console.log('📤 Solicitando resumen:', { mes, año });

    const response = await apiGet({
      action: 'obtenerDatosMes',
      mes: mes,    // 🔥 Enviar como número
      anio: año    // 🔥 Enviar como número
    });

    console.log('📥 Respuesta resumen:', response);

    if (response.success && response.data) {
      mostrarResumen(response.data, mes, año);
    } else {
      contenedor.innerHTML = `<div class="loading">⚠️ ${response.message || 'Error al cargar datos'}</div>`;
    }
  } catch (error) {
    contenedor.innerHTML = `<div class="loading">❌ Error al cargar datos: ${error.message}</div>`;
    console.error('Error detallado:', error);
  }
}

function mostrarResumen(data, mes, año) {
  const contenedor = document.getElementById('resumen-contenido');
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const gastos = data.gastos || [];
  const ingreso = data.ingreso || 0;
  const totalGastos = data.totalGastos || 0;
  const balance = data.balance || 0;
  const resumenCategorias = data.resumenCategorias || {};

  let html = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="label">💰 Ingresos del mes</div>
        <div class="value positive">$${ingreso.toFixed(2)}</div>
      </div>
      <div class="stat-card">
        <div class="label">💸 Gastos totales</div>
        <div class="value negative">$${totalGastos.toFixed(2)}</div>
      </div>
      <div class="stat-card">
        <div class="label">📊 Balance</div>
        <div class="value ${balance >= 0 ? 'positive' : 'negative'}">$${balance.toFixed(2)}</div>
      </div>
      <div class="stat-card">
        <div class="label">📋 Número de gastos</div>
        <div class="value">${gastos.length}</div>
      </div>
    </div>
  `;

  // Gráfico de categorías
  if (Object.keys(resumenCategorias).length > 0) {
    const maxGasto = Math.max(...Object.values(resumenCategorias));

    html += `<div class="categoria-chart"><h3>📊 Distribución por Categoría</h3>`;

    // Ordenar categorías por monto (de mayor a menor)
    const categoriasOrdenadas = Object.entries(resumenCategorias)
      .sort((a, b) => b[1] - a[1]);

    for (const [categoria, monto] of categoriasOrdenadas) {
      const porcentaje = maxGasto > 0 ? (monto / maxGasto * 100) : 0;
      html += `
        <div class="categoria-bar">
          <div class="label">
            <span>${categoria}</span>
            <span>$${monto.toFixed(2)}</span>
          </div>
          <div class="bar-bg">
            <div class="bar-fill" style="width: ${porcentaje}%"></div>
          </div>
        </div>
      `;
    }

    html += `</div>`;
  }

  // Lista de gastos
  if (gastos.length > 0) {
    html += `<div class="gastos-list"><h3>📋 Lista de Gastos - ${meses[mes-1]} ${año}</h3>`;

    // Ordenar gastos por fecha (más reciente primero)
    gastos.sort((a, b) => {
      const fechaA = new Date(a.fecha.split('/').reverse().join('/'));
      const fechaB = new Date(b.fecha.split('/').reverse().join('/'));
      return fechaB - fechaA;
    });

    gastos.forEach((gasto) => {
      const fecha = new Date(gasto.fecha.split('/').reverse().join('/'));
      const fechaStr = fecha.toLocaleDateString('es-ES');

      html += `
        <div class="gasto-item" data-id="${gasto.id}">
          <div class="gasto-info">
            <span class="categoria">${gasto.categoria}</span>
            <span class="subcategoria">${gasto.subcategoria}</span>
            <span class="descripcion">${gasto.descripcion}</span>
          </div>
          <span class="gasto-fecha">${fechaStr}</span>
          <span class="gasto-monto">$${parseFloat(gasto.monto).toFixed(2)}</span>
          <div class="gasto-acciones">
            <button class="btn-editar" onclick="editarGasto('${gasto.id}')">✏️</button>
            <button class="btn-eliminar" onclick="eliminarGasto('${gasto.id}')">🗑️</button>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    window.gastosData = gastos;
  } else {
    html += `<p style="text-align:center;color:#6c757d;padding:20px;">📭 No hay gastos registrados para este mes</p>`;
  }

  contenedor.innerHTML = html;
}

// ==================== EDITAR GASTO ====================
async function editarGasto(id) {
  try {
    const gasto = window.gastosData.find(g => g.id === id);
    if (!gasto) {
      mostrarMensaje('⚠️ Gasto no encontrado', 'error');
      return;
    }

    // Convertir fecha de DD/MM/YYYY a YYYY-MM-DD para el input date
    const partesFecha = gasto.fecha.split('/');
    const fechaFormateada = `${partesFecha[2]}-${partesFecha[1]}-${partesFecha[0]}`;

    document.getElementById('fecha').value = fechaFormateada;
    document.getElementById('categoria').value = gasto.categoria;
    document.getElementById('subcategoria').value = gasto.subcategoria;
    document.getElementById('monto').value = gasto.monto;
    document.getElementById('descripcion').value = gasto.descripcion;

    actualizarSubcategorias();

    mostrarTab('nuevo-gasto');

    const btn = document.querySelector('#formGasto .btn');
    btn.textContent = '✏️ Actualizar Gasto';
    btn.dataset.editId = id;

    const form = document.getElementById('formGasto');
    form.onsubmit = function(event) {
      event.preventDefault();
      actualizarGasto(event);
    };

    mostrarMensaje('✏️ Editando gasto...', 'success');
  } catch (error) {
    mostrarMensaje('❌ Error al editar: ' + error.message, 'error');
    console.error('Error detallado:', error);
  }
}

async function actualizarGasto(event) {
  const btn = event.target.querySelector('.btn');
  const id = btn.dataset.editId;

  const fecha = document.getElementById('fecha').value;
  const categoria = document.getElementById('categoria').value;
  const subcategoria = document.getElementById('subcategoria').value;
  const monto = document.getElementById('monto').value;
  const descripcion = document.getElementById('descripcion').value;

  if (!categoria) {
    mostrarMensaje('⚠️ Por favor selecciona una categoría', 'error');
    return;
  }

  btn.textContent = '⏳ Actualizando...';
  btn.disabled = true;

  try {
    const response = await apiPost({
      action: 'editarGasto',
      id: id,
      fecha: fecha,
      categoria: categoria,
      subcategoria: subcategoria || '',
      monto: parseFloat(monto),
      descripcion: descripcion || ''
    });

    if (response.success) {
      mostrarMensaje(response.message, 'success');

      document.getElementById('formGasto').reset();
      cargarFechasDefault();

      btn.textContent = '💾 Guardar Gasto';
      delete btn.dataset.editId;

      document.getElementById('formGasto').onsubmit = registrarGasto;

      cargarResumen();
    } else {
      mostrarMensaje('⚠️ ' + response.message, 'error');
    }
  } catch (error) {
    mostrarMensaje('❌ Error al actualizar: ' + error.message, 'error');
    console.error('Error detallado:', error);
  } finally {
    btn.textContent = '✏️ Actualizar Gasto';
    btn.disabled = false;
  }
}

// ==================== ELIMINAR GASTO ====================
async function eliminarGasto(id) {
  if (!confirm('⚠️ ¿Estás seguro de eliminar este gasto?')) return;

  try {
    console.log('📤 Eliminando gasto:', id);

    const response = await apiPost({
      action: 'eliminarGasto',
      id: id
    });

    console.log('📥 Respuesta eliminar:', response);

    if (response.success) {
      mostrarMensaje(response.message, 'success');
      cargarResumen();
    } else {
      mostrarMensaje('⚠️ ' + response.message, 'error');
    }
  } catch (error) {
    mostrarMensaje('❌ Error al eliminar: ' + error.message, 'error');
    console.error('Error detallado:', error);
  }
}

// ==================== MENSAJES ====================
function mostrarMensaje(texto, tipo) {
  const msg = document.getElementById('message');
  msg.textContent = texto;
  msg.className = 'message ' + tipo;

  setTimeout(() => {
    msg.className = 'message';
  }, 5000);
}

// ==================== INICIAR ====================
window.onload = init;