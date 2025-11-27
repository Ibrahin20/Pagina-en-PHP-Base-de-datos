// Configuración global
const CONFIG = {
    API_URL: 'php/conexion.php'
};

// Estado de la aplicación
const AppState = {
    editing: false,
    currentId: null
};

// Utilidades
const Utils = {
    mostrarAlerta(mensaje, tipo) {
        const alert = document.getElementById('alert');
        alert.textContent = mensaje;
        alert.className = `alert alert-${tipo}`;
        alert.style.display = 'block';
        
        setTimeout(() => {
            alert.style.display = 'none';
        }, 5000);
    },

    formatearFecha(fechaString) {
        return new Date(fechaString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    confirmarAccion(mensaje) {
        return confirm(mensaje);
    }
};

// Servicios API
const ApiService = {
    async registrarGanador(data) {
        try {
            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            throw new Error('Error de conexión: ' + error.message);
        }
    },

    async actualizarGanador(id, data) {
        try {
            const response = await fetch(CONFIG.API_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, ...data })
            });
            return await response.json();
        } catch (error) {
            throw new Error('Error de conexión: ' + error.message);
        }
    },

    async eliminarGanador(id) {
        try {
            const response = await fetch(CONFIG.API_URL, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id })
            });
            return await response.json();
        } catch (error) {
            throw new Error('Error de conexión: ' + error.message);
        }
    },

    async obtenerGanador(id) {
        try {
            const response = await fetch(`${CONFIG.API_URL}?id=${id}`);
            return await response.json();
        } catch (error) {
            throw new Error('Error al cargar datos: ' + error.message);
        }
    },

    async obtenerGanadores(searchTerm = '') {
        try {
            const url = searchTerm 
                ? `${CONFIG.API_URL}?search=${encodeURIComponent(searchTerm)}`
                : CONFIG.API_URL;
            
            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            throw new Error('Error al cargar datos: ' + error.message);
        }
    }
};

// Manejo del DOM
const DomManager = {
    mostrarResultados(ganadores) {
        const tbody = document.getElementById('resultsBody');
        
        if (ganadores.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="no-results">
                        No se encontraron ganadores que coincidan con la búsqueda
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = ganadores.map(ganador => `
            <tr data-id="${ganador.id}">
                <td>${this.escapeHtml(ganador.nombre)}</td>
                <td>${ganador.tickets_comprados}</td>
                <td><strong class="ticket-winner">${this.escapeHtml(ganador.ticket_ganador)}</strong></td>
                <td>${this.escapeHtml(ganador.premio)}</td>
                <td>${this.escapeHtml(ganador.direccion)}</td>
                <td>${this.escapeHtml(ganador.telefono)}</td>
                <td>${this.escapeHtml(ganador.placa_premio || 'N/A')}</td>
                <td>${Utils.formatearFecha(ganador.fecha_registro)}</td>
                <td class="actions">
                    <button class="btn btn-edit" onclick="AppController.editarGanador(${ganador.id})" title="Editar">
                        ✏️
                    </button>
                    <button class="btn btn-delete" onclick="AppController.eliminarGanador(${ganador.id})" title="Eliminar">
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('');
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    limpiarFormulario() {
        document.getElementById('ganadorForm').reset();
        document.getElementById('formTitle').textContent = '📝 Registrar Nuevo Ganador';
        document.getElementById('submitButton').textContent = '✅ Registrar Ganador';
        document.getElementById('cancelButton').style.display = 'none';
        AppState.editing = false;
        AppState.currentId = null;
    },

    cargarDatosEnFormulario(ganador) {
        document.getElementById('nombre').value = ganador.nombre;
        document.getElementById('tickets_comprados').value = ganador.tickets_comprados;
        document.getElementById('ticket_ganador').value = ganador.ticket_ganador;
        document.getElementById('premio').value = ganador.premio;
        document.getElementById('direccion').value = ganador.direccion;
        document.getElementById('telefono').value = ganador.telefono;
        document.getElementById('placa_premio').value = ganador.placa_premio || '';
        
        document.getElementById('formTitle').textContent = '✏️ Editar Ganador';
        document.getElementById('submitButton').textContent = '💾 Actualizar Ganador';
        document.getElementById('cancelButton').style.display = 'inline-block';
        
        AppState.editing = true;
        AppState.currentId = ganador.id;
    }
};

// Controlador principal
const AppController = {
    init() {
        this.configurarEventos();
        this.cargarGanadores();
    },

    configurarEventos() {
        // Envío del formulario
        document.getElementById('ganadorForm').addEventListener('submit', (e) => {
            e.preventDefault();
            if (AppState.editing) {
                this.actualizarGanador();
            } else {
                this.registrarGanador();
            }
        });

        // Cancelar edición
        document.getElementById('cancelButton').addEventListener('click', () => {
            this.cancelarEdicion();
        });

        // Búsqueda en tiempo real
        document.getElementById('searchInput').addEventListener('input', (e) => {
            if (e.target.value.length >= 3 || e.target.value.length === 0) {
                this.buscarGanadores();
            }
        });

        // Enter en búsqueda
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.buscarGanadores();
            }
        });
    },

    async registrarGanador() {
        const formData = new FormData(document.getElementById('ganadorForm'));
        const data = Object.fromEntries(formData);
        
        try {
            const result = await ApiService.registrarGanador(data);
            
            if (result.success) {
                Utils.mostrarAlerta('✅ Ganador registrado exitosamente', 'success');
                DomManager.limpiarFormulario();
                this.cargarGanadores();
            } else {
                Utils.mostrarAlerta('❌ Error al registrar ganador: ' + result.error, 'error');
            }
        } catch (error) {
            Utils.mostrarAlerta('❌ ' + error.message, 'error');
        }
    },

    async actualizarGanador() {
        const formData = new FormData(document.getElementById('ganadorForm'));
        const data = Object.fromEntries(formData);
        
        try {
            const result = await ApiService.actualizarGanador(AppState.currentId, data);
            
            if (result.success) {
                Utils.mostrarAlerta('✅ Ganador actualizado exitosamente', 'success');
                DomManager.limpiarFormulario();
                this.cargarGanadores();
            } else {
                Utils.mostrarAlerta('❌ Error al actualizar ganador: ' + result.error, 'error');
            }
        } catch (error) {
            Utils.mostrarAlerta('❌ ' + error.message, 'error');
        }
    },

    async eliminarGanador(id) {
        if (!Utils.confirmarAccion('¿Estás seguro de que deseas eliminar este ganador? Esta acción no se puede deshacer.')) {
            return;
        }
        
        try {
            const result = await ApiService.eliminarGanador(id);
            
            if (result.success) {
                Utils.mostrarAlerta('✅ Ganador eliminado exitosamente', 'success');
                this.cargarGanadores();
            } else {
                Utils.mostrarAlerta('❌ Error al eliminar ganador: ' + result.error, 'error');
            }
        } catch (error) {
            Utils.mostrarAlerta('❌ ' + error.message, 'error');
        }
    },

    async editarGanador(id) {
        try {
            const ganador = await ApiService.obtenerGanador(id);
            DomManager.cargarDatosEnFormulario(ganador);
            
            // Scroll suave al formulario
            document.querySelector('.form-section').scrollIntoView({ 
                behavior: 'smooth' 
            });
        } catch (error) {
            Utils.mostrarAlerta('❌ ' + error.message, 'error');
        }
    },

    cancelarEdicion() {
        DomManager.limpiarFormulario();
        Utils.mostrarAlerta('Edición cancelada', 'success');
    },

    async cargarGanadores() {
        try {
            const ganadores = await ApiService.obtenerGanadores();
            DomManager.mostrarResultados(ganadores);
        } catch (error) {
            Utils.mostrarAlerta('❌ ' + error.message, 'error');
        }
    },

    async buscarGanadores() {
        const searchTerm = document.getElementById('searchInput').value;
        
        try {
            const ganadores = await ApiService.obtenerGanadores(searchTerm);
            DomManager.mostrarResultados(ganadores);
        } catch (error) {
            Utils.mostrarAlerta('❌ ' + error.message, 'error');
        }
    }
};

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    AppController.init();
});

// Exponer funciones globales para onclick
window.buscarGanadores = () => AppController.buscarGanadores();