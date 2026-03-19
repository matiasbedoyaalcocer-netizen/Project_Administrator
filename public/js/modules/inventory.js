import { API } from '../api.js';

export default {
    products: [],
    container: null,

    async render(container) {
        this.container = container;
        
        // Loader State Visualizer
        this.container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height: 60vh; color: var(--primary);">
                <i class='bx bx-loader-alt bx-spin' style='font-size: 4rem; margin-bottom: 20px;'></i>
                <h3 style="color:var(--text-main);">Sincronizando con MongoDB Atlas...</h3>
                <p style="color:var(--text-muted);">Obteniendo el Inventario global desde la nube</p>
            </div>
        `;
        
        try {
            this.products = await API.getProducts();
        } catch (e) {
            console.error(e);
            this.container.innerHTML = `
                <div style="padding:40px; text-align:center; color: var(--danger);">
                    <i class='bx bx-error-alt' style="font-size:3rem;"></i>
                    <h2>Error de Conexión de Red</h2>
                    <p>No se pudo conectar al Servidor Backend. Intenta recargar.</p>
                </div>
            `;
            return;
        }
        
        this.renderView();
    },

    renderView() {
        let listHtml = '';
        if (this.products.length === 0) {
            listHtml = `
                <div class="empty-state">
                    <i class='bx bx-archive'></i>
                    <p>No tienes productos en el inventario.</p>
                </div>
            `;
        } else {
            const sorted = [...this.products].reverse();
            sorted.forEach(p => {
                listHtml += `
                    <div class="list-item" data-id="${p.id}" style="display: flex; justify-content: space-between; align-items: center; padding: 24px 0; border-bottom: 2px solid #f1f5f9;">
                        <div style="flex: 1;">
                            <h4 style="font-size: 1.35rem; font-weight: 800; color: var(--text-main); margin-bottom: 12px; letter-spacing: -0.5px;">${p.name}</h4>
                            <div style="font-size: 1.1rem; color: var(--text-muted); font-weight: 600; display:flex; align-items:center; gap: 15px;">
                                En Stock: 
                                <div style="display:flex; align-items:center; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; overflow:hidden;">
                                    <button class="btn-stock-adj" data-action="minus" data-id="${p.id}" style="width:40px; height:40px; border:none; background:transparent; font-size:1.5rem; font-weight:bold; cursor:pointer; color:var(--text-main); border-right:2px solid #e2e8f0;">-</button>
                                    <span style="font-size: 1.5rem; font-weight: 900; width: 60px; text-align:center; color: ${p.stock <= 5 ? 'var(--danger)' : 'var(--text-main)'}; display:inline-block; padding: 5px 0;">${p.stock}</span>
                                    <button class="btn-stock-adj" data-action="plus" data-id="${p.id}" style="width:40px; height:40px; border:none; background:transparent; font-size:1.5rem; font-weight:bold; cursor:pointer; color:var(--text-main); border-left:2px solid #e2e8f0;">+</button>
                                </div>
                            </div>
                        </div>
                        <div style="text-align: right; padding-left: 20px; border-left: 2px solid #e2e8f0;">
                            <div style="font-size: 0.95rem; color: var(--text-muted); font-weight: 700; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Precio Base</div>
                            <div style="font-size: 2rem; font-weight: 900; color: var(--primary); letter-spacing: -1px;">$${p.price.toFixed(2)}</div>
                        </div>
                    </div>
                `;
            });
        }

        const html = `
            <div id="inventory-list-view">
                <div class="card">
                    <div class="card-title" style="justify-content:space-between;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <i class='bx bx-cloud' style="color:var(--primary);"></i> Almacén Cloud Sincronizado
                        </div>
                        <button class="btn" id="btn-new-product" style="width:auto; padding:12px 20px; font-size:1rem;"><i class='bx bx-plus'></i> Nuevo Producto</button>
                    </div>
                    <div id="products-list-container">
                        ${listHtml}
                    </div>
                </div>
            </div>

            <div id="inventory-form-view" style="display: none;">
                <div class="card">
                    <div class="card-title">
                        <i class='bx bx-plus-circle'></i> Registrar Insumo Global
                    </div>
                    <div class="form-group">
                        <label>Nombre del Producto</label>
                        <input type="text" id="prod-name" class="form-control" placeholder="Ej. Harina de Trigo Extra Fina">
                    </div>
                    <div class="form-group">
                        <label>Stock Físico (Puesta Inicial)</label>
                        <input type="number" id="prod-stock" class="form-control" placeholder="Ej. 100">
                    </div>
                    <div class="form-group">
                        <label>Costo Estimado Promedio ($)</label>
                        <input type="number" step="0.01" id="prod-price" class="form-control" placeholder="Ej. 120.50">
                    </div>
                    
                    <button class="btn" id="btn-save-product" style="margin-bottom: 12px; background-color: var(--success);">
                        <i class='bx bx-cloud-upload'></i> Subir a Base de Datos
                    </button>
                    <button class="btn btn-secondary" id="btn-cancel-product">
                        Cancelar
                    </button>
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
        this.bindEvents();
    },

    bindEvents() {
        const btnNew = document.getElementById('btn-new-product');
        const btnCancel = document.getElementById('btn-cancel-product');
        const btnSave = document.getElementById('btn-save-product');
        const viewList = document.getElementById('inventory-list-view');
        const viewForm = document.getElementById('inventory-form-view');

        // QUICK ASYNC STOCK BUTTONS
        document.querySelectorAll('.btn-stock-adj').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = parseInt(e.currentTarget.dataset.id, 10);
                const action = e.currentTarget.dataset.action;
                const pIndex = this.products.findIndex(p => p.id === id);
                if(pIndex !== -1) {
                    let oldStock = this.products[pIndex].stock;
                    
                    if(action === 'plus') this.products[pIndex].stock++;
                    else if(action === 'minus' && this.products[pIndex].stock > 0) this.products[pIndex].stock--;
                    
                    // Solo intentar guardar si algo cambió
                    if (this.products[pIndex].stock !== oldStock) {
                        // Optimistic UI update (rendereamos y luego sincronizamos)
                        this.renderView();
                        
                        try {
                            await API.updateProduct(id, { stock: this.products[pIndex].stock });
                        } catch (err) {
                            alert("Error sincronizando el stock con la nube. Refresca la ventana.");
                        }
                    }
                }
            });
        });

        if(btnNew) {
            btnNew.addEventListener('click', () => {
                viewList.style.display = 'none';
                viewForm.style.display = 'block';
                document.getElementById('prod-name').value = '';
                document.getElementById('prod-stock').value = '';
                document.getElementById('prod-price').value = '';
            });
        }

        if(btnCancel) {
            btnCancel.addEventListener('click', () => {
                viewForm.style.display = 'none';
                viewList.style.display = 'block';
            });
        }

        if(btnSave) {
            btnSave.addEventListener('click', async () => {
                const name = document.getElementById('prod-name').value;
                const stock = parseInt(document.getElementById('prod-stock').value, 10);
                const price = parseFloat(document.getElementById('prod-price').value);

                if (!name || isNaN(stock) || isNaN(price)) {
                    alert('Revisa los datos antes de sincronizar.');
                    return;
                }

                btnSave.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Subiendo...";
                btnSave.disabled = true;

                const newProd = {
                    id: Date.now(),
                    name,
                    stock,
                    price,
                    date: new Date().toISOString(),
                    priceHistory: [{
                        date: new Date().toISOString(),
                        price: price
                    }]
                };

                try {
                    await API.saveProduct(newProd);
                    this.products.push(newProd);
                    this.renderView();
                } catch(err) {
                    btnSave.innerHTML = "<i class='bx bx-cloud-upload'></i> Subir a Base de Datos";
                    btnSave.disabled = false;
                    alert("Falló la escritura en MongoDB Atlas. Intenta nuevamente.");
                }
            });
        }
    }
};
