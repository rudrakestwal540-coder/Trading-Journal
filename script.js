class TradingJournal {
    constructor() {
        this.trades = JSON.parse(localStorage.getItem('tradingJournal')) || [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderTrades();
        this.updateStats();
        this.setDefaultDate();
    }

    bindEvents() {
        const form = document.getElementById('tradeForm');
        form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        document.getElementById('clearAll').addEventListener('click', () => this.clearAll());
        
        ['beforeImage', 'afterImage'].forEach(id => {
            document.getElementById(id).addEventListener('change', (e) => this.previewImage(e));
        });
    }

    setDefaultDate() {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('tradeDate').value = now.toISOString().slice(0, 16);
    }

    previewImage(event) {
        const file = event.target.files[0];
        const preview = document.getElementById(event.target.id.replace('Image', 'Preview'));
        
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const trade = {
            id: Date.now(),
            symbol: document.getElementById('symbol').value.toUpperCase(),
            date: document.getElementById('tradeDate').value,
            entryPrice: parseFloat(document.getElementById('entryPrice').value),
            exitPrice: parseFloat(document.getElementById('exitPrice').value),
            positionSize: parseFloat(document.getElementById('positionSize').value) || 1,
            pnl: parseFloat(document.getElementById('pnl').value) || 0,
            notes: document.getElementById('notes').value,
            beforeImage: await this.getImageData('beforeImage'),
            afterImage: await this.getImageData('afterImage'),
            createdAt: new Date().toISOString()
        };

        this.trades.unshift(trade);
        this.saveToStorage();
        this.renderTrades();
        this.updateStats();
        this.resetForm();
        this.showNotification('Trade saved successfully! ✅');
    }

    async getImageData(inputId) {
        const input = document.getElementById(inputId);
        if (input.files && input.files[0]) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(input.files[0]);
            });
        }
        return null;
    }

    resetForm() {
        document.getElementById('tradeForm').reset();
        document.getElementById('beforePreview').innerHTML = '';
        document.getElementById('afterPreview').innerHTML = '';
        this.setDefaultDate();
    }

    renderTrades() {
        const container = document.getElementById('tradesList');
        if (this.trades.length === 0) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #7f8c8d;"><i class="fas fa-inbox" style="font-size: 3em; margin-bottom: 20px;"></i><h3>No trades yet. Add your first trade!</h3></div>';
            return;
        }

        container.innerHTML = this.trades.map(trade => `
            <div class="trade-card" data-id="${trade.id}">
                <button class="delete-btn" onclick="journal.deleteTrade(${trade.id})">
                    <i class="fas fa-trash"></i>
                </button>
                <div class="trade-header">
                    <div class="symbol-badge">${trade.symbol}</div>
                    <div class="trade-date">${new Date(trade.date).toLocaleString()}</div>
                </div>
                
                <div class="trade-images">
                    ${trade.beforeImage ? `<img src="${trade.beforeImage}" class="trade-image" onclick="window.open('${trade.beforeImage}')">` : '<div class="trade-image" style="background:#f0f0f0; display:flex; align-items:center; justify-content:center; color:#999; border-radius:10px; font-size:12px;">No Before Image</div>'}
                    ${trade.afterImage ? `<img src="${trade.afterImage}" class="trade-image" onclick="window.open('${trade.afterImage}')">` : '<div class="trade-image" style="background:#f0f0f0; display:flex; align-items:center; justify-content:center; color:#999; border-radius:10px; font-size:12px;">No After Image</div>'}
                </div>
                
                <div class="trade-stats">
                    <div class="stat-item">
                        <div class="stat-label">Entry</div>
                        <div class="stat-value">$${trade.entryPrice?.toFixed(4) || 'N/A'}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Exit</div>
                        <div class="stat-value">$${trade.exitPrice?.toFixed(4) || 'N/A'}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Size</div>
                        <div class="stat-value">${trade.positionSize}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">P&L</div>
                        <div class="stat-value ${trade.pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}">$${trade.pnl?.toFixed(2) || '0.00'}</div>
                    </div>
                </div>
                
                ${trade.notes ? `<div class="trade-notes">${trade.notes}</div>` : ''}
            </div>
        `).join('');
    }

    deleteTrade(id) {
        if (confirm('Are you sure you want to delete this trade?')) {
            this.trades = this.trades.filter(trade => trade.id !== id);
            this.saveToStorage();
            this.renderTrades();
            this.updateStats();
            this.showNotification('Trade deleted! 🗑️');
        }
    }

    clearAll() {
        if (confirm('Delete ALL trades? This cannot be undone!')) {
            this.trades = [];
            this.saveToStorage();
            this.renderTrades();
            this.updateStats();
            this.showNotification('All trades cleared! 🧹');
        }
    }

    updateStats() {
        const totalTrades = this.trades.length;
        const winningTrades = this.trades.filter(t => t.pnl > 0).length;
        const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : 0;

        document.getElementById('totalTrades').textContent = `Total Trades: ${totalTrades}`;
        document.getElementById('winRate').textContent = `Win Rate: ${winRate}%`;
    }

    saveToStorage() {
        localStorage.setItem('tradingJournal', JSON.stringify(this.trades));
    }

    showNotification(message) {
        // Simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; background: #27ae60; 
            color: white; padding: 15px 20px; border-radius: 10px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.3); z-index: 10000;
            font-weight: 600; transform: translateX(400px); transition: all 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.style.transform = 'translateX(0)', 100);
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }
}

// Initialize the app
const journal = new TradingJournal();
