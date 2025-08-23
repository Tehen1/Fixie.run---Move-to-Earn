// Fixie.run PWA Application
class FixieApp {
    constructor() {
        this.currentView = 'home';
        this.currentTab = 'overview';
        this.workoutActive = false;
        this.workoutStartTime = null;
        this.workoutTimer = null;
        this.map = null;
        this.charts = {};
        
        // Simulated workout data
        this.workoutData = {
            speed: 0,
            distance: 0,
            time: 0,
            calories: 0,
            tokens: 0
        };

        // Application data from JSON
        this.appData = {
            user_stats: {
                total_rides: 3932,
                total_distance: 10606.8,
                total_hours: 1253.0,
                average_distance: 2.7,
                growth_rate: 18,
                fixie_tokens: 8550,
                weekly_tokens: 855,
                tokens_per_km: 0.8,
                urban_grade: "A+"
            },
            personal_records: {
                longest_distance: 93.4,
                fastest_speed: 33.7,
                max_calories: 2803,
                max_power: 285,
                best_cadence: 95
            },
            activity_breakdown: {
                total_workouts: 3932,
                cycling_sessions: 3932,
                running_sessions: 0,
                avg_duration: 19,
                avg_heart_rate: 145
            },
            trends: {
                distance_average: 2.7,
                distance_maximum: 93.4,
                distance_30_days: 119,
                speed_average: 10.7,
                speed_maximum: 33.7,
                cardio_zones: 65
            },
            urban_performance: {
                vitesse: {score: 0, level: "Débutant"},
                endurance: {score: 27, level: "Débutant"}, 
                regularite: {score: 100, level: "Expert"},
                exploration: {score: 73, level: "Avancé"},
                navigation: {score: 0, level: "Débutant"},
                efficacite: {score: 70, level: "Avancé"}
            },
            urban_challenges: {
                feux_rouges: 85,
                trafic_dense: 78,
                cotes: 92,
                intersections: 88,
                meteo: 76,
                securite: 95
            },
            time_performance: {
                matin: {trips: 45, efficiency: 85},
                midi: {trips: 28, efficiency: 72},
                apres_midi: {trips: 52, efficiency: 78},
                soir: {trips: 38, efficiency: 88},
                nuit: {trips: 12, efficiency: 65}
            },
            zones_performance: {
                centre_ville: {efficiency: 89, type: "Zone favorite"},
                banlieue: {efficiency: 92, type: "Zone vitesse"},
                quartiers: {efficiency: 85, type: "Zone exploration"},
                peripherie: {efficiency: 94, type: "Zone endurance"}
            },
            ecological_impact: {
                co2_saved: 1272.8,
                trees_equivalent: 530,
                fuel_saved: 848.5
            },
            yearly_data: {
                2021: {rides: 650, tokens: 520},
                2022: {rides: 890, tokens: 712},
                2023: {rides: 1150, tokens: 920},
                2024: {rides: 1242, tokens: 1242},
                2025: {rides: 3932, tokens: 8550}
            }
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeMap();
        this.registerServiceWorker();
        this.requestWakeLock();
        
        // Initial view setup
        this.switchView('home');
        
        console.log('Fixie.run PWA initialized');
    }

    setupEventListeners() {
        // Bottom navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // Analytics tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Workout controls - Fix the event listener setup
        document.addEventListener('click', (e) => {
            // Start workout button
            if (e.target.id === 'start-workout' || e.target.closest('#start-workout')) {
                e.preventDefault();
                this.startWorkout();
            }
            // Close workout button
            else if (e.target.id === 'close-workout' || e.target.closest('#close-workout')) {
                e.preventDefault();
                this.closeWorkout();
            }
            // Pause workout button
            else if (e.target.id === 'pause-workout' || e.target.closest('#pause-workout')) {
                e.preventDefault();
                this.pauseWorkout();
            }
            // Stop workout button
            else if (e.target.id === 'stop-workout' || e.target.closest('#stop-workout')) {
                e.preventDefault();
                this.stopWorkout();
            }
        });

        // Settings toggles
        document.querySelectorAll('.toggle-switch input').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                this.handleToggle(e.target.id, e.target.checked);
            });
        });

        // Workout categories
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        // Integration items
        document.querySelectorAll('.integration-item:not(.connected)').forEach(item => {
            item.addEventListener('click', () => {
                item.classList.add('connected');
                item.querySelector('.integration-status').textContent = '✅ Connecté';
                this.showNotification('Service connecté avec succès!');
            });
        });

        // Haptic feedback for buttons
        document.querySelectorAll('button, .nav-item, .tab-btn').forEach(element => {
            element.addEventListener('click', () => {
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            });
        });
    }

    switchView(viewName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const navItem = document.querySelector(`[data-view="${viewName}"]`);
        if (navItem) navItem.classList.add('active');

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) targetView.classList.add('active');

        this.currentView = viewName;

        // Initialize view-specific content
        if (viewName === 'analytics') {
            setTimeout(() => this.setupCharts(), 100);
        }

        // Update page title
        document.title = `Fixie.run - ${this.capitalizeFirst(viewName)}`;
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) activeTab.classList.add('active');

        // Update tab content - Fix the tab content switching
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const targetContent = document.getElementById(`${tabName}-tab`);
        if (targetContent) {
            targetContent.classList.add('active');
        }

        this.currentTab = tabName;

        // Initialize tab-specific charts
        setTimeout(() => this.setupTabCharts(tabName), 200);
    }

    setupCharts() {
        if (this.currentView === 'analytics') {
            this.setupTabCharts(this.currentTab);
        }
    }

    setupTabCharts(tabName) {
        const colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B'];
        
        switch (tabName) {
            case 'overview':
                this.createYearlyChart(colors);
                break;
            case 'trends':
                this.createDistanceTrendChart(colors);
                this.createSpeedTrendChart(colors);
                break;
            case 'ecological':
                this.createEcologicalChart(colors);
                break;
        }
    }

    createYearlyChart(colors) {
        const ctx = document.getElementById('yearly-chart');
        if (!ctx) return;

        if (this.charts.yearly) {
            this.charts.yearly.destroy();
        }

        const years = Object.keys(this.appData.yearly_data);
        const rides = years.map(year => this.appData.yearly_data[year].rides);
        const tokens = years.map(year => this.appData.yearly_data[year].tokens);

        this.charts.yearly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [{
                    label: 'Trajets',
                    data: rides,
                    backgroundColor: colors[0] + '80',
                    borderColor: colors[0],
                    borderWidth: 2,
                    yAxisID: 'y'
                }, {
                    label: 'Tokens FIXIE',
                    data: tokens,
                    type: 'line',
                    backgroundColor: colors[1] + '20',
                    borderColor: colors[1],
                    borderWidth: 3,
                    fill: true,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#ffffff' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        ticks: { color: '#ffffff' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        ticks: { color: '#ffffff' },
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
    }

    createDistanceTrendChart(colors) {
        const ctx = document.getElementById('distance-trend-chart');
        if (!ctx) return;

        if (this.charts.distanceTrend) {
            this.charts.distanceTrend.destroy();
        }

        // Generate sample 30-day data
        const last30Days = [];
        const distances = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last30Days.push(date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }));
            distances.push(Math.random() * 15 + 1); // Random distances between 1-16km
        }

        this.charts.distanceTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last30Days,
                datasets: [{
                    label: 'Distance (km)',
                    data: distances,
                    backgroundColor: colors[0] + '20',
                    borderColor: colors[0],
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { 
                            color: '#ffffff',
                            maxTicksLimit: 7
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: {
                        ticks: { color: '#ffffff' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }

    createSpeedTrendChart(colors) {
        const ctx = document.getElementById('speed-trend-chart');
        if (!ctx) return;

        if (this.charts.speedTrend) {
            this.charts.speedTrend.destroy();
        }

        // Generate sample speed data
        const hours = [];
        const speeds = [];
        for (let i = 0; i < 24; i++) {
            hours.push(`${i}:00`);
            speeds.push(Math.random() * 20 + 5); // Random speeds between 5-25 km/h
        }

        this.charts.speedTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: hours,
                datasets: [{
                    label: 'Vitesse Moyenne (km/h)',
                    data: speeds,
                    backgroundColor: colors[2] + '20',
                    borderColor: colors[2],
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { 
                            color: '#ffffff',
                            maxTicksLimit: 8
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: {
                        ticks: { color: '#ffffff' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }

    createEcologicalChart(colors) {
        const ctx = document.getElementById('ecological-chart');
        if (!ctx) return;

        if (this.charts.ecological) {
            this.charts.ecological.destroy();
        }

        this.charts.ecological = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['CO₂ économisé (kg)', 'Équivalent arbres', 'Essence économisée (L)'],
                datasets: [{
                    data: [
                        this.appData.ecological_impact.co2_saved,
                        this.appData.ecological_impact.trees_equivalent,
                        this.appData.ecological_impact.fuel_saved
                    ],
                    backgroundColor: [colors[4], colors[1], colors[2]],
                    borderColor: [colors[4], colors[1], colors[2]],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#ffffff',
                            padding: 20
                        }
                    }
                }
            }
        });
    }

    initializeMap() {
        try {
            if (this.map) {
                this.map.remove();
            }

            // Paris coordinates as default
            const map = L.map('map', {
                zoomControl: false,
                attributionControl: false
            }).setView([48.8566, 2.3522], 13);

            // Dark tile layer for cyberpunk theme
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(map);

            // Add a glowing marker for user location
            const userMarker = L.circleMarker([48.8566, 2.3522], {
                radius: 8,
                fillColor: '#00d4ff',
                color: '#00d4ff',
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.6
            }).addTo(map);

            // Add pulsing animation
            userMarker.bindPopup('Votre position actuelle').openPopup();

            this.map = map;

            // Simulate GPS updates during workout
            if (this.workoutActive) {
                this.simulateGPSMovement();
            }

        } catch (error) {
            console.error('Map initialization error:', error);
            // Fallback: show a static image or message
            const mapContainer = document.getElementById('map');
            if (mapContainer) {
                mapContainer.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #ffffff; background: rgba(0, 212, 255, 0.1); border-radius: 12px;">🗺️ Carte GPS</div>';
            }
        }
    }

    simulateGPSMovement() {
        if (!this.workoutActive || !this.map) return;

        // Simulate movement by updating marker position
        const currentCenter = this.map.getCenter();
        const newLat = currentCenter.lat + (Math.random() - 0.5) * 0.001;
        const newLng = currentCenter.lng + (Math.random() - 0.5) * 0.001;

        // Update map center smoothly
        this.map.panTo([newLat, newLng], {
            animate: true,
            duration: 1.0
        });

        // Continue simulation
        setTimeout(() => this.simulateGPSMovement(), 5000);
    }

    startWorkout() {
        console.log('Starting workout...');
        
        this.workoutActive = true;
        this.workoutStartTime = Date.now();
        this.workoutData = { speed: 0, distance: 0, time: 0, calories: 0, tokens: 0 };

        // Show workout modal
        const modal = document.getElementById('workout-modal');
        if (modal) {
            modal.classList.remove('hidden');
            console.log('Workout modal opened');
        } else {
            console.error('Workout modal not found');
        }

        // Start workout timer
        this.workoutTimer = setInterval(() => {
            this.updateWorkoutMetrics();
        }, 1000);

        // Request wake lock to keep screen on
        this.requestWakeLock();

        // Start GPS simulation
        this.simulateGPSMovement();

        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }

        this.showNotification('Entraînement démarré! 🚴‍♂️');
        console.log('Workout started successfully');
    }

    updateWorkoutMetrics() {
        if (!this.workoutActive) return;

        const elapsed = (Date.now() - this.workoutStartTime) / 1000;
        
        // Simulate realistic workout data
        const baseSpeed = 8 + Math.random() * 10; // 8-18 km/h
        const speedVariation = Math.sin(elapsed / 30) * 3; // Speed variation over time
        this.workoutData.speed = Math.max(0, baseSpeed + speedVariation);
        
        this.workoutData.time = elapsed;
        this.workoutData.distance += (this.workoutData.speed / 3600); // Convert to km
        this.workoutData.calories = Math.floor(this.workoutData.distance * 45); // ~45 cal/km
        this.workoutData.tokens = Math.floor(this.workoutData.distance * 0.8); // 0.8 tokens/km

        // Update UI
        this.updateWorkoutDisplay();
        this.updateHomeDisplay();
    }

    updateWorkoutDisplay() {
        const elements = {
            'workout-speed': this.workoutData.speed.toFixed(1),
            'workout-distance': this.workoutData.distance.toFixed(2),
            'workout-time': this.formatTime(this.workoutData.time),
            'workout-calories': this.workoutData.calories.toString(),
            'workout-tokens': this.workoutData.tokens.toString()
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    updateHomeDisplay() {
        const elements = {
            'current-speed': `${this.workoutData.speed.toFixed(1)} km/h`,
            'current-distance': `${this.workoutData.distance.toFixed(1)} km`,
            'current-time': this.formatTime(this.workoutData.time)
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    pauseWorkout() {
        if (this.workoutTimer) {
            clearInterval(this.workoutTimer);
            this.workoutTimer = null;
        }
        
        const pauseBtn = document.getElementById('pause-workout');
        if (pauseBtn.textContent.includes('Pause')) {
            pauseBtn.innerHTML = '▶ Reprendre';
            this.showNotification('Entraînement en pause');
        } else {
            pauseBtn.innerHTML = '⏸ Pause';
            this.workoutTimer = setInterval(() => {
                this.updateWorkoutMetrics();
            }, 1000);
            this.showNotification('Entraînement repris');
        }

        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }
    }

    stopWorkout() {
        this.workoutActive = false;
        
        if (this.workoutTimer) {
            clearInterval(this.workoutTimer);
            this.workoutTimer = null;
        }

        // Save workout data
        this.saveWorkoutData();

        // Close modal
        this.closeWorkout();

        // Show completion notification
        this.showNotification(`Entraînement terminé! ${this.workoutData.distance.toFixed(2)} km • ${this.workoutData.tokens} FIXIE gagnés`);

        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }

        console.log('Workout completed:', this.workoutData);
    }

    closeWorkout() {
        const modal = document.getElementById('workout-modal');
        if (modal) {
            modal.classList.add('hidden');
        }

        // Reset button text
        const pauseBtn = document.getElementById('pause-workout');
        if (pauseBtn) pauseBtn.innerHTML = '⏸ Pause';
        
        // Stop workout if still active
        if (this.workoutActive) {
            this.stopWorkout();
        }
    }

    saveWorkoutData() {
        // Save to localStorage for persistence
        const workouts = JSON.parse(localStorage.getItem('fixie_workouts') || '[]');
        const workout = {
            id: Date.now(),
            date: new Date().toISOString(),
            type: 'cycling',
            ...this.workoutData,
            duration: this.workoutData.time
        };
        
        workouts.unshift(workout);
        localStorage.setItem('fixie_workouts', JSON.stringify(workouts.slice(0, 50))); // Keep last 50 workouts
    }

    handleToggle(toggleId, isChecked) {
        console.log(`Toggle ${toggleId}:`, isChecked);
        
        switch (toggleId) {
            case 'notifications':
                if (isChecked && 'Notification' in window) {
                    Notification.requestPermission();
                }
                break;
            case 'dark-mode':
                // Already in dark mode, this would toggle light mode
                break;
            case 'gps-precision':
                // Would affect GPS tracking accuracy
                break;
        }

        // Save setting
        localStorage.setItem(`fixie_${toggleId}`, isChecked);
        
        this.showNotification(`Paramètre ${toggleId} ${isChecked ? 'activé' : 'désactivé'}`);
    }

    showNotification(message, duration = 3000) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 212, 255, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-family: 'Orbitron', monospace;
            font-size: 14px;
            font-weight: 500;
            z-index: 1000;
            box-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
            animation: slideDown 0.3s ease-out;
        `;

        // Add animation keyframes
        if (!document.querySelector('#toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                @keyframes slideDown {
                    from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                @keyframes slideUp {
                    from { opacity: 1; transform: translateX(-50%) translateY(0); }
                    to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideUp 0.3s ease-out';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    async requestWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                const wakeLock = await navigator.wakeLock.request('screen');
                console.log('Screen wake lock active');
                
                wakeLock.addEventListener('release', () => {
                    console.log('Screen wake lock released');
                });
            }
        } catch (err) {
            console.error('Wake lock failed:', err);
        }
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                // Create and register a simple service worker for PWA functionality
                const swCode = `
                    const CACHE_NAME = 'fixie-v1';
                    const urlsToCache = [
                        '/',
                        '/index.html',
                        '/style.css',
                        '/app.js'
                    ];

                    self.addEventListener('install', event => {
                        event.waitUntil(
                            caches.open(CACHE_NAME)
                                .then(cache => cache.addAll(urlsToCache))
                        );
                    });

                    self.addEventListener('fetch', event => {
                        event.respondWith(
                            caches.match(event.request)
                                .then(response => {
                                    if (response) {
                                        return response;
                                    }
                                    return fetch(event.request);
                                })
                        );
                    });
                `;

                const blob = new Blob([swCode], { type: 'application/javascript' });
                const swUrl = URL.createObjectURL(blob);

                const registration = await navigator.serviceWorker.register(swUrl);
                console.log('ServiceWorker registered:', registration);
            } catch (error) {
                console.error('ServiceWorker registration failed:', error);
            }
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Utility method to simulate network requests
    async simulateApiCall(endpoint, delay = 1000) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ success: true, endpoint });
            }, delay);
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add loading animation
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease-in-out';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
        
        // Initialize the app
        window.fixieApp = new FixieApp();
        
        // Add custom cursor trail effect (cyberpunk aesthetic)
        let trail = [];
        document.addEventListener('mousemove', (e) => {
            trail.push({ x: e.clientX, y: e.clientY, time: Date.now() });
            trail = trail.filter(point => Date.now() - point.time < 500);
        });

        // Add cyberpunk glitch effect on page transitions
        const addGlitchEffect = () => {
            document.body.style.filter = 'hue-rotate(90deg)';
            setTimeout(() => {
                document.body.style.filter = 'none';
            }, 100);
        };

        // Apply glitch effect occasionally
        setInterval(() => {
            if (Math.random() < 0.05) { // 5% chance every interval
                addGlitchEffect();
            }
        }, 5000);

        console.log('🚴 Fixie.run PWA loaded successfully!');
        console.log('💎 Cyberpunk theme activated');
        console.log('🌟 Ready to earn FIXIE tokens!');
        
    }, 500);
});

// Handle visibility change for workout persistence
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.fixieApp && window.fixieApp.workoutActive) {
        console.log('App backgrounded during workout - maintaining session');
    } else if (!document.hidden && window.fixieApp && window.fixieApp.workoutActive) {
        console.log('App foregrounded - resuming workout display');
    }
});

// Handle before unload for workout data
window.addEventListener('beforeunload', (e) => {
    if (window.fixieApp && window.fixieApp.workoutActive) {
        e.preventDefault();
        e.returnValue = 'Vous avez un entraînement en cours. Êtes-vous sûr de vouloir quitter?';
        return e.returnValue;
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    if (window.fixieApp) {
        window.fixieApp.showNotification('Connexion rétablie');
    }
});

window.addEventListener('offline', () => {
    if (window.fixieApp) {
        window.fixieApp.showNotification('Mode hors-ligne activé');
    }
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FixieApp;
}