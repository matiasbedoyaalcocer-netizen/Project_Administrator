import { API } from '../api.js';

export default {
    tickets: [],
    container: null,

    async initData() {
        try {
            this.tickets = await API.getTickets();
        } catch(e) {
            console.error("Failed to load tickets", e);
            throw e;
        }
    },

    async render(container) {
        this.container = container;
        
        this.container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height: 60vh; color: var(--primary);">
                <i class='bx bx-loader-alt bx-spin' style='font-size: 4rem; margin-bottom: 20px;'></i>
                <h3 style="color:var(--text-main);">Descargando Gastos...</h3>
                <p style="color:var(--text-muted);">Cargando información segura.</p>
            </div>
        `;
        
        try {
            await this.initData();
            this.renderView();
        } catch(e) {
            this.container.innerHTML = `
                <div style="padding:40px; text-align:center; color: var(--danger);">
                    <i class='bx bx-error-alt' style="font-size:3rem;"></i>
                    <h2>Error de Conexión</h2>
                    <p>No se pudieron descargar los gastos. Verifica si Node está en ejecución.</p>
                </div>
            `;
        }
    },

    renderView() {
        let listHtml = '';
        if (this.tickets && this.tickets.length > 0) {
            const sorted = [...this.tickets].sort((a,b) => new Date(b.date) - new Date(a.date));
            sorted.forEach(t => {
                const dateStr = new Date(t.date).toLocaleDateString();
                const imageStr = t.image ? `<img src="${t.image}" class="receipt-thumbnail" data-src="${t.image}" style="object-fit:cover; border-radius:12px; height:120px; width:100px; cursor:pointer;" title="Click para ver en grande">` : `<i class='bx bx-receipt' style="font-size:3rem; color:var(--text-muted);"></i>`;
                
                listHtml += `
                    <div class="list-item" style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div style="display:flex; gap: 15px;">
                            ${imageStr}
                            <div class="list-info">
                                <h4 style="font-size: 1.2rem; font-weight:800; margin-bottom:5px;">${t.concept}</h4>
                                <p style="font-size: 0.95rem;">${dateStr} <br><span class="badge" style="margin-top:5px; display:inline-block; font-size:0.8rem; background:#fee2e2; color:var(--danger);">${t.category}</span></p>
                            </div>
                        </div>
                        <div style="display:flex; flex-direction:column; align-items:flex-end;">
                            <div class="list-value text-danger" style="font-size: 1.6rem; color: var(--danger);">-$${t.amount.toFixed(2)}</div>
                            <button class="btn btn-delete-ticket" data-id="${t.id}" style="background-color:var(--danger); font-size: 0.8rem; padding: 6px 12px; margin-top:10px;"><i class='bx bx-trash'></i> Borrar</button>
                        </div>
                    </div>
                `;
            });
        } else {
            listHtml = `
                <div class="empty-state">
                    <i class='bx bx-receipt'></i>
                    <p>No has subido ningún gasto de caja rápida.</p>
                </div>
            `;
        }

        const html = `
            <div id="tickets-list-view">
                <div class="tip-banner">
                    <i class='bx bx-camera'></i>
                    <div>
                        <h3>Caja y Gastos Corrientes</h3>
                        <p>Anota y carga sueldos, impuestos o tickets en efectivo sin remito. Todo gasto documentado aquí afecta directamente la Tasa de Ganancias final.</p>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-title">
                        <i class='bx bx-history'></i> Salidas de Caja
                    </div>
                    <div id="tickets-list-container">
                        ${listHtml}
                    </div>
                </div>

                <button class="fab" id="btn-new-ticket" aria-label="Ingresar Gasto Rápido">
                    <i class='bx bx-plus'></i>
                </button>
            </div>

            <div id="tickets-form-view" style="display: none;">
                <div class="card">
                    <div class="card-title">
                        <i class='bx bx-upload'></i> Ingresar Gasto al ERP
                    </div>
                    <div class="form-group">
                        <label>Concepto de Salida</label>
                        <input type="text" id="ticket-concept" class="form-control" placeholder="Ej. Pago Agua, Compra Baterías...">
                    </div>
                    <div class="form-group">
                        <label>Categoría</label>
                        <select id="ticket-category" class="form-control">
                            <option value="Servicios">Luz/Agua/Gas</option>
                            <option value="Impuestos">DGI / Rentas / Monotributo</option>
                            <option value="Sueldos">Salarios / Honorarios</option>
                            <option value="Mantenimiento">Reparaciones Básicas</option>
                            <option value="General" selected>Gastos Generales / Varios</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Monto Abonado ($)</label>
                        <input type="number" step="0.01" id="ticket-amount" class="form-control" placeholder="0.00">
                    </div>
                    <div class="form-group">
                        <label>Foto Ciber-Comprobante (Opcional)</label>
                        <input type="file" id="ticket-image" class="form-control" accept="image/*">
                        <small style="color:var(--text-muted); display:block; margin-top:5px;">El ticket se subirá directamente y de forma segura para no perderlo.</small>
                        <div id="ocr-status" style="display:none; margin-top:10px; font-weight:600; font-size: 0.9rem; color: var(--primary);">
                            <i class='bx bx-loader-alt bx-spin'></i> Analizando recibo con IA...
                        </div>
                    </div>
                    
                    <button class="btn" id="btn-save-ticket" style="background-color: var(--primary); margin-bottom: 12px; font-size:1.1rem; padding: 15px;">
                        <i class='bx bx-upload'></i> Registrar Gasto
                    </button>
                    <button class="btn btn-secondary" id="btn-cancel-ticket">Cancelar</button>
                </div>
            </div>
        `;

        this.container.innerHTML = html;
        this.bindEvents();
    },

    bindEvents() {
        const btnNew = document.getElementById('btn-new-ticket');
        const btnCancel = document.getElementById('btn-cancel-ticket');
        const btnSave = document.getElementById('btn-save-ticket');
        const viewList = document.getElementById('tickets-list-view');
        const viewForm = document.getElementById('tickets-form-view');

        document.querySelectorAll('.btn-delete-ticket').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm('¿Seguro quieres reportar como NULO este ticket? (Borrado Permanente)')) {
                    const id = e.currentTarget.dataset.id;
                    try {
                        e.currentTarget.innerHTML = '<i class="bx bx-loader bx-spin"></i>';
                        await API.deleteTicket(id);
                        await this.render(this.container);
                    } catch (err) {
                        alert("Error de validación eliminando el ticket. Reintenta.");
                        await this.render(this.container);
                    }
                }
            });
        });

        document.querySelectorAll('.receipt-thumbnail').forEach(img => {
            img.addEventListener('click', (e) => {
                const modal = document.getElementById('image-modal');
                const modalImg = document.getElementById('modal-image-content');
                if(modal && modalImg) {
                    modalImg.src = e.currentTarget.dataset.src;
                    modal.style.display = 'flex';
                }
            });
        });

        if(btnNew) {
            btnNew.addEventListener('click', () => {
                viewList.style.display = 'none';
                viewForm.style.display = 'block';
                document.getElementById('ticket-concept').value = '';
                document.getElementById('ticket-amount').value = '';
                document.getElementById('ticket-image').value = '';
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
                const concept = document.getElementById('ticket-concept').value;
                const category = document.getElementById('ticket-category').value;
                const amount = parseFloat(document.getElementById('ticket-amount').value);
                const fileInput = document.getElementById('ticket-image');

                if (!concept || isNaN(amount)) {
                    alert('Asigna un Monto y un Concepto válidos para emitir el pago.');
                    return;
                }

                btnSave.disabled = true;
                btnSave.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Guardando en el sistema...";

                const loadBase64 = (file) => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            let width = img.width;
                            let height = img.height;
                            const MAX_DIM = 1024;
                            if (width > height) {
                                if (width > MAX_DIM) {
                                    height *= MAX_DIM / width;
                                    width = MAX_DIM;
                                }
                            } else {
                                if (height > MAX_DIM) {
                                    width *= MAX_DIM / height;
                                    height = MAX_DIM;
                                }
                            }
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);
                            // Comprimir como WebP al 80% de calidad
                            resolve(canvas.toDataURL('image/webp', 0.8));
                        };
                        img.onerror = reject;
                        img.src = e.target.result;
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });

                let base64Image = null;
                if (fileInput.files && fileInput.files[0]) {
                    try {
                        base64Image = await loadBase64(fileInput.files[0]);
                    } catch(e) {
                         alert('Fallo decodificando el archivo imagen, será subido sin foto.');
                    }
                }

                const newTicket = {
                    id: Date.now(),
                    concept,
                    category,
                    amount,
                    date: new Date().toISOString(),
                    image: base64Image
                };

                try {
                    await API.saveTicket(newTicket);
                    await this.render(this.container);
                } catch(err) {
                    alert("Fallo emitiendo escritura. Verifica la conexión.");
                    btnSave.disabled = false;
                    btnSave.innerHTML = "<i class='bx bx-upload'></i> Registrar Gasto";
                }
            });
        }

        const fileInput = document.getElementById('ticket-image');
        if(fileInput) {
            fileInput.addEventListener('change', async (e) => {
                if (!e.target.files || !e.target.files[0]) return;
                
                const file = e.target.files[0];
                const ocrStatus = document.getElementById('ocr-status');
                const conceptInput = document.getElementById('ticket-concept');
                const amountInput = document.getElementById('ticket-amount');

                ocrStatus.style.display = 'block';
                ocrStatus.style.color = "var(--primary)";
                ocrStatus.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Analizando recibo con IA...";
                
                try {
                    const result = await Tesseract.recognize(file, 'spa', {
                        logger: m => {
                            if(m.status === 'recognizing text') {
                                ocrStatus.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Escaneando... ${Math.round(m.progress * 100)}%`;
                            }
                        }
                    });
                    
                    const text = result.data.text;
                    let finalAmount = null;
                    
                    // Regex para encontrar montos ($12.34, 12,34)
                    const amountMatches = text.match(/(?:TOTAL|IMPORTE)?\s*[\$\€]?\s*(\d+[.,]\d{2})/gi);
                    if (amountMatches) {
                         const amounts = amountMatches.map(m => {
                             const numStr = m.replace(/[^\d.,]/g, '').replace(',', '.');
                             return parseFloat(numStr);
                         }).filter(n => !isNaN(n));
                         if (amounts.length > 0) finalAmount = Math.max(...amounts);
                    } else {
                         const numMatches = text.match(/\b\d+([.,]\d{2})\b/g);
                         if (numMatches) {
                             const amounts = numMatches.map(m => parseFloat(m.replace(',', '.'))).filter(n => !isNaN(n));
                             if (amounts.length > 0) finalAmount = Math.max(...amounts);
                         }
                    }

                    if (finalAmount && !amountInput.value) {
                        amountInput.value = finalAmount.toFixed(2);
                    }

                    // Extraer concepto (primera línea >3 chars que no sea total)
                    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3 && !l.toLowerCase().includes('total'));
                    if (lines.length > 0) {
                        let vendor = lines[0];
                        vendor = vendor.charAt(0).toUpperCase() + vendor.slice(1).toLowerCase();
                        if (!conceptInput.value) {
                            conceptInput.value = vendor;
                        }
                    }

                    ocrStatus.innerHTML = "<i class='bx bx-check-circle'></i> Análisis IA completado";
                    ocrStatus.style.color = "#16a34a"; // Success color
                    setTimeout(() => { ocrStatus.style.display = 'none'; ocrStatus.style.color = "var(--primary)"; }, 4000);

                } catch(err) {
                    console.error("OCR Falló:", err);
                    ocrStatus.innerHTML = "<i class='bx bx-error-circle'></i> Error procesando imagen (IA no disponible)";
                    ocrStatus.style.color = "var(--danger)";
                    setTimeout(() => { ocrStatus.style.display = 'none'; ocrStatus.style.color = "var(--primary)"; }, 4000);
                }
            });
        }
    }
};
