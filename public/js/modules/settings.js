export default {
    render(container) {
        const html = `
            <div class="card">
                <div class="card-title">
                    <i class='bx bx-cog'></i> Configuración y Mantenimiento
                </div>
                
                <p style="font-size:1.1rem; color:var(--text-muted); margin-bottom: 30px;">
                    Desde aquí puedes administrar el sistema a nivel general.
                </p>

                <div style="border: 2px solid #fecaca; background: #fef2f2; border-radius: 16px; padding: 30px;">
                    <h3 style="color: var(--danger); font-size: 1.4rem; font-weight: 800; margin-bottom: 15px; display:flex; align-items:center; gap: 10px;">
                        <i class='bx bx-error-triangle'></i> Zona de Peligro: Reseteo Total
                    </h3>
                    <p style="font-size: 1.1rem; color: #991b1b; margin-bottom: 25px; line-height: 1.5;">
                        Esta opción limpiará absolutamente todo el ERP. Borrará todo el Inventario, todas las Compras, el Historial del Comparador de Precios y los Tickets rápidos. <b>Esta acción es inmediata e irreversible.</b>
                    </p>
                    <button class="btn" id="btn-reset-data" style="background-color: var(--danger); width: auto; padding: 18px 30px;">
                        <i class='bx bx-trash'></i> Borrar Sistema a Fábrica (Data Reset)
                    </button>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        this.bindEvents();
    },

    bindEvents() {
        const resetBtn = document.getElementById('btn-reset-data');
        if(resetBtn) {
            resetBtn.addEventListener('click', () => {
                const conf1 = confirm("⚠️ ATENCIÓN: Estás a punto de vaciar todo el Inventario y borrar el registro de Compras para siempre. ¿Estás seguro?");
                if(conf1) {
                    const conf2 = prompt("Escribe 'BORRAR' con mayúsculas para confirmar el reseteo completo del ERP:");
                    if(conf2 === 'BORRAR') {
                        // Limpiar keys específicas o todo (preferible limpiar todo lo que empiece por erp_)
                        Object.keys(localStorage).forEach(key => {
                            if (key.startsWith('erp_')) localStorage.removeItem(key);
                        });
                        alert("Sistema ERP completamente liberado de datos.");
                        window.location.reload();
                    } else {
                        alert("Reseteo cancelado por seguridad.");
                    }
                }
            });
        }
    }
};
