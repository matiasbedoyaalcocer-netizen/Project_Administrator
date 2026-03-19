import { API } from '../api.js';

export default {
    products: [],
    selectedProductId: null,
    chartInstance: null,
    container: null,

    async initData() {
        this.products = await API.getProducts();    
    },

    async render(container) {
        this.container = container;
        this.container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:60vh; color:var(--primary);">
                <i class='bx bx-line-chart bx-flashing' style='font-size: 4rem; margin-bottom: 20px;'></i>
                <h3 style="color:var(--text-main);">Analizando Datos Históricos...</h3>
            </div>
        `;
        try {
            await this.initData();
        } catch(e) {
            this.container.innerHTML = `<p style="padding:40px;text-align:center;color:red;">Error de Red MongoDB</p>`;
            return;
        }

        // Asegurar que tengan priceHistory inyectado en DB
        let needsSave = false;
        for (let p of this.products) {
            if(!p.priceHistory) {
                p.priceHistory = [{ date: p.date || new Date().toISOString(), price: p.price }];
                await API.updateProduct(p.id, { priceHistory: p.priceHistory });
                needsSave = true;
            }
        }
        
        this.selectedProductId = this.products.length > 0 ? this.products[0].id : null;
        this.renderView();
    },

    renderView() {
        if(this.products.length === 0) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <i class='bx bx-trending-up'></i>
                    <p>No tienes productos en el Inventario para comparar.</p>
                </div>
            `;
            return;
        }

        let optionsHtml = '';
        this.products.forEach(p => {
            optionsHtml += `<option value="${p.id}" ${p.id === this.selectedProductId ? 'selected' : ''}>${p.name}</option>`;
        });

        // HTML base
        const html = `
            <div class="tip-banner">
                <i class='bx bx-radar'></i>
                <div>
                    <h3>Comparador de Precios Histórico</h3>
                    <p>Mide la inflación o el ahorro contra tus precios previos de forma inteligente y automatizada.</p>
                </div>
            </div>

            <div class="card" style="margin-bottom: 20px;">
                <label style="font-size: 0.95rem; font-weight: 700; display: block; margin-bottom: 10px;">Selecciona el Insumo a Evaluar:</label>
                <select id="comp-product-select" class="form-control" style="font-size: 1.1rem; padding: 12px; font-weight: 600;">
                    ${optionsHtml}
                </select>
            </div>

            <div id="comparator-details" style="display: grid; grid-template-columns: 1fr; gap: 20px;">
                <!-- Dinámico -->
            </div>
            
            <div class="card" style="margin-top:20px;">
                <h3 style="font-size:1rem; margin-bottom:15px;"><i class='bx bx-edit'></i> Ingreso Manual de Tasación</h3>
                <div style="display:flex; gap:10px;">
                    <input type="number" step="0.01" id="manual-price-input" class="form-control" placeholder="Nuevo costo (Ej. 120.50)">
                    <button class="btn" id="btn-add-manual-price" style="width:auto; padding:0 20px;">Actualizar Nube</button>
                </div>
            </div>
        `;

        this.container.innerHTML = html;
        this.renderDetails();
        this.bindEvents();
    },

    renderDetails() {
        const prod = this.products.find(p => p.id == this.selectedProductId);
        if(!prod) return;

        const originalPrice = prod.priceHistory[0].price;
        const currentPrice = prod.price;
        const diffAbs = currentPrice - originalPrice;
        const diffPct = originalPrice ? ((diffAbs / originalPrice) * 100).toFixed(2) : 0;
        
        let headerColor = diffAbs > 0 ? 'var(--danger)' : (diffAbs < 0 ? 'var(--success)' : 'var(--text-main)');
        let arrow = diffAbs > 0 ? "<i class='bx bx-up-arrow-alt'></i>" : (diffAbs < 0 ? "<i class='bx bx-down-arrow-alt'></i>" : "=");

        let tableRows = '';
        const reversedHistory = [...prod.priceHistory].reverse();
        reversedHistory.forEach((entry, idx) => {
            const rowDiffAbs = entry.price - originalPrice;
            const rowDiffPct = originalPrice ? ((rowDiffAbs / originalPrice) * 100).toFixed(2) : 0;
            const color = rowDiffAbs > 0 ? '#ef4444' : (rowDiffAbs < 0 ? '#10b981' : '#64748b');
            tableRows += `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding:12px 10px;">${new Date(entry.date).toLocaleDateString()}</td>
                    <td style="padding:12px 10px; font-weight:700;">$${entry.price.toFixed(2)}</td>
                    <td style="padding:12px 10px; color:${color}; font-weight:700;">
                        ${rowDiffAbs > 0 ? '+' : ''}$${rowDiffAbs.toFixed(2)} (${rowDiffPct}%)
                    </td>
                </tr>
            `;
        });

        const detailsContainer = document.getElementById('comparator-details');
        detailsContainer.innerHTML = `
            <div class="card" style="text-align:center;">
                <p style="font-size:1rem; color:var(--text-muted); font-weight:600;">Variación Acumulada desde Alta</p>
                <div style="font-size:3rem; font-weight:900; color:${headerColor}; font-family:'Inter', sans-serif;">
                    ${arrow} ${Math.abs(diffPct)}%
                </div>
                <p style="font-size:0.9rem; margin-top:5px; color:var(--text-muted);">
                    Precio Base: <b>$${originalPrice.toFixed(2)}</b> &rarr; Actual: <b>$${currentPrice.toFixed(2)}</b>
                </p>
            </div>
            
            <div class="card">
                <canvas id="compChart"></canvas>
            </div>

            <div class="card" style="overflow-x:auto;">
                <table style="width:100%; text-align:left; border-collapse: collapse;">
                    <thead>
                        <tr style="background:#f8fafc; color:var(--text-muted); font-size:0.85rem; text-transform:uppercase;">
                            <th style="padding:10px;">Fecha Modif.</th>
                            <th style="padding:10px;">Costo Pautado</th>
                            <th style="padding:10px;">Impacto</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        `;

        // Render Chart.js
        this.drawChart(prod.priceHistory);
    },

    drawChart(history) {
        const ctx = document.getElementById('compChart');
        if(!ctx) return;
        
        if(this.chartInstance) this.chartInstance.destroy();

        const labels = history.map(h => new Date(h.date).toLocaleDateString());
        const data = history.map(h => h.price);

        const firstPrice = data[0];
        const lastPrice = data[data.length-1];
        let color = lastPrice > firstPrice ? '#ef4444' : (lastPrice < firstPrice ? '#10b981' : '#3b82f6');
        
        // Gradient for premium feel
        let bgGradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        bgGradient.addColorStop(0, color + '55'); 
        bgGradient.addColorStop(1, color + '00');

        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Trayectoria Real ($)',
                    data: data,
                    borderColor: color,
                    backgroundColor: bgGradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: color,
                    pointBorderWidth: 3,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: false } }
            }
        });
    },

    bindEvents() {
        const select = document.getElementById('comp-product-select');
        const btnAdd = document.getElementById('btn-add-manual-price');
        const inputPrice = document.getElementById('manual-price-input');

        select.addEventListener('change', (e) => {
            this.selectedProductId = parseInt(e.target.value, 10);
            this.renderDetails();
        });

        btnAdd.addEventListener('click', async () => {
            const price = parseFloat(inputPrice.value);
            if(isNaN(price) || price <= 0) {
                alert("Ingresa un costo superior a 0.");
                return;
            }

            const pIndex = this.products.findIndex(p => p.id == this.selectedProductId);
            if(pIndex !== -1) {
                const prod = this.products[pIndex];
                
                prod.price = price;
                prod.priceHistory.push({
                    date: new Date().toISOString(),
                    price: price
                });

                btnAdd.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Guardando...";
                btnAdd.disabled = true;

                try {
                    await API.updateProduct(prod.id, { 
                        price: prod.price, 
                        priceHistory: prod.priceHistory 
                    });
                    
                    inputPrice.value = '';
                    btnAdd.innerHTML = "Actualizar Nube";
                    btnAdd.disabled = false;
                    
                    this.renderDetails();
                } catch(err) {
                    alert("Fallo emitiendo escritura. Verifica tu conexión a internet.");
                    btnAdd.innerHTML = "Actualizar Nube";
                    btnAdd.disabled = false;
                }
            }
        });
    }
};
