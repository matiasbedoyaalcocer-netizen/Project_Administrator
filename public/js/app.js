import DashboardView from './modules/dashboard.js';
import TicketsView from './modules/tickets.js';
import InventoryView from './modules/inventory.js';
import AnalysisView from './modules/analysis.js';
import SalesView from './modules/sales.js';
import ComparatorView from './modules/comparator.js';
import SettingsView from './modules/settings.js';

const App = {
    currentView: 'dashboard',
    
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.loadView(this.currentView);
    },
    
    cacheDOM() {
        // En este layout permanente, el menú principal es el sidebar superior
        this.sideNavItems = document.querySelectorAll('.side-menu .nav-item-side');
        this.appContent = document.getElementById('app-content');
        this.pageTitle = document.getElementById('page-title');
    },
    
    bindEvents() {
        this.sideNavItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const target = e.currentTarget.dataset.target;
                if(target) {
                    e.preventDefault();
                    if(target !== this.currentView) {
                        this.loadView(target);
                        this.updateNav(target);
                    }
                }
            });
        });
    },
    
    updateNav(targetView) {
        this.sideNavItems.forEach(item => {
            if(item.dataset.target === targetView) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },
    
    loadView(viewName) {
        this.currentView = viewName;
        this.appContent.innerHTML = ''; 
        
        switch(viewName) {
            case 'dashboard':
                this.pageTitle.textContent = 'Panel General';
                DashboardView.render(this.appContent);
                break;
            case 'tickets':
                this.pageTitle.textContent = 'Gestión de Gastos';
                TicketsView.render(this.appContent);
                break;
            case 'inventory':
                this.pageTitle.textContent = 'Stock Actual';
                InventoryView.render(this.appContent);
                break;
            case 'analysis':
                this.pageTitle.textContent = 'Reporte Total';
                AnalysisView.render(this.appContent);
                break;
            case 'comparator':
                this.pageTitle.textContent = 'Comparador Histórico';
                ComparatorView.render(this.appContent);
                break;
            case 'sales':
                this.pageTitle.textContent = 'Ingreso de Compras';
                SalesView.render(this.appContent);
                break;
            case 'settings':
                this.pageTitle.textContent = 'Configuración General';
                SettingsView.render(this.appContent);
                break;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
