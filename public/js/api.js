const API_URL = '/api';

export const API = {
    // --- INVENTORY ---
    async getProducts() {
        const res = await fetch(`${API_URL}/products`);
        if(!res.ok) throw new Error("Fallo de red");
        return res.json();
    },
    async saveProduct(prod) {
        const res = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prod)
        });
        return res.json();
    },
    async updateProduct(id, data) {
        const res = await fetch(`${API_URL}/products/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    // --- PURCHASES ---
    async getPurchases() {
        const res = await fetch(`${API_URL}/purchases`);
        if(!res.ok) throw new Error("Fallo de red");
        return res.json();
    },
    async savePurchase(purchase) {
        const res = await fetch(`${API_URL}/purchases`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(purchase)
        });
        return res.json();
    },

    // --- TICKETS ---
    async getTickets() {
        const res = await fetch(`${API_URL}/tickets`);
        if(!res.ok) throw new Error("Fallo de red");
        return res.json();
    },
    async saveTicket(ticket) {
        const res = await fetch(`${API_URL}/tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ticket)
        });
        return res.json();
    },
    async deleteTicket(id) {
        const res = await fetch(`${API_URL}/tickets/${id}`, { method: 'DELETE' });
        return res.json();
    }
};
