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
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserData();
        this.generateDailyOptions();
        this.updateCountdown();
        this.initializeChart();
        this.updateLeaderboard();
        
        // Start countdown timer
        this.countdownInterval = setInterval(() => {
            this.updateCountdown();
        }, 1000);
        
        // Update full market data every 30 seconds
        this.dataUpdateInterval = setInterval(() => {
            this.updateMarketData();
        }, 30000);
        
        // Update price every 2 seconds for realistic simulation
        this.priceUpdateInterval = setInterval(() => {
            this.updatePriceOnly();
        }, 2000);
        
        // Initial data load
        this.updateMarketData();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToSection(e.target.getAttribute('href').substring(1));
            });
        });

        // Mobile navigation toggle
        document.getElementById('navToggle').addEventListener('click', () => {
            document.getElementById('navMenu').classList.toggle('active');
        });

        // Options tabs
        document.querySelectorAll('.options-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchOptionsTab(e.target.dataset.tab);
            });
        });

        // Chart period controls
        document.querySelectorAll('.chart-controls .btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.updateChartPeriod(e.target.dataset.period);
            });
        });

        // Leaderboard tabs
        document.querySelectorAll('.leaderboard-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.updateLeaderboardPeriod(e.target.dataset.period);
            });
        });

        // Modal events
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelTrade').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('confirmTrade').addEventListener('click', () => {
            this.executeTrade();
        });

        // Close modal on outside click
        document.getElementById('tradeModal').addEventListener('click', (e) => {
            if (e.target.id === 'tradeModal') {
                this.closeModal();
            }
        });

        // Tooltip events
        document.addEventListener('mouseover', (e) => {
            if (e.target.dataset.tooltip) {
                this.showTooltip(e.target, e.target.dataset.tooltip);
            }
        });

        document.addEventListener('mouseout', () => {
            this.hideTooltip();
        });

        // Manual refresh button
        document.getElementById('refreshData').addEventListener('click', () => {
            this.updateMarketData();
        });
    }

    navigateToSection(sectionId) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[href="#${sectionId}"]`).classList.add('active');

        // Show section
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');

        // Close mobile menu
        document.getElementById('navMenu').classList.remove('active');
    }

    switchOptionsTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.options-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Show/hide options lists
        document.getElementById('callOptions').classList.toggle('hidden', tab !== 'call');
        document.getElementById('putOptions').classList.toggle('hidden', tab !== 'put');
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

        // Keep only last 100 data points
        if (this.priceHistory.length > 100) {
            this.priceHistory.shift();
        }

        // Update price display with animation
        this.updatePriceOnlyDisplay(newPrice, oldPrice);
        
        // Update chart with new data point
        this.updateChart();
        
        // Check active trades
        this.checkActiveTrades();
        
        // Update options prices based on new market conditions
        this.updateOptionsPrices();
    }

    updateMarketData() {
        // Generate realistic simulated market data
        const marketData = this.generateRealisticMarketData();
        
        this.currentPrice = marketData.price;
        this.priceHistory.push({
            time: new Date(),
            price: marketData.price
        });

        // Keep only last 100 data points
        if (this.priceHistory.length > 100) {
            this.priceHistory.shift();
        }

        this.updatePriceDisplay(marketData);
        this.updateChart();
        this.checkActiveTrades();
        
        // Regenerate options with new market data
        this.generateDailyOptions();
        
        // Update connection status
        this.updateConnectionStatus('simulated');
        
        // Hide loading state
        this.showLoadingState(false);
    }

    generateRealisticPrice(currentPrice) {
        if (!currentPrice) {
            return 45000 + (Math.random() - 0.5) * 2000; // Start between $44,000-$46,000
        }
        
        // Realistic cryptocurrency price movement simulation
        const volatility = 0.008; // 0.8% volatility per update
        const trend = Math.sin(Date.now() / 500000) * 0.002; // Long-term trend
        const momentum = this.calculateMomentum();
        const news = this.generateNewsImpact();
        
        // Combine all factors
        const change = (Math.random() - 0.5) * volatility + trend + momentum + news;
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

        // Update price with animation
        priceElement.textContent = `$${data.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        priceElement.classList.add('pulse');
        setTimeout(() => priceElement.classList.remove('pulse'), 1000);

        // Update change
        const changePercent = (data.change * 100).toFixed(2);
        const changeText = `${data.change >= 0 ? '+' : ''}${changePercent}%`;
        changeElement.textContent = changeText;
        changeElement.className = `price-change ${data.change >= 0 ? 'positive' : 'negative'}`;

        // Update volume and market cap
        volumeElement.textContent = `$${(data.volume / 1000000000).toFixed(1)}B`;
        marketCapElement.textContent = `$${(data.marketCap / 1000000000).toFixed(1)}B`;
        
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
            priceElement.innerHTML = '<span class="loading"></span> Loading...';
            changeElement.textContent = 'Updating...';
            statusIndicator.className = 'status-indicator';
            statusText.textContent = 'Connecting...';
            refreshButton.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Refreshing...';
            refreshButton.disabled = true;
        } else {
            refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
            refreshButton.disabled = false;
        }
    }

    updateConnectionStatus(status) {
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('.status-text');
        
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
        
        // Generate 5 call options (bullish)
        for (let i = 0; i < 5; i++) {
            const strikePrice = this.currentPrice * (1 + (i - 2) * 0.01); // ±2% from current price
            const expiryHours = [1, 4, 8, 12, 24][i];
            const premium = this.calculateRealisticPremium(strikePrice, expiryHours, volatility, 'call');
            
            this.callOptions.push({
                id: `call_${i}`,
                type: 'call',
                strikePrice: strikePrice,
                expiry: expiryHours,
                premium: premium,
                description: `BTC Call ${strikePrice.toFixed(0)}`,
                volume: Math.floor(Math.random() * 1000) + 100, // Simulated volume
                openInterest: Math.floor(Math.random() * 5000) + 500
            });
        }

        // Generate 5 put options (bearish)
        for (let i = 0; i < 5; i++) {
            const strikePrice = this.currentPrice * (1 - (i - 2) * 0.01); // ±2% from current price
            const expiryHours = [1, 4, 8, 12, 24][i];
            const premium = this.calculateRealisticPremium(strikePrice, expiryHours, volatility, 'put');
            
            this.putOptions.push({
                id: `put_${i}`,
                type: 'put',
                strikePrice: strikePrice,
                expiry: expiryHours,
                premium: premium,
                description: `BTC Put ${strikePrice.toFixed(0)}`,
                volume: Math.floor(Math.random() * 1000) + 100, // Simulated volume
                openInterest: Math.floor(Math.random() * 5000) + 500
            });
        }

        this.renderOptions(this.callOptions, 'callOptions');
        this.renderOptions(this.putOptions, 'putOptions');
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

    updateOptionsPrices() {
        if (!this.callOptions || !this.putOptions) return;
        
        const volatility = this.calculateVolatility();
        
        // Update call options
        this.callOptions.forEach((option, i) => {
            const newPremium = this.calculateRealisticPremium(
                option.strikePrice, 
                option.expiry, 
                volatility, 
                'call'
            );
            option.premium = newPremium;
            
            // Update volume and open interest
            option.volume += Math.floor(Math.random() * 10) - 5;
            option.volume = Math.max(50, option.volume);
            option.openInterest += Math.floor(Math.random() * 20) - 10;
            option.openInterest = Math.max(100, option.openInterest);
        });
        
        // Update put options
        this.putOptions.forEach((option, i) => {
            const newPremium = this.calculateRealisticPremium(
                option.strikePrice, 
                option.expiry, 
                volatility, 
                'put'
            );
            option.premium = newPremium;
            
            // Update volume and open interest
            option.volume += Math.floor(Math.random() * 10) - 5;
            option.volume = Math.max(50, option.volume);
            option.openInterest += Math.floor(Math.random() * 20) - 10;
            option.openInterest = Math.max(100, option.openInterest);
        });
        
        // Re-render options with updated prices
        this.renderOptions(this.callOptions, 'callOptions');
        this.renderOptions(this.putOptions, 'putOptions');
    }

    renderOptions(options, containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        options.forEach(option => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option-item';
            
            // Calculate moneyness
            const moneyness = option.type === 'call' 
                ? (this.currentPrice - option.strikePrice) / this.currentPrice
                : (option.strikePrice - this.currentPrice) / this.currentPrice;
            
            const moneynessClass = Math.abs(moneyness) < 0.01 ? 'atm' : moneyness > 0 ? 'itm' : 'otm';
            
            optionElement.innerHTML = `
                <div class="option-details">
                    <div class="option-type ${option.type}">${option.type.toUpperCase()}</div>
                    <div class="option-strike ${moneynessClass}">$${option.strikePrice.toFixed(2)}</div>
                    <div class="option-expiry">Expires in ${option.expiry}h</div>
                    <div class="option-volume">Vol: ${option.volume} | OI: ${option.openInterest}</div>
                </div>
                <div class="option-premium">
                    <div class="premium-amount">$${option.premium.toFixed(4)}</div>
                    <div class="premium-label">Premium</div>
                    <div class="moneyness-label ${moneynessClass}">${moneynessClass.toUpperCase()}</div>
                </div>
            `;
            
            optionElement.addEventListener('click', () => {
                this.openTradeModal(option);
            });
            
            container.appendChild(optionElement);
        });
    }

    openTradeModal(option) {
        const modal = document.getElementById('tradeModal');
        const details = document.getElementById('tradeDetails');
        
        details.innerHTML = `
            <div class="trade-summary">
                <h4>${option.description}</h4>
                <div class="trade-details-grid">
                    <div class="detail-item">
                        <span class="detail-label">Type:</span>
                        <span class="detail-value ${option.type}">${option.type.toUpperCase()}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Strike Price:</span>
                        <span class="detail-value">$${option.strikePrice.toFixed(2)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Current Price:</span>
                        <span class="detail-value">$${this.currentPrice.toFixed(2)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Premium:</span>
                        <span class="detail-value">$${option.premium.toFixed(4)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Expiry:</span>
                        <span class="detail-value">${option.expiry} hours</span>
                    </div>
                </div>
                <div class="trade-potential">
                    <p><strong>Potential Outcome:</strong></p>
                    <p>If cryptocurrency price moves in your favor by the expiry time, you could profit from this trade.</p>
                </div>
            </div>
        `;
        
        // Store selected option
        this.selectedOption = option;
        
        modal.classList.add('active');
    }

    closeModal() {
        document.getElementById('tradeModal').classList.remove('active');
        this.selectedOption = null;
    }

    executeTrade() {
        if (!this.selectedOption) return;

        const trade = {
            id: Date.now(),
            option: this.selectedOption,
            entryPrice: this.currentPrice,
            entryTime: new Date(),
            expiryTime: new Date(Date.now() + this.selectedOption.expiry * 60 * 60 * 1000),
            status: 'active'
        };

        this.activeTrades.push(trade);
        this.userStats.totalTrades++;
        
        this.updateUserStats();
        this.updateTradeHistory();
        this.saveUserData();
        
        this.closeModal();
        
        // Show success message
        this.showNotification('Trade placed successfully!', 'success');
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
        document.getElementById('totalTrades').textContent = this.userStats.totalTrades;
        
        const winRate = this.userStats.totalTrades > 0 ? 
            ((this.userStats.wins / this.userStats.totalTrades) * 100).toFixed(1) : '0';
        document.getElementById('winRate').textContent = `${winRate}%`;
        
        document.getElementById('profitLoss').textContent = `$${this.userStats.profitLoss.toFixed(2)}`;
        document.getElementById('profitLoss').className = `stat-number ${this.userStats.profitLoss >= 0 ? 'positive' : 'negative'}`;
        
        document.getElementById('rank').textContent = this.userStats.rank;
    }

    updateTradeHistory() {
        const historyContainer = document.getElementById('tradeHistory');
        const allTrades = [...this.activeTrades.filter(t => t.status === 'settled'), ...this.tradeHistory];
        
        // Sort by most recent
        allTrades.sort((a, b) => new Date(b.exitTime || b.entryTime) - new Date(a.exitTime || a.entryTime));
        
        historyContainer.innerHTML = '';
        
        allTrades.slice(0, 10).forEach(trade => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const isSettled = trade.status === 'settled';
            const isWin = trade.isWin;
            
            historyItem.innerHTML = `
                <div class="history-details">
                    <div class="history-type ${isSettled ? (isWin ? 'win' : 'loss') : 'pending'}">
                        ${trade.option.description} - ${isSettled ? (isWin ? 'WIN' : 'LOSS') : 'PENDING'}
                    </div>
                    <div class="history-info">
                        ${trade.option.type.toUpperCase()} @ $${trade.option.strikePrice.toFixed(2)} | 
                        ${new Date(trade.entryTime).toLocaleDateString()}
                    </div>
                </div>
                <div class="history-amount ${isSettled ? (isWin ? 'positive' : 'negative') : ''}">
                    ${isSettled ? `$${trade.profit.toFixed(2)}` : 'Pending'}
                </div>
            `;
            
            historyContainer.appendChild(historyItem);
        });
    }

    updateCountdown() {
        const now = new Date();
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const timeLeft = endOfDay - now;
        
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        document.getElementById('countdown').textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Reset options at midnight
        if (hours === 0 && minutes === 0 && seconds === 0) {
            this.generateDailyOptions();
        }
    }

    initializeChart() {
        const ctx = document.getElementById('priceChart').getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Crypto Price',
                    data: [],
                    borderColor: '#f7931a',
                    backgroundColor: 'rgba(247, 147, 26, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    updateChart() {
        if (!this.chart) return;

        const labels = this.priceHistory.map(point => 
            point.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        );
        const data = this.priceHistory.map(point => point.price);

        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = data;
        this.chart.update('none');
    }

    async updateChartPeriod(period) {
        // Update chart controls
        document.querySelectorAll('.chart-controls .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`).classList.add('active');

        try {
            // Fetch historical data based on period
            let days = 1;
            switch(period) {
                case '1h':
                    days = 1;
                    break;
                case '24h':
                    days = 1;
                    break;
                case '7d':
                    days = 7;
                    break;
            }

            const response = await fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}&interval=${period === '1h' ? 'hourly' : 'daily'}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch historical data');
            }

            const data = await response.json();
            const prices = data.prices;
            
            // Update price history with real data
            this.priceHistory = prices.map(point => ({
                time: new Date(point[0]),
                price: point[1]
            }));

            this.updateChart();
            
        } catch (error) {
            console.error('Error fetching historical data:', error);
            // Keep current chart data if API fails
        }
    }

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
            const data = JSON.parse(saved);
            this.userStats = data.userStats || this.userStats;
            this.tradeHistory = data.tradeHistory || [];
            this.activeTrades = data.activeTrades || [];
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
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CryptoOptionsGame();
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