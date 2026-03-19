import { API } from '../api.js';

export default {
    async render(container) {
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:60vh; color:var(--primary);">
                <i class='bx bx-pie-chart-alt-2 bx-flashing' style='font-size: 4rem; margin-bottom: 20px;'></i>
                <h3 style="color:var(--text-main);">Calculando Índices de Gasto...</h3>
                <p style="color:var(--text-muted);">Procesando información del sistema...</p>
            </div>
        `;

        try {
            const purchases = await API.getPurchases();
            const tickets = await API.getTickets();
            
            const totalPurchases = purchases.reduce((acc, p) => acc + p.total, 0);
            const totalTickets = tickets.reduce((acc, t) => acc + t.amount, 0);

            if(totalPurchases === 0 && totalTickets === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class='bx bx-bar-chart-alt-2'></i>
                        <p>No hay salidas de dinero registradas para analizar.</p>
                    </div>
                `;
                return;
            }

            const html = `
                <div class="tip-banner">
                    <i class='bx bx-pie-chart-alt-2'></i>
                    <div>
                        <h3>Análisis General de Costos</h3>
                        <p>Distribución matemática exacta de tus operaciones extraídas desde tu bóveda central.</p>
                    </div>
                </div>
                
                <div class="card" style="margin-bottom:20px;">
                    <div class="card-title">Composición de Gastos Operacionales</div>
                    <div style="max-width: 400px; margin: 0 auto;">
                        <canvas id="expenseChart"></canvas>
                    </div>
                </div>
            `;
            container.innerHTML = html;

            const ctx = document.getElementById('expenseChart');
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Facturas Proveedores', 'Gastos Corrientes (Sueldos/Caja)'],
                    datasets: [{
                        data: [totalPurchases, totalTickets],
                        backgroundColor: ['#3b82f6', '#ef4444'],
                        borderWidth: 0,
                        hoverOffset: 15
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom', labels: {font: {size: 14}} }
                    }
                }
            });

        } catch (e) {
            container.innerHTML = `
                <div style="padding:40px;text-align:center;color:var(--danger);">
                    <i class='bx bx-error-circle' style="font-size:3rem;"></i>
                    <h2>Fallo Analítico</h2>
                    <p>No se pudo acceder a las métricas del sistema.</p>
                </div>
            `;
        }
    }
};
