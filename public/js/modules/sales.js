import { API } from '../api.js';

export default {
    purchases: [],
    products: [],
    currentInvoiceItems: [],
    container: null,
    
    async initData() {
        try {
            this.purchases = await API.getPurchases();
            this.products = await API.getProducts();
        } catch(e) {
            console.error("Database sync failed", e);
            throw e;
        }
    },

    async render(container) {
        this.container = container;
        this.currentInvoiceItems = [];
        
        this.container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height: 60vh; color: var(--primary);">
                <i class='bx bx-loader-alt bx-spin' style='font-size: 4rem; margin-bottom: 20px;'></i>
                <h3 style="color:var(--text-main);">Armando Módulo de Compras...</h3>
                <p style="color:var(--text-muted);">Recuperando historial desde Atlas.</p>
            </div>
        `;
        
        try {
            await this.initData();
            this.renderView();
        } catch(err) {
            this.container.innerHTML = `
                <div style="padding:40px; text-align:center; color: var(--danger);">
                    <i class='bx bx-error-alt' style="font-size:3rem;"></i>
                    <h2>Error de Conexión de Red</h2>
                    <p>No se pudo conectar al Servidor Backend. El Servidor local Node debe estar corriendo.</p>
                </div>
            `;
        }
    },

    renderView() {
        let listHtml = '';
        if (this.purchases.length === 0) {
            listHtml = `
                <div class="empty-state">
                    <i class='bx bx-cart'></i>
                    <p>No has ingresado facturas de compra aún.</p>
                </div>
            `;
        } else {
            const sorted = [...this.purchases].sort((a,b) => new Date(b.date) - new Date(a.date));
            sorted.forEach(s => {
                const dateStr = new Date(s.date).toLocaleDateString();
                listHtml += `
                    <div class="list-item">
                        <div class="receipt-thumb"><i class='bx bxs-file-pdf' style="color:var(--danger); font-size:1.8rem;"></i></div>
                        <div class="list-info">
                            <h4>Entidad: ${s.supplier || s.client || 'Comercio / Proveedor'}</h4>
                            <p>${dateStr} • #${s.id.toString().slice(-4)}</p>
                        </div>
                        <div class="list-value text-success" style="color: var(--danger) !important;">-$${s.total.toFixed(2)}</div>
                    </div>
                `;
            });
        }

        let productOptions = '<option value="">Selecciona un producto...</option>';
        this.products.forEach(p => {
            productOptions += `<option value="${p.id}" data-price="${p.price}" data-name="${p.name}">${p.name} ($${p.price.toFixed(2)})</option>`;
        });

        const html = `
            <div id="sales-list-view">
                <div class="tip-banner">
                    <i class='bx bx-cloud-upload'></i>
                    <div>
                        <h3>Registro de Facturas</h3>
                        <p>Ingresa las facturas de tus proveedores. Todo se guardará en el servidor y sincronizará en tiempo real tu Inventario Global.</p>
                    </div>
                </div>

                <div class="card">
                    <div class="card-title">
                        <i class='bx bx-history'></i>
                        Historial de Compras
                    </div>
                    <div id="sales-list-container">
                        ${listHtml}
                    </div>
                </div>
                
                <button class="fab" id="btn-new-sale" aria-label="Nueva Factura">
                    <i class='bx bx-plus'></i>
                </button>
            </div>

            <div id="sales-form-view" style="display: none;">
                <div class="card">
                    <div class="card-title">
                        <i class='bx bx-edit'></i> Ingresar Factura de Proveedor
                    </div>

                    <div class="form-group">
                        <label>Nombre del Proveedor / Mayorista</label>
                        <input type="text" id="sale-client" class="form-control" placeholder="Ej. Distribuidora S.A.">
                    </div>

                    <hr style="border:none; border-top: 1px solid var(--border-color); margin: 20px 0;">

                    <div style="background:var(--bg-color); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                        <label style="font-size:0.95rem; font-weight:700; color:var(--text-main); display:block; margin-bottom:10px;">Añadir Ítems Facturados</label>
                        <select id="sale-product-select" class="form-control" style="margin-bottom:15px;">
                            ${productOptions}
                        </select>
                        <div style="display:flex; gap: 15px; margin-bottom: 15px;">
                            <div style="flex: 2;">
                                <label style="font-size:0.85rem; font-weight:700; color:var(--text-muted); display:block; margin-bottom:6px;">Costo Exacto Facturado ($)</label>
                                <input type="number" step="0.01" id="sale-price" class="form-control" placeholder="0.00">
                            </div>
                            <div style="flex: 1; min-width: 90px;">
                                <label style="font-size:0.85rem; font-weight:700; color:var(--text-muted); display:block; margin-bottom:6px;">Cant.</label>
                                <input type="number" id="sale-qty" class="form-control" value="1" min="1">
                            </div>
                        </div>
                        <button class="btn" id="btn-add-item" style="padding:16px; border-radius:12px; font-size:1.1rem; background-color: var(--secondary);">Añadir Ítem <i class='bx bx-plus'></i></button>
                    </div>

                    <div class="form-group">
                        <label>Desglose de Subida</label>
                        <div id="invoice-items-list" style="background: #f8fafc; border: 1px solid var(--border-color); border-radius:12px; padding: 15px; min-height:80px;">
                            <p style="color:var(--text-muted); font-size:0.85rem; text-align:center;">No hay ítems agregados.</p>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Impuesto Retenido / IVA</label>
                        <select id="sale-tax" class="form-control">
                            <option value="0">0% (Exento)</option>
                            <option value="10.5">10.5% (Reducido)</option>
                            <option value="21" selected>21% (General)</option>
                        </select>
                    </div>

                    <div style="margin: 20px 0; padding:15px; border-radius:12px; background:#fef2f2; color:var(--danger);">
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span>Subtotal Gasto:</span> <span id="live-subtotal">$0.00</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span>Impuestos:</span> <span id="live-tax">$0.00</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-weight:700; font-size:1.2rem; border-top:1px solid rgba(239,68,68,0.2); padding-top:10px; margin-top:5px;">
                            <span>TOTAL A PAGAR:</span> <span id="live-total">$0.00</span>
                        </div>
                    </div>

                    <button class="btn" id="btn-generate-pdf" style="margin-bottom: 12px; background-color: var(--primary);">
                        <i class='bx bx-check'></i> Guardar Compra y Actualizar Stocks
                    </button>
                    <button class="btn btn-secondary" id="btn-cancel-sale">
                        Volver
                    </button>
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
        this.bindEvents();
    },

    bindEvents() {
        const btnNew = document.getElementById('btn-new-sale');
        const btnCancel = document.getElementById('btn-cancel-sale');
        const viewList = document.getElementById('sales-list-view');
        const viewForm = document.getElementById('sales-form-view');
        
        const btnAddItem = document.getElementById('btn-add-item');
        const selectProd = document.getElementById('sale-product-select');
        const qtyInput = document.getElementById('sale-qty');
        const priceInput = document.getElementById('sale-price');
        const itemsListDiv = document.getElementById('invoice-items-list');
        const taxSelect = document.getElementById('sale-tax');
        
        const btnGenerate = document.getElementById('btn-generate-pdf');

        selectProd.addEventListener('change', () => {
            const selectedOption = selectProd.options[selectProd.selectedIndex];
            if(selectedOption.value) priceInput.value = selectedOption.getAttribute('data-price');
            else priceInput.value = '';
        });

        btnNew.addEventListener('click', () => {
             if(this.products.length === 0) {
                 alert("Primero añade un insumo al Inventario.");
                 return;
             }
             viewList.style.display = 'none';
             viewForm.style.display = 'block';
             this.currentInvoiceItems = [];
             this.updateLiveTotals();
        });

        btnCancel.addEventListener('click', () => {
             viewForm.style.display = 'none';
             viewList.style.display = 'block';
        });

        btnAddItem.addEventListener('click', () => {
             const selectedOption = selectProd.options[selectProd.selectedIndex];
             if(!selectedOption.value) return;

             const id = parseInt(selectedOption.value, 10);
             const name = selectedOption.getAttribute('data-name');
             const qty = parseInt(qtyInput.value, 10);
             const price = parseFloat(priceInput.value); 

             if(isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) {
                 alert("Asegúrate de haber puesto un precio y una cantidad válidos.");
                 return;
             }
             this.currentInvoiceItems.push({ id, name, qty, price, subtotal: qty * price });
             this.renderItemsList(itemsListDiv);
             this.updateLiveTotals();
        });

        taxSelect.addEventListener('change', () => this.updateLiveTotals());

        btnGenerate.addEventListener('click', async () => {
             const supplierName = document.getElementById('sale-client').value || 'Proveedor Genérico';
             
             if(this.currentInvoiceItems.length === 0) {
                 alert("Añade al menos un costo a la compra.");
                 return;
             }

             // Block User Interactions
             btnGenerate.disabled = true;
             btnGenerate.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Guardando datos...";

             const totals = this.calculateTotals();

             const newPurchase = {
                 id: Date.now(),
                 supplier: supplierName,
                 items: this.currentInvoiceItems,
                 subtotal: totals.subtotal,
                 taxPercent: totals.taxRate,
                 taxValue: totals.taxValue,
                 total: totals.total,
                 date: new Date().toISOString()
             };
             
             try {
                 // Push Central Report to MongoDB
                 await API.savePurchase(newPurchase);
                 
                 // Push Sub-Items individual Stock & Price updates to MongoDB incrementally
                 for (let item of this.currentInvoiceItems) {
                     const pIndex = this.products.findIndex(p => p.id === item.id);
                     if(pIndex !== -1) {
                         const targetedProduct = this.products[pIndex];
                         let updatePayload = {
                             stock: targetedProduct.stock + item.qty
                         };
                         
                         // Determine if we need to append history
                         if (!targetedProduct.priceHistory) {
                             updatePayload.priceHistory = [{ date: new Date().toISOString(), price: targetedProduct.price }];
                         } else {
                             updatePayload.priceHistory = [...targetedProduct.priceHistory];
                         }
                         
                         if (targetedProduct.price !== item.price) {
                             updatePayload.price = item.price;
                             updatePayload.priceHistory.push({
                                 date: new Date().toISOString(),
                                 price: item.price
                             });
                         }
                         
                         // Single Network Request PATCH per distinct product in ticket
                         await API.updateProduct(item.id, updatePayload);
                     }
                 }

                 // Generate Client Side PDF Archive visually before tearing down the view
                 this.generateAndDownloadPDF(newPurchase, viewList, viewForm);

             } catch (err) {
                 alert("Ocurrió un error guardando la información.");
                 console.error(err);
                 btnGenerate.disabled = false;
                 btnGenerate.innerHTML = "<i class='bx bxs-file-pdf'></i> Subir Compra (Atlas) + Actualizar Stocks";
             }
        });
    },

    renderItemsList(container) {
        if(this.currentInvoiceItems.length === 0) {
             container.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem; text-align:center;">No hay ítems agregados.</p>';
             return;
        }

        let html = '';
        this.currentInvoiceItems.forEach((item, index) => {
             html += `
                <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #e2e8f0; padding-bottom:5px;">
                    <div style="font-size:0.9rem;"><b>${item.qty}x</b> ${item.name} a $${item.price.toFixed(2)} c/u</div>
                    <div style="font-size:0.9rem; font-weight:600;">$${item.subtotal.toFixed(2)}</div>
                </div>
             `;
        });
        container.innerHTML = html;
    },

    calculateTotals() {
        const subtotal = this.currentInvoiceItems.reduce((acc, curr) => acc + curr.subtotal, 0);
        const taxRate = parseFloat(document.getElementById('sale-tax').value) || 0;
        const taxValue = subtotal * (taxRate / 100);
        const total = subtotal + taxValue;
        return { subtotal, taxRate, taxValue, total };
    },

    updateLiveTotals() {
        const totals = this.calculateTotals();
        document.getElementById('live-subtotal').textContent = `$${totals.subtotal.toFixed(2)}`;
        document.getElementById('live-tax').textContent = `$${totals.taxValue.toFixed(2)}`;
        document.getElementById('live-total').textContent = `$${totals.total.toFixed(2)}`;
    },

    generateAndDownloadPDF(purchaseObj, viewList, viewForm) {
        const dateStr = new Date(purchaseObj.date).toLocaleDateString();
        
        let itemsRows = '';
        purchaseObj.items.forEach(item => {
            itemsRows += `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align:center;">${item.qty}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align:right;">$${item.price.toFixed(2)}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align:right;">$${item.subtotal.toFixed(2)}</td>
                </tr>
            `;
        });

        const pdfContainer = document.createElement('div');
        pdfContainer.style.background = 'white';
        pdfContainer.style.color = 'black';
        pdfContainer.style.padding = '40px';
        pdfContainer.style.width = '800px';
        pdfContainer.style.fontFamily = "'Helvetica Neue', Helvetica, Arial, sans-serif";
        
        pdfContainer.innerHTML = `
            <div>
                <div style="display:flex; justify-content:space-between; border-bottom: 2px solid #ef4444; padding-bottom: 20px; margin-bottom: 30px;">
                    <div>
                        <h1 style="color: #ef4444; margin:0; font-size:32px;">Registro de Compra</h1>
                        <p style="margin:5px 0; color:#666;">Sistema ERP Interno - Consolidado</p>
                    </div>
                    <div style="text-align:right;">
                        <h2 style="margin:0; font-size:24px; color:#333;">COMPRA INGRESO</h2>
                        <p style="margin:5px 0;">Folio: 0001-${purchaseObj.id.toString().slice(-6)}</p>
                        <p style="margin:5px 0;">Fecha: ${dateStr}</p>
                    </div>
                </div>
                
                <div style="margin-bottom: 40px;">
                    <h3 style="margin-bottom:10px; font-size:18px; color:#ef4444;">A FAVOR DEL PROVEEDOR/COMERCIO:</h3>
                    <p style="margin:0; font-size:16px;"><b>${purchaseObj.supplier || purchaseObj.client || 'Proveedor General'}</b></p>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
                    <thead>
                        <tr style="background:#fef2f2; text-align:left;">
                            <th style="padding: 12px 10px; border-bottom:2px solid #ddd;">Descripción</th>
                            <th style="padding: 12px 10px; border-bottom:2px solid #ddd; text-align:center;">Cant.</th>
                            <th style="padding: 12px 10px; border-bottom:2px solid #ddd; text-align:right;">Costo c/u</th>
                            <th style="padding: 12px 10px; border-bottom:2px solid #ddd; text-align:right;">Monto Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRows}
                    </tbody>
                </table>

                <div style="display:flex; justify-content:flex-end;">
                    <div style="width: 300px;">
                        <div style="display:flex; justify-content:space-between; padding: 10px 0;">
                            <span>Subtotal:</span>
                            <span>$${purchaseObj.subtotal.toFixed(2)}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding: 10px 0; border-bottom: 2px solid #ddd;">
                            <span>IVA Retenido (${purchaseObj.taxPercent}%):</span>
                            <span>$${purchaseObj.taxValue.toFixed(2)}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding: 15px 0; font-size:20px; font-weight:bold; color:#ef4444;">
                            <span>TOTAL PAGADO:</span>
                            <span>$${purchaseObj.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const opt = {
            margin:       0.5,
            filename:     'Reporte_Compra_' + purchaseObj.supplier.replace(/ /g, '_') + '.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        if (window.html2pdf) {
            window.html2pdf().set(opt).from(pdfContainer).save().then(async () => {
                 // Refresh view strictly pulling from Atlas to guarantee 1:1 true representation of data commit
                 await this.render(this.container); 
            }).catch(async err => {
                 console.error(err);
                 await this.render(this.container);
            });
        }
    }
};
