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
                        <div class="receipt-thumb btn-redownload-pdf" data-id="${s.id}" style="cursor:pointer;" title="Re-descargar PDF Documento">
                            <i class='bx bxs-file-pdf' style="color:var(--danger); font-size:1.8rem; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"></i>
                        </div>
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

        document.querySelectorAll('.btn-redownload-pdf').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'), 10);
                const purchase = this.purchases.find(p => p.id === id);
                if(purchase) {
                    const originalHTML = e.currentTarget.innerHTML;
                    e.currentTarget.innerHTML = "<i class='bx bx-loader-alt bx-spin' style='color:var(--primary); font-size:1.8rem;'></i>";
                    
                    // Add slight delay to allow UI to update the loading spinner before thread blocks
                    setTimeout(() => {
                        this.generateAndDownloadPDF(purchase, viewList, viewForm);
                        e.currentTarget.innerHTML = originalHTML;
                    }, 100);
                }
            });
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
        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert("Error: Librería jsPDF no encontrada en el sistema.");
            return;
        }
        
        const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
        const dateStr = new Date(purchaseObj.date).toLocaleDateString();

        // 1. Cabecera (Izquierda)
        doc.setTextColor(239, 68, 68); // #ef4444
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("Registro de Compra", 15, 20);
        
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Sistema ERP Interno - Consolidado", 15, 26);

        // Cabecera (Derecha)
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("COMPRA INGRESO", 195, 20, { align: 'right' });
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Folio: 0001-${purchaseObj.id.toString().slice(-6)}`, 195, 26, { align: 'right' });
        doc.text(`Fecha: ${dateStr}`, 195, 31, { align: 'right' });

        // Línea Divisoria Roja
        doc.setDrawColor(239, 68, 68);
        doc.setLineWidth(0.6);
        doc.line(15, 36, 195, 36);

        // 2. Proveedor
        doc.setTextColor(239, 68, 68);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("A FAVOR DEL PROVEEDOR/COMERCIO:", 15, 46);
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.text(purchaseObj.supplier || purchaseObj.client || 'Proveedor General', 15, 52);

        // 3. Tabla (Cabecera)
        doc.setFillColor(254, 242, 242); // #fef2f2 background
        doc.rect(15, 60, 180, 10, 'F');
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Descripción", 18, 66.5);
        doc.text("Cant.", 100, 66.5, { align: 'center' });
        doc.text("Costo c/u", 140, 66.5, { align: 'right' });
        doc.text("Monto Total", 192, 66.5, { align: 'right' });

        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        doc.line(15, 70, 195, 70);

        // 4. Tabla (Ítems)
        doc.setFont("helvetica", "normal");
        let y = 77;
        
        purchaseObj.items.forEach(item => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            doc.text(item.name.substring(0, 45), 18, y);
            doc.text(item.qty.toString(), 100, y, { align: 'center' });
            doc.text(`$${item.price.toFixed(2)}`, 140, y, { align: 'right' });
            doc.text(`$${item.subtotal.toFixed(2)}`, 192, y, { align: 'right' });
            
            doc.setDrawColor(230, 230, 230);
            doc.line(15, y+3, 195, y+3);
            y += 10;
        });

        // 5. Totales (Footer)
        y += 10;
        if (y > 250) {
            doc.addPage();
            y = 20;
        }
        
        doc.setFontSize(11);
        doc.text("Subtotal:", 140, y);
        doc.text(`$${purchaseObj.subtotal.toFixed(2)}`, 192, y, { align: 'right' });
        
        y += 8;
        doc.text(`IVA Retenido (${purchaseObj.taxPercent}%):`, 140, y);
        doc.text(`$${purchaseObj.taxValue.toFixed(2)}`, 192, y, { align: 'right' });

        y += 8;
        doc.setDrawColor(220, 220, 220);
        doc.line(130, y-4, 195, y-4);
        
        doc.setTextColor(239, 68, 68);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("TOTAL PAGADO:", 135, y+3);
        doc.text(`$${purchaseObj.total.toFixed(2)}`, 192, y+3, { align: 'right' });

        // Save exactly with jsPDF without DOM interference
        doc.save(`Reporte_Compra_${purchaseObj.supplier.replace(/ /g, '_')}.pdf`);
        this.render(this.container);
    }
};
