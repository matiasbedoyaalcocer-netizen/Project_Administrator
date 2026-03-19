import { API } from '../api.js';

export default {
    async render(container) {
        
        // Carga Visual Principal (Spinner)
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:60vh; color:var(--primary);">
                <i class='bx bx-grid-alt bx-flashing' style='font-size: 4rem; margin-bottom: 20px;'></i>
                <h3 style="color:var(--text-main);">Descargando Panorámica de Mongo...</h3>
            </div>
        `;

        let purchases = [];
        let tickets = [];
        let products = [];

        try {
            purchases = await API.getPurchases();
            tickets = await API.getTickets();
            products = await API.getProducts();
        } catch(e) {
            console.error(e);
            container.innerHTML = `
                <div style="padding:40px; text-align:center; color: var(--danger);">
                    <h2>Error Fatal de Sincronización 🚫</h2>
                    <p>No se lograron cargar los datos maestros. Mantiene Node.js activo ejecutando <code>node server.js</code>.</p>
                </div>`;
            return;
        }

        const totalPurchases = purchases.reduce((acc, c) => acc + c.total, 0);
        const totalTickets = tickets.reduce((acc, t) => acc + t.amount, 0);
        const globalExpense = totalPurchases + totalTickets;
        
        let stockWarnings = products.filter(p => p.stock <= 5).length;
        
        const html = `
            <div class="tip-banner">
                <i class='bx bx-cloud' style="font-size:2rem; color:var(--primary);"></i>
                <div style="flex:1;">
                    <h3>Software ERP Central</h3>
                    <p>Estas visualizando en tiempo real la información de tu comercio de forma centralizada y segura en todos tus dispositivos.</p>
                </div>
            </div>

            <div class="dashboard-grid">
                <div class="metric-card">
                    <div class="metric-title">Gasto Global Acumulado</div>
                    <div class="metric-value" style="color:var(--danger); font-size: 2.2rem;">-$${globalExpense.toFixed(2)}</div>
                    <div class="metric-trend text-muted">Abarca compras a proveedores y caja</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-title">Compras Realizadas</div>
                    <div class="metric-value">${purchases.length}</div>
                    <div class="metric-trend text-primary">Facturas archivadas remotos</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-title">Salidas de Dinero</div>
                    <div class="metric-value">${tickets.length}</div>
                    <div class="metric-trend text-primary">Tickets directos de caja</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-title">Alertas de Stock</div>
                    <div class="metric-value" style="color: ${stockWarnings > 0 ? 'var(--danger)' : 'var(--text-main)'};">${stockWarnings}</div>
                    <div class="metric-trend text-danger">Insumos Críticos bajo 5 uni.</div>
                </div>
            </div>

            <div class="card" style="margin-top:20px;">
                <div class="card-title"><i class='bx bx-receipt'></i> Flujo Reciente</div>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${
                        tickets.slice(0, 3).map(t => `
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0;">
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <i class='bx bx-minus-circle' style="color:var(--danger); font-size:1.5rem;"></i>
                                    <div>
                                        <b style="font-size:1rem;">${t.concept}</b>
                                        <div style="color:var(--text-muted); font-size:0.85rem;">Ticket Rápido • ${new Date(t.date).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div style="font-weight:700; color:var(--danger);">-$${t.amount.toFixed(2)}</div>
                            </div>
                        `).join('')
                    }
                    ${tickets.length === 0 ? '<p style="text-align:center; color:var(--text-muted);">Sin gastos registrados en efectivo.</p>' : ''}
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Reset old local DB items strictly locking application to MongoDB to protect User from accidental logic conflicts.
         if (localStorage.getItem('erp_products')) {
             localStorage.clear();
         }
    }
};
