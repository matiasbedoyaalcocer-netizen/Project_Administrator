import { API } from '../api.js';

export default {
    render(container) {
        const html = `
            <div class="card">
                <div class="card-title">
                    <i class='bx bx-cog'></i> Configuración y Mantenimiento
                </div>
                
                <p style="font-size:1.1rem; color:var(--text-muted); margin-bottom: 30px;">
                    Desde aquí puedes administrar el sistema a nivel general y descargar respaldos vitales de tu negocio.
                </p>

                <!-- Archivo ZIP de Soportes -->
                <div style="border: 2px solid #e2e8f0; background: #f8fafc; border-radius: 16px; padding: 30px; margin-bottom: 25px;">
                    <h3 style="color: var(--text-main); font-size: 1.4rem; font-weight: 800; margin-bottom: 15px; display:flex; align-items:center; gap: 10px;">
                        <i class='bx bx-archive-in'></i> Exportar Comprobantes Visuales
                    </h3>
                    <p style="font-size: 1.1rem; color: var(--text-muted); margin-bottom: 25px; line-height: 1.5;">
                        Descarga un archivo cerrado (ZIP) recopilando todas las facturas y comprobantes fotografiados. El sistema organizará automáticamente las imágenes en carpetas <b>por mes de emisión</b>.
                    </p>
                    <div style="display:flex; gap: 15px; align-items:center; flex-wrap: wrap;">
                        <button class="btn" id="btn-export-zip" style="width: auto; padding: 16px 25px; background-color: #10b981; font-size: 1.1rem;">
                            <i class='bx bx-archive-out'></i> Generar y Descargar (ZIP)
                        </button>
                        <span id="zip-status" style="font-weight: 600; color: #10b981;"></span>
                    </div>
                </div>

                <!-- Reseteo Factory -->
                <div style="border: 2px solid #fecaca; background: #fef2f2; border-radius: 16px; padding: 30px;">
                    <h3 style="color: var(--danger); font-size: 1.4rem; font-weight: 800; margin-bottom: 15px; display:flex; align-items:center; gap: 10px;">
                        <i class='bx bx-error-triangle'></i> Zona de Peligro: Reseteo Total
                    </h3>
                    <p style="font-size: 1.1rem; color: #991b1b; margin-bottom: 25px; line-height: 1.5;">
                        Esta opción limpiará absolutamente todo el ERP. Borrará todo el Inventario, todas las Compras, el Historial del Comparador de Precios y los Tickets rápidos. <b>Esta acción está bloqueada en la nube y requerirá intervención en base de datos.</b>
                    </p>
                    <button class="btn" id="btn-reset-data" style="background-color: var(--danger); width: auto; padding: 16px 25px; font-size:1.1rem;" disabled>
                        <i class='bx bx-lock-alt'></i> Reseteo Seguro Desde Nube 
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
                alert("Para reiniciar la aplicación Cloud debes vaciar tu base de datos MongoDB Atlas manualmente en Project Administrator.");
            });
        }

        const btnExportZip = document.getElementById('btn-export-zip');
        const zipStatus = document.getElementById('zip-status');
        if (btnExportZip) {
            btnExportZip.addEventListener('click', async () => {
                if (!window.JSZip) {
                    alert("Error: Librería JSZip no encotrada. Verifica conexión.");
                    return;
                }
                
                btnExportZip.disabled = true;
                zipStatus.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Extrayendo imágenes conectadas...";
                try {
                    const tickets = await API.getTickets();
                    const zip = new window.JSZip();
                    let imgCount = 0;
                    
                    tickets.forEach(t => {
                        if (t.image && t.image.startsWith('data:image')) {
                            const base64Data = t.image.split(',')[1];
                            const date = new Date(t.date);
                            const folderName = `${date.getFullYear()}_${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                            const sanitizedConcept = (t.concept || 'Ticket').replace(/[^a-zA-Z0-9]/g, '_');
                            
                            let extension = 'png';
                            if(t.image.includes('image/webp')) extension = 'webp';
                            else if(t.image.includes('image/jpeg')) extension = 'jpg';
                            
                            const fileName = `${date.getDate()}_${sanitizedConcept}_$${t.amount}.${extension}`;
                            
                            zip.folder(folderName).file(fileName, base64Data, {base64: true});
                            imgCount++;
                        }
                    });
                    
                    if (imgCount === 0) {
                        alert("No hay imágenes de comprobantes almacenadas en la base de datos.");
                        btnExportZip.disabled = false;
                        zipStatus.innerHTML = "";
                        return;
                    }

                    zipStatus.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Compilando archivos...";
                    const content = await zip.generateAsync({type: 'blob'});
                    
                    const url = URL.createObjectURL(content);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Comprobantes_SistemaERP_${new Date().toLocaleDateString().replace(/\//g,'-')}.zip`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    zipStatus.innerHTML = `<i class='bx bx-check-circle'></i> ¡${imgCount} fotos exportadas!`;
                } catch(e) {
                    console.error(e);
                    alert("Error generando el respaldo en ZIP. Verifica consola.");
                    zipStatus.innerHTML = "";
                }
                
                btnExportZip.disabled = false;
                setTimeout(() => { if(zipStatus) zipStatus.innerHTML = ""; }, 6000);
            });
        }
    }
};
