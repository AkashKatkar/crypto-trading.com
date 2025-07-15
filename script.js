// Crypto Market Options Game - Main JavaScript
class CryptoOptionsGame {
    constructor() {
        this.currentPrice = 0;
        this.priceHistory = [];
        this.userStats = {
            totalTrades: 0,
            wins: 0,
            losses: 0,
            profitLoss: 0,
            rank: '-'
        };
        this.tradeHistory = [];
        this.activeTrades = [];
        this.leaderboard = [];
        this.chart = null;
        this.countdownInterval = null;
        this.dataUpdateInterval = null;
        this.callOptions = [];
        this.putOptions = [];
        this.lastSyncTime = null;
        this.syncInterval = null;
        this.lastLargeMove = null;
        
        // Trading interface state
        this.selectedOption = null;
        this.existingPosition = null;
        this.currentTradeType = 'buy'; // Default to buy
        this.currentOrderType = 'market'; // Default to market
        this.modalPriceInterval = null;
        this.closePositionInterval = null;
        this.userModifiedPrice = false; // Track if user manually modified price
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCrossTabSync();
        this.loadAllData();
        
        // Check which page we're on and initialize accordingly
        const currentPage = this.getCurrentPage();
        
        if (currentPage === 'dashboard' || currentPage === 'trading') {
            // Initialize market data and ensure synchronization
            this.initializeMarketData();
            
            // Initialize price data and options for dashboard and trading pages
            if (!this.callOptions.length || !this.putOptions.length) {
        this.generateDailyOptions();
            }
            
        this.updateCountdown();
        
        // Start countdown timer
        this.countdownInterval = setInterval(() => {
            this.updateCountdown();
        }, 1000);
        
        // Update full market data every 30 seconds
        this.dataUpdateInterval = setInterval(() => {
            this.updateMarketData();
        }, 30000);
        
        // Update price every second for realistic simulation
        this.priceUpdateInterval = setInterval(() => {
            this.updatePriceOnly();
            // Also update options prices and positions every second for real-time fluctuations
            if (this.getCurrentPage() === 'trading') {
                this.updateOptionsPrices();
                this.updateCurrentPositions(); // Update positions P&L in real-time
            }
        }, 1000);
            
            // Sync all data every 10 seconds to ensure consistency
            this.syncInterval = setInterval(() => {
                this.syncAllData();
            }, 10000);
        
        // Initial data load
        this.updateMarketData();
    }

        if (currentPage === 'dashboard') {
            // Initialize chart only on dashboard
            console.log('Initializing chart on dashboard page');
            this.initializeChart();
            
            // Ensure chart gets initial data
            setTimeout(() => {
                if (this.chart && this.priceHistory.length > 0) {
                    console.log('Updating chart with initial data');
                    this.updateChart();
                }
            }, 100);
        }
        
        if (currentPage === 'leaderboard') {
            // Initialize leaderboard only on leaderboard page
            this.updateLeaderboard();
        }
    }

    // Comprehensive data synchronization system
    syncAllData() {
        try {
            // Update all data timestamps
            this.lastSyncTime = new Date();
            
            // Ensure price history is consistent
            if (this.priceHistory.length > 0) {
                const lastPrice = this.priceHistory[this.priceHistory.length - 1];
                if (Math.abs(lastPrice.price - this.currentPrice) > 0.01) {
                    // Add current price to history if it's different
                    this.priceHistory.push({
                        time: new Date(),
                        price: this.currentPrice
                    });
                }
            }
            
            // Update options prices to match current market conditions
            if (this.callOptions.length > 0 && this.putOptions.length > 0) {
                this.updateOptionsPrices();
            }
            
            // Update all displays
            this.updateAllDisplays();
            
            // Save all data
            this.saveAllData();
            
            console.log('Data synchronized successfully at:', this.lastSyncTime);
        } catch (error) {
            console.error('Error syncing data:', error);
        }
    }

    updateAllDisplays() {
        // Update price display
        this.updatePriceDisplay({
            price: this.currentPrice,
            change: this.calculate24hChange(),
            volume: this.generateVolume(this.currentPrice),
            marketCap: this.currentPrice * 19500000
        });
        
        // Update options chain
        this.renderOptionsChain();
        
        // Update chart if on dashboard and chart exists
        if (this.getCurrentPage() === 'dashboard' && this.chart && this.priceHistory.length > 0) {
            this.updateChart();
        }
        
        // Update user stats
        this.updateUserStats();
        
        // Update trade history
        this.updateTradeHistory();

        // Update current positions
        this.updateCurrentPositions();
    }

    loadAllData() {
        try {
            // Load user data
            this.loadUserData();
            
            // Load market data
            this.loadMarketData();
            
            // Validate and fix data consistency
            this.validateDataConsistency();
            
            console.log('All data loaded successfully');
        } catch (error) {
            console.error('Error loading data:', error);
            // Initialize with default data if loading fails
            this.initializeDefaultData();
        }
    }

    loadMarketData() {
        const savedMarketData = localStorage.getItem('cryptoOptionsMarketData');
        if (savedMarketData) {
            try {
                const marketData = JSON.parse(savedMarketData);
                this.currentPrice = marketData.currentPrice || 45000;
                
                // Convert time strings back to Date objects
                this.priceHistory = (marketData.priceHistory || []).map(point => ({
                    time: new Date(point.time),
                    price: point.price
                }));
                
                this.callOptions = marketData.callOptions || [];
                this.putOptions = marketData.putOptions || [];
                this.lastSyncTime = marketData.lastSyncTime ? new Date(marketData.lastSyncTime) : null;
                this.lastLargeMove = marketData.lastLargeMove || null;
                
                // Ensure we have some price history
                if (this.priceHistory.length === 0) {
                    this.priceHistory = [{
                        time: new Date(),
                        price: this.currentPrice
                    }];
                }
            } catch (error) {
                console.error('Error parsing market data:', error);
                this.initializeDefaultData();
            }
        }
    }

    validateDataConsistency() {
        // Ensure current price is valid
        if (!this.currentPrice || this.currentPrice <= 0) {
            this.currentPrice = 45000 + (Math.random() - 0.5) * 2000;
        }
        
        // Ensure price history is valid and contains proper Date objects
        if (!Array.isArray(this.priceHistory) || this.priceHistory.length === 0) {
            this.priceHistory = [{
                time: new Date(),
                price: this.currentPrice
            }];
        } else {
            // Validate and fix each price history entry
            this.priceHistory = this.priceHistory.map(point => {
                if (!point || typeof point.price !== 'number') {
                    return {
                        time: new Date(),
                        price: this.currentPrice
                    };
                }
                
                // Ensure time is a Date object
                const time = point.time instanceof Date ? point.time : new Date(point.time);
                if (isNaN(time.getTime())) {
                    return {
                        time: new Date(),
                        price: point.price
                    };
                }
                
                return {
                    time: time,
                    price: point.price
                };
            });
        }
        
        // Ensure options data is valid
        if (!Array.isArray(this.callOptions) || !Array.isArray(this.putOptions)) {
            this.callOptions = [];
            this.putOptions = [];
        }
        
        // Ensure user stats are valid
        if (!this.userStats || typeof this.userStats !== 'object') {
            this.userStats = {
                totalTrades: 0,
                wins: 0,
                losses: 0,
                profitLoss: 0,
                rank: '-'
            };
        }
        
        // Ensure trade history is valid
        if (!Array.isArray(this.tradeHistory)) {
            this.tradeHistory = [];
        }
        
        // Ensure active trades is valid
        if (!Array.isArray(this.activeTrades)) {
            this.activeTrades = [];
        }
    }

    initializeDefaultData() {
        this.currentPrice = 45000 + (Math.random() - 0.5) * 2000;
        this.priceHistory = [{
            time: new Date(),
            price: this.currentPrice
        }];
        this.callOptions = [];
        this.putOptions = [];
        this.lastSyncTime = new Date();
    }

    saveAllData() {
        try {
            // Save user data
            this.saveUserData();
            
            // Save market data
            this.saveMarketData();
            
            // Broadcast data change to other tabs
            this.broadcastDataChange();
            
            console.log('All data saved successfully');
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    broadcastDataChange() {
        try {
            // Broadcast data change to other tabs using localStorage event
            const event = new StorageEvent('storage', {
                key: 'cryptoOptionsDataChange',
                newValue: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    currentPrice: this.currentPrice,
                    lastSyncTime: this.lastSyncTime ? this.lastSyncTime.toISOString() : null
                }),
                url: window.location.href
            });
            window.dispatchEvent(event);
        } catch (error) {
            console.error('Error broadcasting data change:', error);
        }
    }

    setupCrossTabSync() {
        // Listen for data changes from other tabs
        window.addEventListener('storage', (event) => {
            if (event.key === 'cryptoOptionsDataChange' && event.newValue) {
                try {
                    const data = JSON.parse(event.newValue);
                    const dataTime = new Date(data.timestamp);
                    const currentTime = new Date();
                    
                    // Only sync if the data is recent (within 5 seconds)
                    if (currentTime - dataTime < 5000) {
                        this.loadMarketData();
                        this.updateAllDisplays();
                        console.log('Data synced from other tab');
                    }
                } catch (error) {
                    console.error('Error syncing from other tab:', error);
                }
            }
        });
    }

    initializeMarketData() {
        // Market data is already loaded in loadAllData()
        // Just ensure options are generated if needed and update displays
        if (this.callOptions.length > 0 && this.putOptions.length > 0) {
            this.updateOptionsPrices();
        }
        
        // Update all displays
        this.updateAllDisplays();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('dashboard.html') || path === '/' || path === '/index.html') {
            return 'dashboard';
        } else if (path.includes('trading.html')) {
            return 'trading';
        } else if (path.includes('education.html')) {
            return 'education';
        } else if (path.includes('leaderboard.html')) {
            return 'leaderboard';
        }
        return 'dashboard'; // Default
    }

    setupEventListeners() {
        // Mobile navigation toggle
        const navToggle = document.getElementById('navToggle');
        if (navToggle) {
            navToggle.addEventListener('click', () => {
                document.getElementById('navMenu').classList.toggle('active');
            });
        }

                // Chart period controls removed - using default chart only

        // Leaderboard tabs (only on leaderboard page)
        const leaderboardTabs = document.querySelectorAll('.leaderboard-tabs .tab-btn');
        if (leaderboardTabs.length > 0) {
            leaderboardTabs.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.updateLeaderboardPeriod(e.target.dataset.period);
            });
        });
        }

        // Modal events (on all pages)
        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
            this.closeModal();
        });
        }

        const cancelTrade = document.getElementById('cancelTrade');
        if (cancelTrade) {
            cancelTrade.addEventListener('click', () => {
            this.closeModal();
        });
        }

        const confirmTrade = document.getElementById('confirmTrade');
        if (confirmTrade) {
            confirmTrade.addEventListener('click', () => {
            this.executeTrade();
        });
        }

        // Close modal on outside click
        const tradeModal = document.getElementById('tradeModal');
        if (tradeModal) {
            tradeModal.addEventListener('click', (e) => {
            if (e.target.id === 'tradeModal') {
                this.closeModal();
            }
        });
        }

        // Tooltip events (on all pages)
        document.addEventListener('mouseover', (e) => {
            if (e.target.dataset.tooltip) {
                this.showTooltip(e.target, e.target.dataset.tooltip);
            }
        });

        document.addEventListener('mouseout', () => {
            this.hideTooltip();
        });

        // Manual refresh button (only on dashboard)
        const refreshData = document.getElementById('refreshData');
        if (refreshData) {
            refreshData.addEventListener('click', () => {
            this.updateMarketData();
        });
    }

        // Test chart button removed

        // Clear data button (for debugging)
        const clearData = document.getElementById('clearData');
        if (clearData) {
            clearData.addEventListener('click', () => {
                if (confirm('Clear all stored data and start fresh?')) {
                    this.clearAllData();
                }
            });
        }
    }

    updatePriceOnly() {
        // Generate realistic simulated cryptocurrency price movement
        const oldPrice = this.currentPrice;
        const newPrice = this.generateRealisticPrice(oldPrice);
        
        this.currentPrice = newPrice;
        
        // Add to price history
        this.priceHistory.push({
            time: new Date(),
            price: newPrice
        });

        // Keep only last 250 data points (more than needed for chart)
        if (this.priceHistory.length > 250) {
            this.priceHistory.shift();
        }

        // Update price display with animation
        this.updatePriceOnlyDisplay(newPrice, oldPrice);
        
        // Update options prices based on new market conditions
        this.updateOptionsPrices();
        
        // Update chart if on dashboard
        if (this.getCurrentPage() === 'dashboard' && this.chart) {
        this.updateChart();
        }
        
        // Check active trades
        this.checkActiveTrades();
        
        // Save data (but don't sync all displays to avoid performance issues)
        this.saveMarketData();
    }

    updateMarketData() {
        // Generate realistic simulated market data
        const marketData = this.generateRealisticMarketData();
        
        this.currentPrice = marketData.price;
        this.priceHistory.push({
            time: new Date(),
            price: marketData.price
        });

        // Keep only last 250 data points (more than needed for chart)
        if (this.priceHistory.length > 250) {
            this.priceHistory.shift();
        }
        
        // Regenerate options with new market data
        this.generateDailyOptions();
        
        // Sync all data and update displays
        this.syncAllData();
        
        // Update connection status
        this.updateConnectionStatus('simulated');
        
        // Hide loading state
        this.showLoadingState(false);
    }

    generateRealisticPrice(currentPrice) {
        if (!currentPrice) {
            return 45000 + (Math.random() - 0.5) * 2000; // Start between $44,000-$46,000
        }
        
        // Track time for larger moves
        const now = Date.now();
        if (!this.lastLargeMove) {
            this.lastLargeMove = now;
        }
        
        // Check if it's time for a larger move (every 30-60 minutes)
        const timeSinceLastLargeMove = now - this.lastLargeMove;
        const minutesSinceLastMove = timeSinceLastLargeMove / (1000 * 60);
        
        // 30-60% chance of large move every 30-60 minutes
        const shouldMakeLargeMove = minutesSinceLastMove >= 30 && 
                                   minutesSinceLastMove <= 60 && 
                                   Math.random() < 0.4; // 40% chance
        
        let change;
        
        if (shouldMakeLargeMove) {
            // Large move: 0.8% to 1.5% in either direction
            const largeMoveDirection = Math.random() > 0.5 ? 1 : -1;
            const largeMoveSize = 0.008 + Math.random() * 0.007; // 0.8% to 1.5%
            change = largeMoveDirection * largeMoveSize;
            this.lastLargeMove = now;
            console.log(`Large move: ${(change * 100).toFixed(2)}% after ${minutesSinceLastMove.toFixed(1)} minutes`);
        } else {
            // Normal small fluctuations: 0.02% to 0.08% (much smaller)
            const baseVolatility = 0.0002; // 0.02% base volatility
            const randomFactor = Math.random() * 0.0006; // Additional 0-0.06%
            const volatility = baseVolatility + randomFactor;
            
            // Add small trend and momentum
            const trend = Math.sin(now / 500000) * 0.0001; // Very small trend
            const momentum = this.calculateMomentum() * 0.1; // Reduced momentum impact
            
            // Combine factors
            change = (Math.random() - 0.5) * volatility + trend + momentum;
        }
        
        const newPrice = currentPrice * (1 + change);
        
        // Ensure price stays within reasonable bounds
        return Math.max(30000, Math.min(80000, newPrice));
    }

    generateRealisticMarketData() {
        const price = this.generateRealisticPrice(this.currentPrice);
        const change = this.calculate24hChange();
        const volume = this.generateVolume(price);
        const marketCap = price * 19500000; // Approximate BTC circulation
        
        return {
            price: price,
            change: change,
            volume: volume,
            marketCap: marketCap
        };
    }

    calculateMomentum() {
        if (this.priceHistory.length < 3) return 0;
        
        const recent = this.priceHistory.slice(-3);
        const momentum = (recent[2].price - recent[0].price) / recent[0].price * 0.1;
        return momentum;
    }

    generateNewsImpact() {
        // Simulate news events that affect price
        const events = [
            { probability: 0.05, impact: 0.02 }, // Positive news
            { probability: 0.05, impact: -0.02 }, // Negative news
            { probability: 0.9, impact: 0 } // No significant news
        ];
        
        const random = Math.random();
        let cumulative = 0;
        
        for (const event of events) {
            cumulative += event.probability;
            if (random <= cumulative) {
                return event.impact;
            }
        }
        
        return 0;
    }

    calculate24hChange() {
        if (this.priceHistory.length < 24) {
            return (Math.random() - 0.5) * 0.1; // Random change if not enough history
        }
        
        const dayAgo = this.priceHistory[this.priceHistory.length - 24];
        const current = this.priceHistory[this.priceHistory.length - 1];
        
        return (current.price - dayAgo.price) / dayAgo.price;
    }

    generateVolume(price) {
        // Volume correlates with price movement
        const baseVolume = 30000000000; // $30B base volume
        const volatility = this.calculateVolatility();
        const volumeMultiplier = 1 + volatility * 2;
        
        return baseVolume * volumeMultiplier * (0.8 + Math.random() * 0.4);
    }

    updatePriceDisplay(data) {
        const priceElement = document.getElementById('currentPrice');
        const changeElement = document.getElementById('priceChange');
        const volumeElement = document.getElementById('volume');
        const marketCapElement = document.getElementById('marketCap');

        // Update price with animation (if element exists)
        if (priceElement) {
        priceElement.textContent = `$${data.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        priceElement.classList.add('pulse');
        setTimeout(() => priceElement.classList.remove('pulse'), 1000);
        }

        // Update change (if element exists)
        if (changeElement) {
        const changePercent = (data.change * 100).toFixed(2);
        const changeText = `${data.change >= 0 ? '+' : ''}${changePercent}%`;
        changeElement.textContent = changeText;
        changeElement.className = `price-change ${data.change >= 0 ? 'positive' : 'negative'}`;
        }

        // Update volume and market cap (if elements exist)
        if (volumeElement) {
        volumeElement.textContent = `$${(data.volume / 1000000000).toFixed(1)}B`;
        }
        if (marketCapElement) {
        marketCapElement.textContent = `$${(data.marketCap / 1000000000).toFixed(1)}B`;
        }
        
        // Add live indicator
        this.addLiveIndicator();
    }

    showLoadingState(loading) {
        const priceElement = document.getElementById('currentPrice');
        const changeElement = document.getElementById('priceChange');
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('.status-text');
        const refreshButton = document.getElementById('refreshData');
        
        if (loading) {
            if (priceElement) {
            priceElement.innerHTML = '<span class="loading"></span> Loading...';
            }
            if (changeElement) {
            changeElement.textContent = 'Updating...';
            }
            if (statusIndicator) {
            statusIndicator.className = 'status-indicator';
            }
            if (statusText) {
            statusText.textContent = 'Connecting...';
            }
            if (refreshButton) {
            refreshButton.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Refreshing...';
            refreshButton.disabled = true;
            }
        } else {
            if (refreshButton) {
            refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
            refreshButton.disabled = false;
            }
        }
    }

    updateConnectionStatus(status) {
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('.status-text');
        
        if (!statusIndicator || !statusText) return; // Exit if elements don't exist
        
        switch(status) {
            case 'connected':
                statusIndicator.className = 'status-indicator connected';
                statusText.textContent = 'Live Data';
                break;
            case 'simulated':
                statusIndicator.className = 'status-indicator connected';
                statusText.textContent = 'Simulated Market';
                break;
            case 'disconnected':
                statusIndicator.className = 'status-indicator disconnected';
                statusText.textContent = 'Simulated Data';
                break;
            case 'connecting':
                statusIndicator.className = 'status-indicator';
                statusText.textContent = 'Connecting...';
                break;
        }
    }

    updatePriceOnlyDisplay(newPrice, oldPrice) {
        const priceElement = document.getElementById('currentPrice');
        
        if (!priceElement) return; // Exit if element doesn't exist
        
        // Remove loading indicator if present
        const loadingElement = priceElement.querySelector('.loading');
        if (loadingElement) {
            loadingElement.remove();
        }
        
        // Update price with animation
        priceElement.textContent = `$${newPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        
        // Add color animation based on price change
        if (oldPrice && newPrice !== oldPrice) {
            priceElement.classList.remove('price-up', 'price-down');
            if (newPrice > oldPrice) {
                priceElement.classList.add('price-up');
                setTimeout(() => priceElement.classList.remove('price-up'), 1000);
                this.showPriceDirection('up');
            } else if (newPrice < oldPrice) {
                priceElement.classList.add('price-down');
                setTimeout(() => priceElement.classList.remove('price-down'), 1000);
                this.showPriceDirection('down');
            }
        }
        
        // Add live indicator
        this.addLiveIndicator();
        
        // Update last update time
        this.updateLastUpdateTime();
    }

    addLiveIndicator() {
        const priceElement = document.getElementById('currentPrice');
        if (!priceElement) return; // Exit if element doesn't exist
        
        if (!priceElement.querySelector('.live-indicator')) {
            const liveIndicator = document.createElement('span');
            liveIndicator.className = 'live-indicator';
            liveIndicator.innerHTML = ' <i class="fas fa-circle" style="color: #28a745; font-size: 0.5rem;"></i> LIVE';
            liveIndicator.style.fontSize = '0.75rem';
            liveIndicator.style.color = '#28a745';
            liveIndicator.style.fontWeight = '600';
            priceElement.appendChild(liveIndicator);
        }
    }

    updateLastUpdateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        
        // Update the status text to show last update time
        const statusText = document.querySelector('.status-text');
        if (statusText && statusText.textContent.includes('Live Data')) {
            statusText.textContent = `Live Data - Last: ${timeString}`;
        }
    }

    showPriceDirection(direction) {
        const priceElement = document.getElementById('currentPrice');
        if (!priceElement) return; // Exit if element doesn't exist
        
        // Remove existing direction indicator
        const existingIndicator = priceElement.querySelector('.direction-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Create new direction indicator
        const indicator = document.createElement('span');
        indicator.className = 'direction-indicator';
        indicator.innerHTML = direction === 'up' ? ' ↗' : ' ↘';
        indicator.style.color = direction === 'up' ? 'var(--success-color)' : 'var(--danger-color)';
        indicator.style.fontWeight = 'bold';
        indicator.style.fontSize = '0.8em';
        indicator.style.marginLeft = '0.5rem';
        
        priceElement.appendChild(indicator);
        
        // Remove indicator after 2 seconds
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.remove();
            }
        }, 2000);
    }

    generateDailyOptions() {
        this.callOptions = [];
        this.putOptions = [];
        
        // Calculate volatility based on recent price movements
        const volatility = this.calculateVolatility();
        
        // Generate realistic strike prices with $100 increments
        const basePrice = Math.round(this.currentPrice / 100) * 100; // Round to nearest $100
        const strikeIncrement = 100; // $100 increments
        
        // Generate 11 strike prices: 5 OTM, 1 ATM, 5 ITM
        const strikes = [];
        for (let i = -5; i <= 5; i++) {
            strikes.push(basePrice + (i * strikeIncrement));
        }
        
        // Sort strikes in ascending order for proper display
        strikes.sort((a, b) => a - b);
        
        // Generate call options (11 total: 5 OTM, 1 ATM, 5 ITM)
        for (let i = 0; i < 11; i++) {
            const strikePrice = strikes[i];
            const expiryHours = 24; // All options expire in 24 hours for simplicity
            const premium = this.calculateRealisticPremium(strikePrice, expiryHours, volatility, 'call');
            
            this.callOptions.push({
                id: `call_${i}`,
                type: 'call',
                strikePrice: strikePrice,
                expiry: expiryHours,
                premium: premium,
                description: `BTC Call ${strikePrice.toFixed(0)}`,
                volume: Math.floor(Math.random() * 2000) + 200,
                openInterest: Math.floor(Math.random() * 8000) + 1000,
                delta: this.calculateDelta(strikePrice, volatility, 'call'),
                gamma: this.calculateGamma(strikePrice, volatility),
                theta: this.calculateTheta(strikePrice, expiryHours, volatility, 'call'),
                vega: this.calculateVega(strikePrice, expiryHours, volatility)
            });
        }

        // Generate put options (11 total: 5 ITM, 1 ATM, 5 OTM)
        for (let i = 0; i < 11; i++) {
            const strikePrice = strikes[i];
            const expiryHours = 24; // All options expire in 24 hours for simplicity
            const premium = this.calculateRealisticPremium(strikePrice, expiryHours, volatility, 'put');
            
            this.putOptions.push({
                id: `put_${i}`,
                type: 'put',
                strikePrice: strikePrice,
                expiry: expiryHours,
                premium: premium,
                description: `BTC Put ${strikePrice.toFixed(0)}`,
                volume: Math.floor(Math.random() * 2000) + 200,
                openInterest: Math.floor(Math.random() * 8000) + 1000,
                delta: this.calculateDelta(strikePrice, volatility, 'put'),
                gamma: this.calculateGamma(strikePrice, volatility),
                theta: this.calculateTheta(strikePrice, expiryHours, volatility, 'put'),
                vega: this.calculateVega(strikePrice, expiryHours, volatility)
            });
        }

        this.renderOptionsChain();
    }

    calculateVolatility() {
        if (this.priceHistory.length < 2) return 0.02; // Default 2% volatility
        
        const returns = [];
        for (let i = 1; i < this.priceHistory.length; i++) {
            const return_ = (this.priceHistory[i].price - this.priceHistory[i-1].price) / this.priceHistory[i-1].price;
            returns.push(return_);
        }
        
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
        const volatility = Math.sqrt(variance);
        
        return Math.max(0.01, Math.min(0.05, volatility)); // Clamp between 1% and 5%
    }

    calculateRealisticPremium(strikePrice, expiryHours, volatility, type) {
        const timeToExpiry = expiryHours / 24; // Convert to days
        const moneyness = Math.log(strikePrice / this.currentPrice);
        
        // More realistic Black-Scholes inspired calculation
        const intrinsicValue = type === 'call' 
            ? Math.max(0, this.currentPrice - strikePrice)
            : Math.max(0, strikePrice - this.currentPrice);
        
        // Time value calculation with volatility smile
        const atmVolatility = volatility * (1 + Math.abs(moneyness) * 0.5);
        const timeValue = this.currentPrice * atmVolatility * Math.sqrt(timeToExpiry) * 0.15;
        
        // Add market sentiment factor
        const sentiment = this.calculateMarketSentiment();
        const sentimentAdjustment = 1 + sentiment * 0.2;
        
        const basePremium = Math.max(0.001, intrinsicValue + timeValue);
        return basePremium * sentimentAdjustment;
    }

    calculateMarketSentiment() {
        if (this.priceHistory.length < 10) return 0;
        
        const recent = this.priceHistory.slice(-10);
        const upMoves = recent.filter((_, i) => i > 0 && recent[i].price > recent[i-1].price).length;
        const downMoves = recent.filter((_, i) => i > 0 && recent[i].price < recent[i-1].price).length;
        
        return (upMoves - downMoves) / (upMoves + downMoves);
    }

    // Calculate option Greeks for more realistic pricing
    calculateDelta(strikePrice, volatility, type) {
        const moneyness = Math.log(strikePrice / this.currentPrice);
        const timeToExpiry = 1; // Simplified for daily options
        
        // Simplified delta calculation
        if (type === 'call') {
            return Math.max(0, Math.min(1, 0.5 + moneyness / (volatility * Math.sqrt(timeToExpiry))));
        } else {
            return Math.max(-1, Math.min(0, -0.5 + moneyness / (volatility * Math.sqrt(timeToExpiry))));
        }
    }

    calculateGamma(strikePrice, volatility) {
        const moneyness = Math.log(strikePrice / this.currentPrice);
        const timeToExpiry = 1;
        
        // Simplified gamma calculation
        return Math.exp(-Math.pow(moneyness, 2) / (2 * Math.pow(volatility, 2) * timeToExpiry)) / 
               (this.currentPrice * volatility * Math.sqrt(timeToExpiry));
    }

    calculateTheta(strikePrice, expiryHours, volatility, type) {
        const timeToExpiry = expiryHours / 24;
        const moneyness = Math.log(strikePrice / this.currentPrice);
        
        // Simplified theta calculation (time decay)
        const baseTheta = -this.currentPrice * volatility / (2 * Math.sqrt(timeToExpiry));
        return type === 'call' ? baseTheta : baseTheta;
    }

    calculateVega(strikePrice, expiryHours, volatility) {
        const timeToExpiry = expiryHours / 24;
        const moneyness = Math.log(strikePrice / this.currentPrice);
        
        // Simplified vega calculation (sensitivity to volatility)
        return this.currentPrice * Math.sqrt(timeToExpiry) * 
               Math.exp(-Math.pow(moneyness, 2) / (2 * Math.pow(volatility, 2) * timeToExpiry));
    }

    updateOptionsPrices() {
        if (!this.callOptions || !this.putOptions) return;
        
        const volatility = this.calculateVolatility();
        const sentiment = this.calculateMarketSentiment();
        
        // Get the last price change percentage to sync with main price movements
        let lastPriceChange = 0;
        if (this.priceHistory.length >= 2) {
            const lastPrice = this.priceHistory[this.priceHistory.length - 1].price;
            const previousPrice = this.priceHistory[this.priceHistory.length - 2].price;
            lastPriceChange = (lastPrice - previousPrice) / previousPrice;
        }
        
        // Calculate base price change percentage (similar to main price)
        const basePriceChange = lastPriceChange !== 0 ? lastPriceChange * 0.5 : (Math.random() - 0.5) * 0.02;
        
        // Update call options
        this.callOptions.forEach((option, i) => {
            // Calculate moneyness for ITM/OTM logic
            const moneyness = this.currentPrice - option.strikePrice;
            const isITM = moneyness > 0;
            const isATM = Math.abs(moneyness) < 50;
            
            let newPremium = this.calculateRealisticPremium(
                option.strikePrice, 
                option.expiry, 
                volatility, 
                'call'
            );
            
            // Apply ITM/OTM pricing logic
            if (isITM) {
                // ITM calls: Higher base premium + intrinsic value
                const intrinsicValue = Math.max(0, this.currentPrice - option.strikePrice);
                const timeValue = newPremium * 0.3; // 30% time value
                newPremium = intrinsicValue + timeValue;
                
                // Add depth-based pricing (deeper ITM = more expensive)
                const depthFactor = Math.abs(moneyness) / 1000; // How deep ITM
                newPremium *= (1 + depthFactor * 0.5); // Deeper ITM = 50% more expensive per $1000
            } else if (isATM) {
                // ATM calls: Standard pricing
                newPremium *= 1.2; // Slightly higher than OTM
            } else {
                // OTM calls: Lower base premium with distance-based pricing
                const otmDistance = Math.abs(moneyness) / 1000; // How far OTM
                const distanceDiscount = 1 - (otmDistance * 0.3); // Further OTM = cheaper
                newPremium *= Math.max(0.2, distanceDiscount); // Minimum 20% of base price
            }
            
            // Apply market sentiment
            newPremium *= (1 + sentiment * 0.1);
            
            // Apply logical price movement with ITM/OTM differences
            let callPriceChange = basePriceChange;
            if (isITM) {
                // ITM calls: More sensitive to price changes (higher delta)
                callPriceChange = basePriceChange * 1.5 + (Math.random() - 0.5) * 0.003;
            } else if (isATM) {
                // ATM calls: Standard sensitivity
                callPriceChange = basePriceChange + (Math.random() - 0.5) * 0.005;
            } else {
                // OTM calls: Less sensitive to price changes (lower delta)
                callPriceChange = basePriceChange * 0.5 + (Math.random() - 0.5) * 0.008;
            }
            
            newPremium *= (1 + callPriceChange);
            
            // Ensure premium doesn't go below minimum
            newPremium = Math.max(newPremium, 0.0001);
            
            option.premium = newPremium;
            
            // Update Greeks
            option.delta = this.calculateDelta(option.strikePrice, volatility, 'call');
            option.gamma = this.calculateGamma(option.strikePrice, volatility);
            option.theta = this.calculateTheta(option.strikePrice, option.expiry, volatility, 'call');
            option.vega = this.calculateVega(option.strikePrice, option.expiry, volatility);
            
            // Update volume and open interest
            option.volume += Math.floor(Math.random() * 10) - 5;
            option.volume = Math.max(50, option.volume);
            option.openInterest += Math.floor(Math.random() * 20) - 10;
            option.openInterest = Math.max(100, option.openInterest);
        });
        
        // Update put options (opposite movement to calls)
        this.putOptions.forEach((option, i) => {
            // Calculate moneyness for ITM/OTM logic
            const moneyness = option.strikePrice - this.currentPrice;
            const isITM = moneyness > 0;
            const isATM = Math.abs(moneyness) < 50;
            
            let newPremium = this.calculateRealisticPremium(
                option.strikePrice, 
                option.expiry, 
                volatility, 
                'put'
            );
            
            // Apply ITM/OTM pricing logic
            if (isITM) {
                // ITM puts: Higher base premium + intrinsic value
                const intrinsicValue = Math.max(0, option.strikePrice - this.currentPrice);
                const timeValue = newPremium * 0.3; // 30% time value
                newPremium = intrinsicValue + timeValue;
                
                // Add depth-based pricing (deeper ITM = more expensive)
                const depthFactor = Math.abs(moneyness) / 1000; // How deep ITM
                newPremium *= (1 + depthFactor * 0.5); // Deeper ITM = 50% more expensive per $1000
            } else if (isATM) {
                // ATM puts: Standard pricing
                newPremium *= 1.2; // Slightly higher than OTM
            } else {
                // OTM puts: Lower base premium with distance-based pricing
                const otmDistance = Math.abs(moneyness) / 1000; // How far OTM
                const distanceDiscount = 1 - (otmDistance * 0.3); // Further OTM = cheaper
                newPremium *= Math.max(0.2, distanceDiscount); // Minimum 20% of base price
            }
            
            // Apply market sentiment
            newPremium *= (1 + sentiment * 0.1);
            
            // Apply logical price movement with ITM/OTM differences
            let putPriceChange = -basePriceChange;
            if (isITM) {
                // ITM puts: More sensitive to price changes (higher delta)
                putPriceChange = -basePriceChange * 1.5 + (Math.random() - 0.5) * 0.003;
            } else if (isATM) {
                // ATM puts: Standard sensitivity
                putPriceChange = -basePriceChange + (Math.random() - 0.5) * 0.005;
            } else {
                // OTM puts: Less sensitive to price changes (lower delta)
                putPriceChange = -basePriceChange * 0.5 + (Math.random() - 0.5) * 0.008;
            }
            
            newPremium *= (1 + putPriceChange);
            
            // Ensure premium doesn't go below minimum
            newPremium = Math.max(newPremium, 0.0001);
            
            option.premium = newPremium;
            
            // Update Greeks
            option.delta = this.calculateDelta(option.strikePrice, volatility, 'put');
            option.gamma = this.calculateGamma(option.strikePrice, volatility);
            option.theta = this.calculateTheta(option.strikePrice, option.expiry, volatility, 'put');
            option.vega = this.calculateVega(option.strikePrice, option.expiry, volatility);
            
            // Update volume and open interest
            option.volume += Math.floor(Math.random() * 10) - 5;
            option.volume = Math.max(50, option.volume);
            option.openInterest += Math.floor(Math.random() * 20) - 10;
            option.openInterest = Math.max(100, option.openInterest);
        });
        
        // Re-render options chain with updated prices
        this.renderOptionsChain();
    }

    renderOptionsChain() {
        const chainContainer = document.getElementById('optionsChain');
        if (!chainContainer) return; // Exit if element doesn't exist
        
        // Clear container
        chainContainer.innerHTML = '';
        
        // Create options chain container
        const optionsChain = document.createElement('div');
        optionsChain.className = 'options-chain';
        
        // Add header for the options chain
        const headerRow = document.createElement('div');
        headerRow.className = 'options-chain-header';
        headerRow.innerHTML = `
            <div class="chain-col calls-header">CALLS</div>
            <div class="chain-col strike-header">STRIKE</div>
            <div class="chain-col puts-header">PUTS</div>
        `;
        optionsChain.appendChild(headerRow);
        
        // Create rows for each strike price
        for (let i = 0; i < this.callOptions.length; i++) {
            const callOption = this.callOptions[i];
            const putOption = this.putOptions[i];
            
            const row = document.createElement('div');
            row.className = 'options-chain-row';
            
            // Calculate moneyness for both options (CORRECT LOGIC)
            // For CALLS: ITM when current price > strike price, OTM when current price < strike price
            // For PUTS: ITM when current price < strike price, OTM when current price > strike price
            const callMoneyness = this.currentPrice - callOption.strikePrice;
            const putMoneyness = putOption.strikePrice - this.currentPrice;
            
            const callMoneynessClass = Math.abs(callMoneyness) < 50 ? 'atm' : callMoneyness > 0 ? 'itm' : 'otm';
            const putMoneynessClass = Math.abs(putMoneyness) < 50 ? 'atm' : putMoneyness > 0 ? 'itm' : 'otm';
            
            // Use single current price for options (fluctuates like main price)
            const callPrice = callOption.premium;
            const putPrice = putOption.premium;
            
            // Check if user has positions in these options
            const callPosition = this.activeTrades.find(trade => 
                trade.status === 'active' && 
                trade.option.id === callOption.id
            );
            const putPosition = this.activeTrades.find(trade => 
                trade.status === 'active' && 
                trade.option.id === putOption.id
            );
            
                        row.innerHTML = `
                <div class="chain-col call-option ${callMoneynessClass} ${callPosition ? 'has-position' : ''}">
                    <div class="option-data">
                        ${callPosition ? '<div class="position-indicator call">POSITION</div>' : ''}
                        <div class="option-price">
                            <span class="option-price-value">$${callPrice.toFixed(4)}</span>
                        </div>
                <div class="option-details">
                            <span class="volume">Vol: ${callOption.volume.toLocaleString()}</span>
                            <span class="oi">OI: ${callOption.openInterest.toLocaleString()}</span>
                </div>
                        <div class="greeks">
                            <span class="delta ${callOption.delta > 0 ? 'positive' : 'negative'}">Δ${callOption.delta.toFixed(3)}</span>
                            <span class="gamma">Γ${callOption.gamma.toFixed(4)}</span>
                        </div>
                        <button class="btn btn-sm btn-success trade-btn" data-option-id="${callOption.id}">
                            <i class="fas fa-arrow-up"></i> Call
                        </button>
                    </div>
                </div>
                <div class="chain-col strike-price ${callMoneynessClass}">
                    <div class="strike-value">$${callOption.strikePrice.toFixed(0)}</div>
                    <div class="moneyness-indicator ${callMoneynessClass}">${callMoneynessClass.toUpperCase()}</div>
                </div>
                <div class="chain-col put-option ${putMoneynessClass} ${putPosition ? 'has-position' : ''}">
                    <div class="option-data">
                        ${putPosition ? '<div class="position-indicator put">POSITION</div>' : ''}
                        <div class="option-price">
                            <span class="option-price-value">$${putPrice.toFixed(4)}</span>
                        </div>
                        <div class="option-details">
                            <span class="volume">Vol: ${putOption.volume.toLocaleString()}</span>
                            <span class="oi">OI: ${putOption.openInterest.toLocaleString()}</span>
                        </div>
                        <div class="greeks">
                            <span class="delta ${putOption.delta > 0 ? 'positive' : 'negative'}">Δ${putOption.delta.toFixed(3)}</span>
                            <span class="gamma">Γ${putOption.gamma.toFixed(4)}</span>
                        </div>
                        <button class="btn btn-sm btn-danger trade-btn" data-option-id="${putOption.id}">
                            <i class="fas fa-arrow-down"></i> Put
                        </button>
                    </div>
                </div>
            `;
            
            // Add click events to trade buttons
            const callBtn = row.querySelector('.call-option .trade-btn');
            const putBtn = row.querySelector('.put-option .trade-btn');
            
            callBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openTradeModal(callOption);
            });
            
            putBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openTradeModal(putOption);
            });
            
            optionsChain.appendChild(row);
        }
        
        // Add the chain to the container
        chainContainer.appendChild(optionsChain);
    }

    openTradeModal(option) {
        const modal = document.getElementById('tradeModal');
        const details = document.getElementById('tradeDetails');
        const confirmButton = document.getElementById('confirmTrade');
        
        // Check if user has an existing position in this option
        const existingPosition = this.activeTrades.find(trade => 
            trade.status === 'active' && 
            trade.option.id === option.id
        );
        
        // Calculate moneyness
        const moneyness = option.type === 'call' 
            ? this.currentPrice - option.strikePrice
            : option.strikePrice - this.currentPrice;
        
        const moneynessClass = Math.abs(moneyness) < 50 ? 'atm' : moneyness > 0 ? 'itm' : 'otm';
        
        // Calculate current P&L if position exists
        let currentPnl = 0;
        let pnlPercent = 0;
        if (existingPosition) {
            currentPnl = this.calculatePositionPnl(existingPosition);
            pnlPercent = ((currentPnl / (existingPosition.optionEntryPrice * 100)) * 100);
        }
        
        details.innerHTML = `
            <div class="trade-summary">
                <div class="trade-header">
                <h4>${option.description}</h4>
                    <div class="option-type-badge ${option.type}">${option.type.toUpperCase()}</div>
                    ${existingPosition ? '<span class="position-badge">CURRENT POSITION</span>' : ''}
                </div>
                
                ${existingPosition ? `
                <div class="position-summary">
                    <div class="position-pnl-display ${currentPnl >= 0 ? 'positive' : 'negative'}">
                        <span class="pnl-label">Current P&L:</span>
                        <span class="pnl-value">$${currentPnl.toFixed(2)} (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%)</span>
                    </div>
                    <div class="position-details">
                        <div class="price-row">
                            <span class="detail-label">Asset Entry:</span>
                            <span class="detail-value">$${existingPosition.entryPrice.toFixed(2)}</span>
                            <span class="detail-label">Current:</span>
                            <span class="detail-value">$${this.currentPrice.toFixed(2)}</span>
                        </div>
                        <div class="price-row">
                            <span class="detail-label">Option Entry:</span>
                            <span class="detail-value">$${existingPosition.optionEntryPrice.toFixed(4)}</span>
                            <span class="detail-label">Current:</span>
                            <span class="detail-value">$${this.getCurrentOptionPrice(existingPosition.option).toFixed(4)}</span>
                        </div>
                    </div>
                </div>
                ` : `
                <!-- Groww-style Trading Interface -->
                <div class="trading-interface">
                    <!-- Buy/Sell Toggle -->
                    <div class="trade-type-toggle">
                        <button class="toggle-btn buy-btn active" data-trade-type="buy">
                            <i class="fas fa-arrow-up"></i>
                            <span>BUY</span>
                        </button>
                        <button class="toggle-btn sell-btn" data-trade-type="sell">
                            <i class="fas fa-arrow-down"></i>
                            <span>SELL</span>
                        </button>
                    </div>
                    
                    <!-- Order Form -->
                    <div class="order-form">
                        <!-- Order Type Selection -->
                        <div class="form-group">
                            <label class="form-label">Order Type</label>
                            <div class="order-type-toggle">
                                <button class="type-btn market-btn active" data-order-type="market">
                                    <span>Market</span>
                                </button>
                                <button class="type-btn limit-btn" data-order-type="limit">
                                    <span>Limit</span>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Quantity Input -->
                        <div class="form-group">
                            <label class="form-label">Quantity (Lots)</label>
                            <div class="input-wrapper">
                                <input type="number" id="quantityInput" class="form-input" value="1" min="1" step="1" placeholder="Enter quantity">
                                <span class="input-suffix">× 75 = <span id="totalQuantity">75</span> contracts</span>
                            </div>
                            <div class="input-help">Minimum lot size: 1 (75 contracts)</div>
                        </div>
                        
                        <!-- Price Input (for Limit Orders) -->
                        <div class="form-group" id="priceGroup" style="display: none;">
                            <label class="form-label">Limit Price</label>
                            <div class="input-wrapper">
                                <span class="input-prefix">$</span>
                                <input type="number" id="priceInput" class="form-input" value="${option.premium.toFixed(4)}" min="0.0001" step="0.0001" placeholder="Enter price">
                            </div>
                            <div class="input-help">Current market price: $${option.premium.toFixed(4)}</div>
                        </div>
                        
                        <!-- Market Price Display (for Market Orders) -->
                        <div class="form-group" id="marketPriceGroup">
                            <label class="form-label">Market Price</label>
                            <div class="market-price-display">
                                <span class="price-value">$${option.premium.toFixed(4)}</span>
                                <span class="price-label">per contract</span>
                            </div>
                        </div>
                        
                        <!-- Margin Info (for Sell Orders) -->
                        <div class="form-group" id="marginGroup" style="display: none;">
                            <label class="form-label">Margin Required</label>
                            <div class="margin-display">
                                <span class="margin-value" id="marginValue">$0.00</span>
                                <span class="margin-label">(120% of premium)</span>
                            </div>
                        </div>
                        
                        <!-- Net Premium/Margin Calculation -->
                        <div class="calculation-summary">
                            <div class="calc-row">
                                <span class="calc-label" id="calcLabel">Net Premium:</span>
                                <span class="calc-value" id="calcValue">$${(option.premium * 75).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Validation Messages -->
                    <div class="validation-messages" id="validationMessages"></div>
                </div>
                `}
                
                <div class="trade-details-grid">
                    <div class="detail-section">
                        <h5>Basic Information</h5>
                    <div class="detail-item">
                        <span class="detail-label">Strike Price:</span>
                        <span class="detail-value">$${option.strikePrice.toFixed(2)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Current Price:</span>
                        <span class="detail-value">$${this.currentPrice.toFixed(2)}</span>
                    </div>
                    <div class="detail-item">
                            <span class="detail-label">Moneyness:</span>
                            <span class="detail-value ${moneynessClass}">${moneynessClass.toUpperCase()}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Expiry:</span>
                        <span class="detail-value">${option.expiry} hours</span>
                    </div>
                </div>
                    
                    <div class="detail-section">
                        <h5>Pricing</h5>
                        <div class="detail-item">
                            <span class="detail-label">Premium:</span>
                            <span class="detail-value">$${option.premium.toFixed(4)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Current Price:</span>
                            <span class="detail-value">$${option.premium.toFixed(4)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Volume:</span>
                            <span class="detail-value">${option.volume.toLocaleString()}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Open Interest:</span>
                            <span class="detail-value">${option.openInterest.toLocaleString()}</span>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h5>Greeks</h5>
                        <div class="detail-item">
                            <span class="detail-label">Delta:</span>
                            <span class="detail-value ${option.delta > 0 ? 'positive' : 'negative'}">${option.delta.toFixed(3)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Gamma:</span>
                            <span class="detail-value">${option.gamma.toFixed(4)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Theta:</span>
                            <span class="detail-value negative">${option.theta.toFixed(4)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Vega:</span>
                            <span class="detail-value">${option.vega.toFixed(4)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="trade-risk-info">
                    <div class="risk-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>Risk Warning:</strong> Options trading involves substantial risk and may result in the loss of your invested capital.
                    </div>
                </div>
            </div>
        `;
        
        // Update button text based on position
        if (confirmButton) {
            if (existingPosition) {
                confirmButton.textContent = 'Close Position';
                confirmButton.className = 'btn btn-danger';
            } else {
                confirmButton.textContent = 'Place Order';
                confirmButton.className = 'btn btn-primary';
                confirmButton.disabled = true; // Initially disabled until validation passes
            }
        }
        
        // Store selected option and existing position
        this.selectedOption = option;
        this.existingPosition = existingPosition;
        
        // Initialize trading interface if not existing position
        if (!existingPosition) {
            this.initializeTradingInterface();
        }
        
        modal.classList.add('active');
    }

    initializeTradingInterface() {
        // Trade type toggle (Buy/Sell)
        const buyBtn = document.querySelector('.buy-btn');
        const sellBtn = document.querySelector('.sell-btn');
        
        buyBtn.addEventListener('click', () => this.switchTradeType('buy'));
        sellBtn.addEventListener('click', () => this.switchTradeType('sell'));
        
        // Order type toggle (Market/Limit)
        const marketBtn = document.querySelector('.market-btn');
        const limitBtn = document.querySelector('.limit-btn');
        
        marketBtn.addEventListener('click', () => this.switchOrderType('market'));
        limitBtn.addEventListener('click', () => this.switchOrderType('limit'));
        
        // Quantity input
        const quantityInput = document.getElementById('quantityInput');
        quantityInput.addEventListener('input', () => this.updateCalculations());
        
        // Price input (for limit orders)
        const priceInput = document.getElementById('priceInput');
        priceInput.addEventListener('input', () => {
            this.userModifiedPrice = true; // Mark that user has modified the price
            this.updateCalculations();
            
            // Add visual indicator that price was manually modified
            priceInput.style.borderColor = '#f7931a';
            priceInput.style.borderWidth = '2px';
            setTimeout(() => {
                priceInput.style.borderColor = '';
                priceInput.style.borderWidth = '';
            }, 2000);
        });
        
        // Reset user modification flag when order type changes
        const resetUserModification = () => {
            this.userModifiedPrice = false;
        };
        
        marketBtn.addEventListener('click', resetUserModification);
        limitBtn.addEventListener('click', resetUserModification);
        
        // Initialize calculations
        this.updateCalculations();
        
        // Start real-time price updates for the modal
        this.startModalPriceUpdates();
    }

    startModalPriceUpdates() {
        // Clear any existing interval
        if (this.modalPriceInterval) {
            clearInterval(this.modalPriceInterval);
        }
        
        // Update prices every second
        this.modalPriceInterval = setInterval(() => {
            this.updateModalPrices();
        }, 1000);
    }

    updateModalPrices() {
        if (!this.selectedOption) {
            console.warn('No selected option for modal price updates');
            return;
        }
        
        // Get current option price
        const currentOptionPrice = this.getCurrentOptionPrice(this.selectedOption);
        
        // Update market price display
        const marketPriceValue = document.querySelector('.market-price-display .price-value');
        if (marketPriceValue) {
            const oldPrice = parseFloat(marketPriceValue.textContent.replace('$', '')) || 0;
            marketPriceValue.textContent = `$${currentOptionPrice.toFixed(4)}`;
            
            // Add animation for price changes
            if (Math.abs(currentOptionPrice - oldPrice) > 0.0001) {
                if (currentOptionPrice > oldPrice) {
                    marketPriceValue.classList.add('price-up');
                    setTimeout(() => marketPriceValue.classList.remove('price-up'), 1000);
                } else if (currentOptionPrice < oldPrice) {
                    marketPriceValue.classList.add('price-down');
                    setTimeout(() => marketPriceValue.classList.remove('price-down'), 1000);
                }
            }
        }
        
        // Update limit price input only if user hasn't manually modified it
        const priceInput = document.getElementById('priceInput');
        if (priceInput && !priceInput.matches(':focus') && this.currentOrderType === 'limit' && !this.userModifiedPrice) {
            const oldInputPrice = parseFloat(priceInput.value) || 0;
            priceInput.value = currentOptionPrice.toFixed(4);
            
            // Add visual feedback for price input changes
            if (Math.abs(currentOptionPrice - oldInputPrice) > 0.0001) {
                priceInput.style.borderColor = currentOptionPrice > oldInputPrice ? '#28a745' : '#dc3545';
                setTimeout(() => {
                    priceInput.style.borderColor = '';
                }, 1000);
            }
        }
        
        // Update help text with current market price and user modification status
        const helpText = document.querySelector('.input-help');
        if (helpText) {
            if (this.userModifiedPrice) {
                helpText.textContent = `Manual price set • Market: $${currentOptionPrice.toFixed(4)}`;
                helpText.style.color = '#f7931a';
                helpText.style.fontWeight = '600';
            } else {
                helpText.textContent = `Current market price: $${currentOptionPrice.toFixed(4)}`;
                helpText.style.color = '#6c757d';
                helpText.style.fontWeight = 'normal';
            }
        }
        
        // Update calculations with new price
        this.updateCalculations();
        
        // Update option details in the modal
        this.updateModalOptionDetails();
    }

    updateModalOptionDetails() {
        if (!this.selectedOption) {
            console.warn('No selected option for modal option details update');
            return;
        }
        
        const currentOptionPrice = this.getCurrentOptionPrice(this.selectedOption);
        
        // Update premium in the pricing section
        const premiumElements = document.querySelectorAll('.detail-value');
        premiumElements.forEach(element => {
            if (element.textContent.includes('Premium:') || element.textContent.includes('Current Price:')) {
                const parentItem = element.closest('.detail-item');
                if (parentItem) {
                    const label = parentItem.querySelector('.detail-label');
                    if (label && (label.textContent.includes('Premium') || label.textContent.includes('Current Price'))) {
                        element.textContent = `$${currentOptionPrice.toFixed(4)}`;
                    }
                }
            }
        });
        
        // Update Greeks if they need to be recalculated
        this.updateModalGreeks();
    }

    updateModalGreeks() {
        if (!this.selectedOption) {
            console.warn('No selected option for modal Greeks update');
            return;
        }
        
        // Recalculate Greeks based on current market conditions
        const currentPrice = this.currentPrice;
        const strikePrice = this.selectedOption.strikePrice;
        const volatility = this.calculateVolatility();
        const timeToExpiry = this.selectedOption.expiry || 24;
        
        // Update Delta
        const deltaElements = document.querySelectorAll('.detail-value');
        deltaElements.forEach(element => {
            if (element.classList.contains('positive') || element.classList.contains('negative')) {
                const parentItem = element.closest('.detail-item');
                if (parentItem) {
                    const label = parentItem.querySelector('.detail-label');
                    if (label && label.textContent.includes('Delta')) {
                        const newDelta = this.calculateDelta(strikePrice, volatility, this.selectedOption.type);
                        element.textContent = newDelta.toFixed(3);
                        element.className = `detail-value ${newDelta > 0 ? 'positive' : 'negative'}`;
                    }
                }
            }
        });
    }

    closeModal() {
        document.getElementById('tradeModal').classList.remove('active');
        this.selectedOption = null;
        this.existingPosition = null;
        this.userModifiedPrice = false; // Reset user modification flag
        
        // Clear modal price update interval
        if (this.modalPriceInterval) {
            clearInterval(this.modalPriceInterval);
            this.modalPriceInterval = null;
        }
    }

    switchTradeType(type) {
        const buyBtn = document.querySelector('.buy-btn');
        const sellBtn = document.querySelector('.sell-btn');
        const marginGroup = document.getElementById('marginGroup');
        const calcLabel = document.getElementById('calcLabel');
        
        // Update button states
        buyBtn.classList.toggle('active', type === 'buy');
        sellBtn.classList.toggle('active', type === 'sell');
        
        // Show/hide margin info
        marginGroup.style.display = type === 'sell' ? 'block' : 'none';
        
        // Update calculation label
        calcLabel.textContent = type === 'buy' ? 'Net Premium:' : 'Margin Required:';
        
        // Update calculations
        this.updateCalculations();
        
        // Store trade type
        this.currentTradeType = type;
    }

    switchOrderType(type) {
        const marketBtn = document.querySelector('.market-btn');
        const limitBtn = document.querySelector('.limit-btn');
        const priceGroup = document.getElementById('priceGroup');
        const marketPriceGroup = document.getElementById('marketPriceGroup');
        const priceInput = document.getElementById('priceInput');
        
        // Update button states
        marketBtn.classList.toggle('active', type === 'market');
        limitBtn.classList.toggle('active', type === 'limit');
        
        // Show/hide price input
        priceGroup.style.display = type === 'limit' ? 'block' : 'none';
        marketPriceGroup.style.display = type === 'market' ? 'block' : 'none';
        
        // Enable/disable price input
        priceInput.disabled = type === 'market';
        
        // Update calculations
        this.updateCalculations();
        
        // Store order type
        this.currentOrderType = type;
    }

    updateCalculations() {
        const quantityInput = document.getElementById('quantityInput');
        const priceInput = document.getElementById('priceInput');
        const totalQuantitySpan = document.getElementById('totalQuantity');
        const calcValue = document.getElementById('calcValue');
        const marginValue = document.getElementById('marginValue');
        
        const quantity = parseInt(quantityInput.value) || 0;
        const totalContracts = quantity * 75;
        const price = parseFloat(priceInput.value) || this.selectedOption.premium;
        
        // Update total quantity display
        totalQuantitySpan.textContent = totalContracts;
        
        // Calculate net premium/margin
        const netPremium = totalContracts * price;
        const margin = netPremium * 1.2; // 120% margin for selling
        
        // Store old values for animation
        const oldCalcValue = calcValue.textContent;
        const oldMarginValue = marginValue ? marginValue.textContent : '';
        
        // Update calculation display
        if (this.currentTradeType === 'sell') {
            calcValue.textContent = `$${margin.toFixed(2)}`;
            if (marginValue) marginValue.textContent = `$${margin.toFixed(2)}`;
        } else {
            calcValue.textContent = `$${netPremium.toFixed(2)}`;
        }
        
        // Add animation if values changed
        if (oldCalcValue !== calcValue.textContent) {
            calcValue.classList.add('updating');
            setTimeout(() => calcValue.classList.remove('updating'), 500);
        }
        
        if (marginValue && oldMarginValue !== marginValue.textContent) {
            marginValue.classList.add('updating');
            setTimeout(() => marginValue.classList.remove('updating'), 500);
        }
        
        // Validate form
        this.validateForm();
    }

    validateForm() {
        const quantityInput = document.getElementById('quantityInput');
        const priceInput = document.getElementById('priceInput');
        const confirmButton = document.getElementById('confirmTrade');
        const validationMessages = document.getElementById('validationMessages');
        
        const quantity = parseInt(quantityInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const errors = [];
        
        // Quantity validation
        if (quantity < 1) {
            errors.push('Quantity must be at least 1 lot');
        }
        
        // Price validation for limit orders
        if (this.currentOrderType === 'limit' && price <= 0) {
            errors.push('Limit price must be greater than 0');
        }
        
        // Update validation messages
        if (errors.length > 0) {
            validationMessages.innerHTML = errors.map(error => 
                `<div class="validation-error"><i class="fas fa-exclamation-circle"></i> ${error}</div>`
            ).join('');
            confirmButton.disabled = true;
        } else {
            validationMessages.innerHTML = '<div class="validation-success"><i class="fas fa-check-circle"></i> All fields are valid</div>';
            confirmButton.disabled = false;
        }
    }

    executeTrade() {
        if (!this.selectedOption) return;

        // Check if we're closing an existing position
        if (this.existingPosition) {
            this.showClosePositionDialog(this.existingPosition);
            return;
        }

        // Show order confirmation modal
        this.showOrderConfirmation();
    }

    showOrderConfirmation() {
        // Check if selectedOption exists
        if (!this.selectedOption) {
            console.error('No option selected for order confirmation');
            this.debugTradingState(); // Debug the current state
            this.showNotification('❌ No option selected for order confirmation', 'error');
            
            // Also show an alert for immediate visibility
            alert('No option selected for order confirmation. Please select an option first.');
            return;
        }

        const quantityInput = document.getElementById('quantityInput');
        const priceInput = document.getElementById('priceInput');
        const calcValue = document.getElementById('calcValue');
        
        const quantity = parseInt(quantityInput.value) || 0;
        const totalContracts = quantity * 75;
        const price = parseFloat(priceInput.value) || this.selectedOption.premium;
        const netAmount = parseFloat(calcValue.textContent.replace('$', '')) || 0;
        
        // Ensure trade type and order type have default values
        const tradeType = this.currentTradeType || 'buy';
        const orderType = this.currentOrderType || 'market';
        
        // Store order data for confirmation (simplified to avoid circular references)
        const orderData = {
            optionId: this.selectedOption.id,
            optionDescription: this.selectedOption.description,
            optionType: this.selectedOption.type,
            optionStrikePrice: this.selectedOption.strikePrice,
            optionExpiry: this.selectedOption.expiry,
            quantity: quantity,
            totalContracts: totalContracts,
            price: price,
            netAmount: netAmount,
            tradeType: tradeType,
            orderType: orderType
        };
        
        // Create confirmation modal
        const modal = document.createElement('div');
        modal.className = 'modal active order-confirmation-modal';
        modal.id = 'orderConfirmationModal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Order Confirmation</h3>
                    <button class="close-btn" onclick="gameInstance.cancelOrder()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="order-summary">
                        <div class="summary-header">
                            <h4>${this.selectedOption.description}</h4>
                            <div class="option-type-badge ${this.selectedOption.type}">${this.selectedOption.type.toUpperCase()}</div>
                        </div>
                        
                        <div class="order-details">
                            <div class="detail-row">
                                <span class="detail-label">Action:</span>
                                <span class="detail-value ${tradeType}">${tradeType.toUpperCase()}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Order Type:</span>
                                <span class="detail-value">${orderType.toUpperCase()}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Quantity:</span>
                                <span class="detail-value">${quantity} lots (${totalContracts} contracts)</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Price:</span>
                                <span class="detail-value">$${price.toFixed(4)} per contract</span>
                            </div>
                            <div class="detail-row total-row">
                                <span class="detail-label">${tradeType === 'buy' ? 'Net Premium' : 'Margin Required'}:</span>
                                <span class="detail-value total">$${netAmount.toFixed(2)}</span>
                            </div>
                        </div>
                        
                        <div class="confirmation-warning">
                            <i class="fas fa-info-circle"></i>
                            <strong>Please confirm:</strong> This order will be executed at market price or your specified limit price.
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="gameInstance.cancelOrder()">Cancel</button>
                    <button class="btn btn-primary" onclick="gameInstance.confirmOrder()">Confirm Order</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Store order data in the modal element for later retrieval
        modal.setAttribute('data-order-data', JSON.stringify(orderData));
        
        // Close the original trade modal
        this.closeModal();
    }

    cancelOrder() {
        const modal = document.getElementById('orderConfirmationModal');
        if (modal) {
            modal.remove();
        }
    }

    confirmOrder() {
        let orderData;
        
        // Try to get order data from confirmation modal
        const confirmationModal = document.getElementById('orderConfirmationModal');
        if (confirmationModal) {
            const orderDataString = confirmationModal.getAttribute('data-order-data');
            if (orderDataString) {
                try {
                    orderData = JSON.parse(orderDataString);
                } catch (error) {
                    console.error('Error parsing order data:', error);
                    this.showNotification('❌ Error processing order data', 'error');
                    return;
                }
            }
        }
        
        // If no order data provided, check if selectedOption exists
        if (!orderData && !this.selectedOption) {
            console.error('No option selected for trade');
            this.debugTradingState(); // Debug the current state
            this.showNotification('❌ No option selected for trade', 'error');
            
            // Also show an alert for immediate visibility
            alert('No option selected for trade. Please select an option first.');
            return;
        }
        
        // Use order data if available, otherwise use current form values
        let quantity, price, option, tradeType, orderType;
        
        if (orderData) {
            quantity = orderData.quantity;
            price = orderData.price;
            tradeType = orderData.tradeType;
            orderType = orderData.orderType;
            
            // Reconstruct option object from simplified data
            option = {
                id: orderData.optionId,
                description: orderData.optionDescription,
                type: orderData.optionType,
                strikePrice: orderData.optionStrikePrice,
                expiry: orderData.optionExpiry,
                premium: price // Use the price as premium
            };
        } else {
            const quantityInput = document.getElementById('quantityInput');
            const priceInput = document.getElementById('priceInput');
            
            quantity = parseInt(quantityInput.value) || 0;
            price = parseFloat(priceInput.value) || this.selectedOption.premium;
            option = this.selectedOption;
            tradeType = this.currentTradeType || 'buy';
            orderType = this.currentOrderType || 'market';
        }
        
        // Create trade object
        const trade = {
            id: Date.now(),
            option: option,
            entryPrice: this.currentPrice,
            optionEntryPrice: price,
            entryTime: new Date(),
            expiryTime: new Date(Date.now() + (option.expiry || 24) * 60 * 60 * 1000),
            status: 'active',
            tradeType: tradeType,
            orderType: orderType,
            quantity: quantity,
            totalContracts: quantity * 75
        };

        // Add to active trades
        this.activeTrades.push(trade);
        this.userStats.totalTrades++;
        
        // Update displays
        this.updateUserStats();
        this.updateTradeHistory();
        this.updateCurrentPositions();
        this.saveUserData();
        
        // Close confirmation modal
        this.cancelOrder();
        
        // Show success message
        const action = tradeType === 'buy' ? 'purchased' : 'sold';
        this.showNotification(`Successfully ${action} ${quantity} lots of ${option.description}`, 'success');
        
        // Log order payload (simulating API call)
        console.log('Order placed:', {
            symbol: option.description,
            action: tradeType,
            orderType: orderType,
            quantity: quantity,
            price: price,
            totalAmount: quantity * 75 * price
        });
    }

    showClosePositionDialog(position) {
        // Create a modal for closing position with fluctuating prices
        const modal = document.createElement('div');
        modal.className = 'modal active close-position-modal';
        modal.id = 'closePositionModal';
        
        const priceUpdateInterval = setInterval(() => {
            this.updateClosePositionPrices(modal, position);
        }, 1000);
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Close Position</h3>
                    <button class="close-btn" onclick="gameInstance.cancelClosePosition()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="position-summary">
                        <div class="position-header">
                            <h4>${position.option.description}</h4>
                            <div class="option-type-badge ${position.option.type}">${position.option.type.toUpperCase()}</div>
                        </div>
                        
                        <div class="price-comparison">
                            <div class="price-section">
                                <h5>Entry Prices</h5>
                                <div class="price-item">
                                    <span class="price-label">Asset Price:</span>
                                    <span class="price-value entry">$${position.entryPrice.toFixed(2)}</span>
                                </div>
                                <div class="price-item">
                                    <span class="price-label">Option Price:</span>
                                    <span class="price-value entry">$${position.optionEntryPrice.toFixed(4)}</span>
                                </div>
                            </div>
                            
                            <div class="price-section">
                                <h5>Current Prices</h5>
                                <div class="price-item">
                                    <span class="price-label">Asset Price:</span>
                                    <span class="price-value current" id="currentAssetPrice">$${this.currentPrice.toFixed(2)}</span>
                                </div>
                                <div class="price-item">
                                    <span class="price-label">Option Price:</span>
                                    <span class="price-value current" id="currentOptionPrice">$${this.getCurrentOptionPrice(position.option).toFixed(4)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="pnl-summary">
                            <div class="pnl-item">
                                <span class="pnl-label">Current P&L:</span>
                                <span class="pnl-value" id="closePositionPnl">$${this.calculatePositionPnl(position).toFixed(2)}</span>
                            </div>
                            <div class="pnl-item">
                                <span class="pnl-label">P&L %:</span>
                                <span class="pnl-value" id="closePositionPnlPercent">${((this.calculatePositionPnl(position) / (position.optionEntryPrice * 100)) * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                        
                        <div class="price-change-indicator">
                            <div class="change-item">
                                <span class="change-label">Asset Change:</span>
                                <span class="change-value" id="assetChange">${this.calculatePriceChange(position.entryPrice, this.currentPrice)}</span>
                            </div>
                            <div class="change-item">
                                <span class="change-label">Option Change:</span>
                                <span class="change-value" id="optionChange">${this.calculatePriceChange(position.optionEntryPrice, this.getCurrentOptionPrice(position.option))}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="close-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>Warning:</strong> Prices are fluctuating in real-time. Make sure you're satisfied with the current prices before closing.
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="gameInstance.cancelClosePosition()">Cancel</button>
                    <button class="btn btn-danger" onclick="gameInstance.confirmClosePosition(${position.id})">Close Position</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Store the interval ID for cleanup
        this.closePositionInterval = priceUpdateInterval;
        
        // Close the original trade modal
        this.closeModal();
    }

    updateClosePositionPrices(modal, position) {
        const currentAssetPrice = this.currentPrice;
        const currentOptionPrice = this.getCurrentOptionPrice(position.option);
        const currentPnl = this.calculatePositionPnl(position);
        const totalInvestment = (position.optionEntryPrice * position.totalContracts);
        const pnlPercent = isNaN(currentPnl) || totalInvestment === 0 ? 0 : ((currentPnl / totalInvestment) * 100);
        
        // Update current prices
        const currentAssetElement = modal.querySelector('#currentAssetPrice');
        const currentOptionElement = modal.querySelector('#currentOptionPrice');
        const pnlElement = modal.querySelector('#closePositionPnl');
        const pnlPercentElement = modal.querySelector('#closePositionPnlPercent');
        const assetChangeElement = modal.querySelector('#assetChange');
        const optionChangeElement = modal.querySelector('#optionChange');
        
        if (currentAssetElement) {
            currentAssetElement.textContent = `$${currentAssetPrice.toFixed(2)}`;
        }
        if (currentOptionElement) {
            currentOptionElement.textContent = `$${currentOptionPrice.toFixed(4)}`;
        }
        if (pnlElement) {
            pnlElement.textContent = `$${currentPnl.toFixed(2)}`;
            pnlElement.className = `pnl-value ${currentPnl >= 0 ? 'positive' : 'negative'}`;
        }
        if (pnlPercentElement) {
            pnlPercentElement.textContent = `${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%`;
            pnlPercentElement.className = `pnl-value ${pnlPercent >= 0 ? 'positive' : 'negative'}`;
        }
        if (assetChangeElement) {
            assetChangeElement.innerHTML = this.calculatePriceChange(position.entryPrice, currentAssetPrice);
        }
        if (optionChangeElement) {
            optionChangeElement.innerHTML = this.calculatePriceChange(position.optionEntryPrice, currentOptionPrice);
        }
    }

    calculatePriceChange(entryPrice, currentPrice) {
        const change = currentPrice - entryPrice;
        const changePercent = (change / entryPrice) * 100;
        const direction = change >= 0 ? 'positive' : 'negative';
        const arrow = change >= 0 ? '↗' : '↘';
        
        return `<span class="change-${direction}">${arrow} $${Math.abs(change).toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)</span>`;
    }

    getCurrentOptionPrice(option) {
        // Check if option exists
        if (!option) {
            console.warn('No option provided to getCurrentOptionPrice');
            return 0;
        }
        
        // Get the current price of the option from the options chain
        const allOptions = [...this.callOptions, ...this.putOptions];
        const currentOption = allOptions.find(opt => opt.id === option.id);
        return currentOption ? currentOption.premium : (option.premium || 0);
    }

    cancelClosePosition() {
        const modal = document.getElementById('closePositionModal');
        if (modal) {
            modal.remove();
        }
        if (this.closePositionInterval) {
            clearInterval(this.closePositionInterval);
            this.closePositionInterval = null;
        }
    }

    confirmClosePosition(positionId) {
        const position = this.activeTrades.find(trade => trade.id === positionId);
        if (position) {
            this.closePosition(position);
        }
        
        // Clean up the modal and interval
        this.cancelClosePosition();
    }

    closePosition(position) {
        const currentPnl = this.calculatePositionPnl(position);
        const totalInvestment = (position.optionEntryPrice * position.totalContracts);
        const pnlPercent = isNaN(currentPnl) || totalInvestment === 0 ? 0 : ((currentPnl / totalInvestment) * 100);
        
        // Update position status
        position.status = 'closed';
        position.exitPrice = this.currentPrice; // Underlying asset price at exit
        position.optionExitPrice = this.getCurrentOptionPrice(position.option); // Option price at exit
        position.exitTime = new Date();
        position.realizedPnl = currentPnl;
        
        // Update user stats
        this.userStats.totalTrades++;
        if (currentPnl > 0) {
            this.userStats.wins++;
        } else {
            this.userStats.losses++;
        }
        this.userStats.profitLoss += currentPnl;
        
        this.updateUserStats();
        this.updateTradeHistory();
        this.updateCurrentPositions();
        this.saveUserData();
        
        this.closeModal();
        
        // Show result message
        const message = currentPnl >= 0 ? 
            `Position closed! Profit: $${currentPnl.toFixed(2)} (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%)` : 
            `Position closed. Loss: $${Math.abs(currentPnl).toFixed(2)} (${pnlPercent.toFixed(1)}%)`;
        this.showNotification(message, currentPnl >= 0 ? 'success' : 'error');
    }

    checkActiveTrades() {
        const now = new Date();
        
        this.activeTrades.forEach(trade => {
            if (trade.status === 'active' && now >= trade.expiryTime) {
                this.settleTrade(trade);
            }
        });
    }

    settleTrade(trade) {
        const currentPrice = this.currentPrice;
        const strikePrice = trade.option.strikePrice;
        let isWin = false;
        let profit = 0;

        if (trade.option.type === 'call') {
            // Call option wins if price goes up
            isWin = currentPrice > strikePrice;
            if (isWin) {
                // Calculate realistic profit based on option pricing
                const intrinsicValue = currentPrice - strikePrice;
                const timeValue = trade.option.premium - intrinsicValue;
                const profitMultiplier = Math.max(1, intrinsicValue / trade.option.premium);
                profit = trade.option.premium * profitMultiplier * 100;
            } else {
                profit = -trade.option.premium * 100; // Lose the premium
            }
        } else {
            // Put option wins if price goes down
            isWin = currentPrice < strikePrice;
            if (isWin) {
                // Calculate realistic profit based on option pricing
                const intrinsicValue = strikePrice - currentPrice;
                const timeValue = trade.option.premium - intrinsicValue;
                const profitMultiplier = Math.max(1, intrinsicValue / trade.option.premium);
                profit = trade.option.premium * profitMultiplier * 100;
            } else {
                profit = -trade.option.premium * 100; // Lose the premium
            }
        }

        trade.status = 'settled';
        trade.exitPrice = currentPrice;
        trade.exitTime = new Date();
        trade.isWin = isWin;
        trade.profit = profit;

        // Update user stats
        if (isWin) {
            this.userStats.wins++;
        } else {
            this.userStats.losses++;
        }
        this.userStats.profitLoss += profit;

        this.updateUserStats();
        this.updateTradeHistory();
        this.saveUserData();

        // Show result notification
        const message = isWin ? 
            `Trade won! Profit: $${profit.toFixed(2)}` : 
            `Trade lost. Loss: $${Math.abs(profit).toFixed(2)}`;
        this.showNotification(message, isWin ? 'success' : 'error');
    }

    updateUserStats() {
        const totalTradesElement = document.getElementById('totalTrades');
        const winRateElement = document.getElementById('winRate');
        const profitLossElement = document.getElementById('profitLoss');
        const rankElement = document.getElementById('rank');
        
        if (totalTradesElement) {
            totalTradesElement.textContent = this.userStats.totalTrades;
        }
        
        if (winRateElement) {
        const winRate = this.userStats.totalTrades > 0 ? 
            ((this.userStats.wins / this.userStats.totalTrades) * 100).toFixed(1) : '0';
            winRateElement.textContent = `${winRate}%`;
        }
        
        if (profitLossElement) {
            profitLossElement.textContent = `$${this.userStats.profitLoss.toFixed(2)}`;
            profitLossElement.className = `stat-number ${this.userStats.profitLoss >= 0 ? 'positive' : 'negative'}`;
        }
        
        if (rankElement) {
            rankElement.textContent = this.userStats.rank;
        }
    }

    updateTradeHistory() {
        const historyContainer = document.getElementById('tradeHistory');
        if (!historyContainer) return; // Exit if element doesn't exist
        
        const allTrades = [...this.activeTrades.filter(t => t.status === 'settled'), ...this.tradeHistory];
        
        // Sort by most recent
        allTrades.sort((a, b) => new Date(b.exitTime || b.entryTime) - new Date(a.exitTime || a.entryTime));
        
        historyContainer.innerHTML = '';
        
        allTrades.slice(0, 10).forEach(trade => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const isSettled = trade.status === 'settled' || trade.status === 'closed';
            const isWin = trade.isWin || (trade.realizedPnl && trade.realizedPnl > 0);
            const profit = trade.profit || trade.realizedPnl || 0;
            
            // Enhanced price information for closed trades
            let priceInfo = '';
            if (isSettled && trade.entryPrice && trade.exitPrice) {
                const assetChange = ((trade.exitPrice - trade.entryPrice) / trade.entryPrice * 100).toFixed(2);
                const assetChangeDir = assetChange >= 0 ? '+' : '';
                
                if (trade.optionEntryPrice && trade.optionExitPrice) {
                    const optionChange = ((trade.optionExitPrice - trade.optionEntryPrice) / trade.optionEntryPrice * 100).toFixed(2);
                    const optionChangeDir = optionChange >= 0 ? '+' : '';
                    
                    priceInfo = `
                        <div class="history-price-info">
                            <span class="asset-change">Asset: ${assetChangeDir}${assetChange}%</span>
                            <span class="option-change">Option: ${optionChangeDir}${optionChange}%</span>
                        </div>
                    `;
                } else {
                    priceInfo = `
                        <div class="history-price-info">
                            <span class="asset-change">Asset: ${assetChangeDir}${assetChange}%</span>
                        </div>
                    `;
                }
            }
            
            historyItem.innerHTML = `
                <div class="history-details">
                    <div class="history-type ${isSettled ? (isWin ? 'win' : 'loss') : 'pending'}">
                        ${trade.option.description} - ${isSettled ? (isWin ? 'WIN' : 'LOSS') : 'PENDING'}
                    </div>
                    <div class="history-info">
                        ${trade.option.type.toUpperCase()} @ $${trade.option.strikePrice.toFixed(2)} | 
                        ${new Date(trade.entryTime).toLocaleDateString()}
                    </div>
                    ${priceInfo}
                </div>
                <div class="history-amount ${isSettled ? (isWin ? 'positive' : 'negative') : ''}">
                    ${isSettled ? `$${profit.toFixed(2)}` : 'Pending'}
                </div>
            `;
            
            historyContainer.appendChild(historyItem);
        });
    }

    updateCountdown() {
        const countdownElement = document.getElementById('countdown');
        if (!countdownElement) return; // Exit if element doesn't exist
        
        const now = new Date();
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const timeLeft = endOfDay - now;
        
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        countdownElement.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Reset options at midnight
        if (hours === 0 && minutes === 0 && seconds === 0) {
            this.generateDailyOptions();
        }
    }

    initializeChart() {
        const chartElement = document.getElementById('priceChart');
        const statusElement = document.getElementById('chartStatus');
        
        if (!chartElement) {
            console.log('Chart element not found');
            if (statusElement) statusElement.textContent = 'Chart Status: Element not found';
            return; // Exit if element doesn't exist
        }
        
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.error('Chart.js library not loaded');
            if (statusElement) statusElement.textContent = 'Chart Status: Chart.js not loaded';
            return;
        }
        
        try {
            const ctx = chartElement.getContext('2d');
            
            // Ensure we have some initial data
            let initialData, initialLabels;
            
            if (this.priceHistory && this.priceHistory.length > 0) {
                initialData = this.priceHistory.map(point => point.price);
                initialLabels = this.priceHistory.map(point => {
                    // Ensure time is a Date object
                    const time = point.time instanceof Date ? point.time : new Date(point.time);
                    return time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                });
            } else {
                // Generate some sample data if no history exists
                const basePrice = this.currentPrice || 45000;
                initialData = [basePrice, basePrice * 1.001, basePrice * 0.999, basePrice * 1.002, basePrice * 0.998];
                initialLabels = ['12:00', '12:05', '12:10', '12:15', '12:20'];
            }
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                    labels: initialLabels,
                datasets: [{
                    label: 'Crypto Price',
                        data: initialData,
                    borderColor: '#f7931a',
                    backgroundColor: 'rgba(247, 147, 26, 0.1)',
                    borderWidth: 2,
                    fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#f7931a',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: '#f7931a',
                            borderWidth: 1
                    }
                },
                scales: {
                    x: {
                            display: false,
                            grid: {
                        display: false
                            }
                    },
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                            },
                            ticks: {
                                color: '#666',
                                font: {
                                    size: 12
                                }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                    },
                    animation: {
                        duration: 300
                }
            }
        });
            
            console.log('Chart initialized successfully with', initialData.length, 'data points');
            if (statusElement) statusElement.textContent = `Chart Status: Active (${initialData.length} data points)`;
        } catch (error) {
            console.error('Error initializing chart:', error);
            if (statusElement) statusElement.textContent = 'Chart Status: Error - ' + error.message;
        }
    }

    updateChart() {
        const statusElement = document.getElementById('chartStatus');
        
        if (!this.chart) {
            console.log('Chart not initialized');
            if (statusElement) statusElement.textContent = 'Chart Status: Not initialized';
            return;
        }

        if (!this.priceHistory || this.priceHistory.length === 0) {
            console.log('No price history data available');
            if (statusElement) statusElement.textContent = 'Chart Status: No data available';
            return;
        }

                try {
            // Limit to last 200 data points for better performance
            const recentHistory = this.priceHistory.slice(-200);
            
            const labels = recentHistory.map(point => {
                // Ensure time is a Date object
                const time = point.time instanceof Date ? point.time : new Date(point.time);
                return time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            });
            const data = recentHistory.map(point => point.price);

            this.chart.data.labels = labels;
            this.chart.data.datasets[0].data = data;
            this.chart.update('none');
            
            console.log('Chart updated with', data.length, 'data points');
            if (statusElement) statusElement.textContent = `Chart Status: Updated (${data.length} data points)`;
        } catch (error) {
            console.error('Error updating chart:', error);
            if (statusElement) statusElement.textContent = 'Chart Status: Update error - ' + error.message;
        }
    }

    clearAllData() {
        // Clear localStorage
        localStorage.removeItem('cryptoOptionsGame');
        localStorage.removeItem('cryptoOptionsMarketData');
        
        // Reset all data
        this.currentPrice = 45000 + (Math.random() - 0.5) * 2000;
        this.priceHistory = [{
            time: new Date(),
            price: this.currentPrice
        }];
        this.callOptions = [];
        this.putOptions = [];
        this.userStats = {
            totalTrades: 0,
            wins: 0,
            losses: 0,
            profitLoss: 0,
            rank: '-'
        };
        this.tradeHistory = [];
        this.activeTrades = [];
        this.lastSyncTime = new Date();
        this.lastLargeMove = null;
        
        // Reinitialize
        this.initializeMarketData();
        
        // Show notification
        this.showNotification('All data cleared and reset successfully!', 'success');
        
        console.log('All data cleared and reset');
    }

    // testChart method removed

    // updateChartPeriod method removed - using default chart only

    updateLeaderboard() {
        // Generate mock leaderboard data
        this.leaderboard = [
            { name: 'CryptoKing', score: 1250, trades: 45, winRate: 78 },
            { name: 'CryptoBull', score: 980, trades: 32, winRate: 72 },
            { name: 'TradingPro', score: 875, trades: 28, winRate: 68 },
            { name: 'MarketMaster', score: 720, trades: 25, winRate: 65 },
            { name: 'OptionsGuru', score: 650, trades: 22, winRate: 62 },
            { name: 'You', score: this.userStats.profitLoss, trades: this.userStats.totalTrades, winRate: this.userStats.totalTrades > 0 ? (this.userStats.wins / this.userStats.totalTrades * 100) : 0 }
        ];

        // Sort by score
        this.leaderboard.sort((a, b) => b.score - a.score);

        this.renderLeaderboard();
    }

    renderLeaderboard() {
        const container = document.getElementById('leaderboardList');
        if (!container) return; // Exit if element doesn't exist
        
        container.innerHTML = '';

        this.leaderboard.forEach((player, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            
            let rankClass = 'other';
            if (index === 0) rankClass = 'gold';
            else if (index === 1) rankClass = 'silver';
            else if (index === 2) rankClass = 'bronze';

            item.innerHTML = `
                <div class="rank ${rankClass}">${index + 1}</div>
                <div class="player-info">
                    <div class="player-name">${player.name}</div>
                    <div class="player-stats">${player.trades} trades • ${player.winRate.toFixed(0)}% win rate</div>
                </div>
                <div class="player-score">$${player.score.toFixed(2)}</div>
            `;
            
            container.appendChild(item);
        });
    }

    updateLeaderboardPeriod(period) {
        // Update leaderboard tabs
        document.querySelectorAll('.leaderboard-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`).classList.add('active');

        // In a real app, this would fetch different period data
        this.updateLeaderboard();
    }

    showTooltip(element, text) {
        const tooltip = document.getElementById('tooltip');
        tooltip.textContent = text;
        tooltip.classList.add('active');
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
    }

    hideTooltip() {
        document.getElementById('tooltip').classList.remove('active');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 3000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    loadUserData() {
        const saved = localStorage.getItem('cryptoOptionsGame');
        if (saved) {
            try {
            const data = JSON.parse(saved);
            this.userStats = data.userStats || this.userStats;
            this.tradeHistory = data.tradeHistory || [];
            this.activeTrades = data.activeTrades || [];
            
            // Ensure backward compatibility for existing trades without optionEntryPrice
            this.activeTrades.forEach(trade => {
                if (!trade.optionEntryPrice && trade.option) {
                    trade.optionEntryPrice = trade.option.premium;
                }
            });
            
            this.tradeHistory.forEach(trade => {
                if (!trade.optionEntryPrice && trade.option) {
                    trade.optionEntryPrice = trade.option.premium;
                }
            });
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
    }

    saveUserData() {
        const data = {
            userStats: this.userStats,
            tradeHistory: this.tradeHistory,
            activeTrades: this.activeTrades
        };
        localStorage.setItem('cryptoOptionsGame', JSON.stringify(data));
    }

    saveMarketData() {
        const marketData = {
            currentPrice: this.currentPrice,
            priceHistory: this.priceHistory,
            callOptions: this.callOptions,
            putOptions: this.putOptions,
            lastSyncTime: this.lastSyncTime ? this.lastSyncTime.toISOString() : null,
            lastLargeMove: this.lastLargeMove
        };
        localStorage.setItem('cryptoOptionsMarketData', JSON.stringify(marketData));
    }

    updateCurrentPositions() {
        const positionsContainer = document.getElementById('currentPositions');
        const totalPnlElement = document.getElementById('totalPnl');
        const positionCountElement = document.getElementById('positionCount');
        
        if (!positionsContainer) return;
        
        // Get active trades
        const activePositions = this.activeTrades.filter(trade => trade.status === 'active');
        
        // Calculate total P&L
        let totalPnl = 0;
        activePositions.forEach(position => {
            const currentPnl = this.calculatePositionPnl(position);
            if (!isNaN(currentPnl)) {
                totalPnl += currentPnl;
            }
        });
        
        // Update summary with animation
        if (totalPnlElement) {
            const oldValue = parseFloat(totalPnlElement.textContent.replace('$', '')) || 0;
            totalPnlElement.textContent = `$${totalPnl.toFixed(2)}`;
            totalPnlElement.className = `total-pnl ${totalPnl >= 0 ? '' : 'negative'}`;
            
            // Add animation if value changed significantly
            if (Math.abs(totalPnl - oldValue) > 1) {
                totalPnlElement.classList.add('pulse');
                setTimeout(() => totalPnlElement.classList.remove('pulse'), 1000);
            }
        }
        
        if (positionCountElement) {
            positionCountElement.textContent = `${activePositions.length} Position${activePositions.length !== 1 ? 's' : ''}`;
        }
        
        // Check if we need to recreate positions or just update existing ones
        const existingPositions = positionsContainer.querySelectorAll('.position-item');
        
        if (activePositions.length === 0) {
            positionsContainer.innerHTML = `
                <div class="position-item" style="text-align: center; color: var(--gray-color);">
                    <div>No active positions</div>
                    <div style="font-size: 0.75rem;">Start trading to see your positions here</div>
                </div>
            `;
            return;
        }
        
        // If number of positions changed, recreate the list
        if (existingPositions.length !== activePositions.length) {
            this.renderPositionsList(positionsContainer, activePositions);
            return;
        }
        
        // Update existing positions with animations and live option price
        activePositions.forEach(position => {
            const currentPnl = this.calculatePositionPnl(position);
            const timeToExpiry = this.calculateTimeToExpiry(position.expiryTime);
            const totalInvestment = (position.optionEntryPrice * position.totalContracts);
            const pnlPercent = isNaN(currentPnl) || totalInvestment === 0 ? 0 : ((currentPnl / totalInvestment) * 100);
            
            const positionId = `position-${position.id}`;
            const positionElement = document.getElementById(positionId);
            
            if (positionElement) {
                // Update P&L values with animation
                const pnlValueElement = positionElement.querySelector('.pnl-value');
                const pnlPercentElement = positionElement.querySelector('.pnl-percent');
                
                if (pnlValueElement && pnlPercentElement) {
                    const oldPnl = parseFloat(pnlValueElement.textContent.replace('$', '')) || 0;
                    
                    // Update values
                    pnlValueElement.textContent = `$${currentPnl.toFixed(2)}`;
                    pnlPercentElement.textContent = `${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%`;
                    
                    // Add animation if P&L changed significantly
                    if (Math.abs(currentPnl - oldPnl) > 0.5) {
                        pnlValueElement.classList.add('pulse');
                        setTimeout(() => pnlValueElement.classList.remove('pulse'), 1000);
                    }
                }
                
                // Update color based on P&L
                const pnlContainer = positionElement.querySelector('.position-pnl');
                if (pnlContainer) {
                    pnlContainer.className = `position-pnl ${currentPnl >= 0 ? 'positive' : 'negative'}`;
                }

                // Update the current option price live
                const currentOptionElement = positionElement.querySelector('.current-option');
                if (currentOptionElement) {
                    const liveOptionPrice = this.getCurrentOptionPrice(position.option);
                    currentOptionElement.textContent = `$${liveOptionPrice.toFixed(4)}`;
                }
            }
            
            // Store current P&L for comparison in next update
            position.lastPnl = currentPnl;
        });
    }

    renderPositionsList(container, positions) {
        container.innerHTML = '';
        
        positions.forEach(position => {
            const currentPnl = this.calculatePositionPnl(position);
            const timeToExpiry = this.calculateTimeToExpiry(position.expiryTime);
            const totalInvestment = (position.optionEntryPrice * position.totalContracts);
            const pnlPercent = isNaN(currentPnl) || totalInvestment === 0 ? 0 : ((currentPnl / totalInvestment) * 100);
            
            const positionId = `position-${position.id}`;
            
            const positionItem = document.createElement('div');
            positionItem.className = 'position-item';
            positionItem.id = positionId;
            
            positionItem.innerHTML = `
                <div class="position-info">
                    <div class="position-type ${position.option.type}">
                        ${position.option.type.toUpperCase()} ${position.option.strikePrice.toFixed(0)}
                    </div>
                    <div class="position-details">
                        <div class="price-comparison-mini">
                            <span class="entry-price">Entry: $${position.entryPrice.toFixed(2)}</span>
                            <span class="current-price">Now: $${this.currentPrice.toFixed(2)}</span>
                        </div>
                        <div class="option-price-comparison">
                            <span class="entry-option">Option: $${position.optionEntryPrice.toFixed(4)}</span>
                            <span class="current-option">Now: $${this.getCurrentOptionPrice(position.option).toFixed(4)}</span>
                        </div>
                        <div class="expiry-info">Expires: ${timeToExpiry}</div>
                    </div>
                </div>
                <div class="position-pnl ${currentPnl >= 0 ? 'positive' : 'negative'}">
                    <div class="pnl-value">$${currentPnl.toFixed(2)}</div>
                    <div class="pnl-percent" style="font-size: 0.75rem;">${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%</div>
                </div>
            `;
            
            container.appendChild(positionItem);
            position.lastPnl = currentPnl;
        });
    }

    calculatePositionPnl(position) {
        const currentOptionPrice = this.getCurrentOptionPrice(position.option);
        const entryOptionPrice = position.optionEntryPrice;
        const quantity = position.quantity || 1;
        const totalContracts = position.totalContracts || 75;
        
        // Simple P&L calculation based on trade type
        let pnl = 0;
        
        if (position.tradeType === 'buy') {
            // For buy orders: Profit if current price > entry price
            // P&L = (Current Price - Entry Price) × Total Contracts
            pnl = (currentOptionPrice - entryOptionPrice) * totalContracts;
        } else if (position.tradeType === 'sell') {
            // For sell orders: Profit if current price < entry price
            // P&L = (Entry Price - Current Price) × Total Contracts
            pnl = (entryOptionPrice - currentOptionPrice) * totalContracts;
        }
        
        // Ensure we don't return NaN
        return isNaN(pnl) ? 0 : pnl;
    }

    calculateTimeToExpiry(expiryTime) {
        const now = new Date();
        const expiry = new Date(expiryTime);
        const timeLeft = expiry - now;
        
        if (timeLeft <= 0) return 'Expired';
        
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    }

    // Debug function to check trading interface state
    debugTradingState() {
        console.log('=== Trading Interface State Debug ===');
        console.log('selectedOption:', this.selectedOption);
        console.log('currentTradeType:', this.currentTradeType);
        console.log('currentOrderType:', this.currentOrderType);
        console.log('existingPosition:', this.existingPosition);
        console.log('activeTrades:', this.activeTrades.length);
        console.log('currentPrice:', this.currentPrice);
        console.log('=====================================');
    }
}

// Initialize the game when the page loads
let gameInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    gameInstance = new CryptoOptionsGame();
});

// Save data when page is unloaded
window.addEventListener('beforeunload', () => {
    if (gameInstance) {
        gameInstance.saveAllData();
    }
});

// Save data when page becomes hidden
document.addEventListener('visibilitychange', () => {
    if (gameInstance && document.hidden) {
        gameInstance.saveAllData();
    }
});

// Add some CSS for notifications
const style = document.createElement('style');
style.textContent = `
    .notification {
        font-weight: 500;
        font-size: 0.875rem;
    }
    
    .trade-details-grid {
        display: grid;
        gap: 0.75rem;
        margin: 1rem 0;
    }
    
    .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
        border-bottom: 1px solid #eee;
    }
    
    .detail-item:last-child {
        border-bottom: none;
    }
    
    .detail-label {
        font-weight: 500;
        color: #666;
    }
    
    .detail-value {
        font-weight: 600;
    }
    
    .detail-value.call {
        color: #28a745;
    }
    
    .detail-value.put {
        color: #dc3545;
    }
    
    .trade-potential {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 8px;
        margin-top: 1rem;
    }
    
    .trade-potential p {
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
    }
    
    .trade-potential p:last-child {
        margin-bottom: 0;
    }
`;
document.head.appendChild(style); 