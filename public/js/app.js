import DashboardView from './modules/dashboard.js';
import TicketsView from './modules/tickets.js';
import InventoryView from './modules/inventory.js';
import AnalysisView from './modules/analysis.js';
import SalesView from './modules/sales.js';
import ComparatorView from './modules/comparator.js';
import SettingsView from './modules/settings.js';

const App = {
    currentView: 'dashboard',
    tabsOrder: ['dashboard', 'sales', 'tickets', 'inventory', 'analysis'],
    deferredPrompt: null,
    
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.loadView(this.currentView);
    },
    
    cacheDOM() {
        this.sideNavItems = document.querySelectorAll('.side-menu .nav-item-side');
        this.bottomNavItems = document.querySelectorAll('.bottom-nav .nav-item-bottom');
        this.appContent = document.getElementById('app-content');
        this.pageTitle = document.getElementById('page-title');
        
        // PWA banner
        this.pwaBanner = document.getElementById('pwa-install-banner');
        this.pwaInstallBtn = document.getElementById('pwa-install-btn');
        this.pwaCloseBtn = document.getElementById('pwa-close-btn');
    },
    
    bindEvents() {
        // Navigation Clicks
        const navElements = [...this.sideNavItems, ...this.bottomNavItems];
        navElements.forEach(item => {
            item.addEventListener('click', (e) => {
                const target = e.currentTarget.dataset.target;
                if(target) {
                    e.preventDefault();
                    if(target !== this.currentView) {
                        this.navigateTo(target, true);
                    }
                }
            });
        });

        // Swipe Support
        let touchStartX = 0;
        let touchEndX = 0;

        this.appContent.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, {passive: true});

        this.appContent.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        }, {passive: true});

        // PWA Install Prompt handling
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            if(this.pwaBanner) this.pwaBanner.style.display = 'flex';
        });

        if(this.pwaInstallBtn) {
            this.pwaInstallBtn.addEventListener('click', async () => {
                if(this.pwaBanner) this.pwaBanner.style.display = 'none';
                if(this.deferredPrompt) {
                    this.deferredPrompt.prompt();
                    const { outcome } = await this.deferredPrompt.userChoice;
                    console.log(`User interaction with PWA prompt: ${outcome}`);
                    this.deferredPrompt = null;
                }
            });
        }
        
        if(this.pwaCloseBtn) {
            this.pwaCloseBtn.addEventListener('click', () => {
                if(this.pwaBanner) this.pwaBanner.style.display = 'none';
            });
        }
    },

    handleSwipe(start, end) {
        const threshold = 70; // min swipe distance
        if(start - end > threshold) {
            this.swipeTo(1); // Swipe left -> Next tab
        } else if(end - start > threshold) {
            this.swipeTo(-1); // Swipe right -> Prev tab
        }
    },

    swipeTo(direction) {
        const currentIndex = this.tabsOrder.indexOf(this.currentView);
        if(currentIndex === -1) return;
        const nextIndex = currentIndex + direction;
        
        if(nextIndex >= 0 && nextIndex < this.tabsOrder.length) {
            const dest = this.tabsOrder[nextIndex];
            this.navigateTo(dest, direction > 0 ? 'left' : 'right');
        }
    },

    navigateTo(targetView, direction) {
        if (direction === true) { 
            const curIdx = this.tabsOrder.indexOf(this.currentView);
            const tarIdx = this.tabsOrder.indexOf(targetView);
            direction = (tarIdx > curIdx) ? 'left' : 'right';
        }

        const animClass = direction === 'left' ? 'slide-in-right' : 'slide-in-left';
        
        // Retrigger animation
        this.appContent.classList.remove('slide-in-right', 'slide-in-left');
        void this.appContent.offsetWidth; // Force reflow
        this.appContent.classList.add(animClass);

        this.loadView(targetView);
        this.updateNav(targetView);
    },
    
    updateNav(targetView) {
        const allNavs = [...this.sideNavItems, ...this.bottomNavItems];
        allNavs.forEach(item => {
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
