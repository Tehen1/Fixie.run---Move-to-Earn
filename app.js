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
    this.geoWatchId = null;
    this.userMarker = null;
    this.pathLine = null;

    // Real workout data (no more mock data)
    this.workoutData = {
      speed: 0,
      distance: 0,
      time: 0,
      calories: 0,
      tokens: 0
    };

    // Real user data from localStorage
    this.workoutHistory = [];
    this.personalRecords = {
      longestDistance: 0,
      fastestSpeed: 0,
      longestWorkout: 0,
      mostCalories: 0
    };
    this.totalTokens = 0;
    this.todayStats = {
      distance: 0,
      duration: 0,
      calories: 0,
      tokens: 0
    };

    this.init();
  }

  init() {
    console.log('🚀 Initializing Fixie.run PWA...');
    
    this.loadUserData();
    this.setupEventListeners();
    this.enableGPS();
    this.updateAllUI();
    this.switchView('home');
    
    console.log('✅ Fixie.run PWA initialized');
  }

  // Load data from localStorage
  loadUserData() {
    try {
      const saved = JSON.parse(localStorage.getItem('fixie_state') || '{}');
      this.workoutHistory = saved.workoutHistory || [];
      this.personalRecords = saved.personalRecords || {
        longestDistance: 0, fastestSpeed: 0, longestWorkout: 0, mostCalories: 0
      };
      this.totalTokens = saved.totalTokens || 0;
      this.todayStats = saved.todayStats || {
        distance: 0, duration: 0, calories: 0, tokens: 0
      };
    } catch (error) {
      console.log('No saved data found, starting fresh');
    }
  }

  // Save data to localStorage  
  saveUserData() {
    try {
      localStorage.setItem('fixie_state', JSON.stringify({
        workoutHistory: this.workoutHistory,
        personalRecords: this.personalRecords,
        totalTokens: this.totalTokens,
        todayStats: this.todayStats,
        lastSaved: Date.now()
      }));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }

  // Enable GPS tracking
  enableGPS() {
    const statusEl = document.getElementById('gps-status-text');
    
    if (!navigator.geolocation) {
      statusEl.textContent = 'GPS non supporté';
      this.initializeMap([48.8566, 2.3522]); // Paris fallback
      return;
    }

    statusEl.textContent = 'Recherche GPS...';
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        statusEl.textContent = `GPS actif (±${Math.round(position.coords.accuracy)}m)`;
        this.initializeMap([latitude, longitude]);
        this.startGPSTracking();
      },
      (error) => {
        console.warn('GPS error:', error);
        statusEl.textContent = 'GPS indisponible';
        this.initializeMap([48.8566, 2.3522]); // Paris fallback
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000, 
        maximumAge: 5000 
      }
    );
  }

  // Initialize map
  initializeMap(center = [48.8566, 2.3522]) {
    try {
      if (this.map) this.map.remove();
      
      this.map = L.map('map', { 
        zoomControl: false, 
        attributionControl: false 
      }).setView(center, 15);

      // Dark tile layer for cyberpunk theme
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(this.map);

      // User marker
      this.userMarker = L.circleMarker(center, {
        radius: 8,
        fillColor: '#00d4ff',
        color: '#00d4ff',
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.6
      }).addTo(this.map);

      // Workout path
      this.pathLine = L.polyline([], {
        color: '#00d4ff',
        weight: 4,
        opacity: 0.8
      }).addTo(this.map);

      console.log('✅ Map initialized');
    } catch (error) {
      console.error('❌ Map initialization failed:', error);
      const mapContainer = document.getElementById('map');
      if (mapContainer) {
        mapContainer.innerHTML = '<div style="padding:20px;text-align:center;color:#fff;">Carte indisponible</div>';
      }
    }
  }

  // Start GPS tracking
  startGPSTracking() {
    if (navigator.geolocation) {
      this.geoWatchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy, speed } = position.coords;
          const newPos = [latitude, longitude];
          
          // Update marker position
          if (this.userMarker) {
            this.userMarker.setLatLng(newPos);
          }
          
          // Update during workout
          if (this.workoutActive) {
            this.updateWorkoutGPS(position);
          }
        },
        (error) => console.warn('GPS tracking error:', error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 3000
        }
      );
    }
  }

  // Update workout with GPS data
  updateWorkoutGPS(position) {
    const { latitude, longitude, accuracy, speed } = position.coords;
    const coords = this.pathLine.getLatLngs();
    
    if (accuracy < 50) { // Only use accurate positions
      const newPoint = [latitude, longitude];
      
      if (coords.length > 0) {
        const lastPoint = coords[coords.length - 1];
        const distance = this.calculateDistance(
          lastPoint.lat, lastPoint.lng,
          latitude, longitude
        );
        
        // Only add if moved more than 3 meters
        if (distance > 3) {
          this.pathLine.addLatLng(newPoint);
          this.workoutData.distance += distance / 1000; // Convert to km
        }
      } else {
        this.pathLine.addLatLng(newPoint);
      }
      
      // Update speed
      if (speed !== null && speed >= 0) {
        this.workoutData.speed = speed * 3.6; // Convert m/s to km/h
      }
      
      // Center map on current position
      if (this.map) {
        this.map.panTo(newPoint, { animate: true, duration: 0.5 });
      }
    }
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Event listeners
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

    // Workout controls
    document.getElementById('start-workout')?.addEventListener('click', () => {
      this.startWorkout();
    });

    document.getElementById('close-workout')?.addEventListener('click', () => {
      this.closeWorkout();
    });

    document.getElementById('stop-workout')?.addEventListener('click', () => {
      this.stopWorkout();
    });

    document.getElementById('pause-workout')?.addEventListener('click', () => {
      this.pauseWorkout();
    });

    // Settings toggles
    document.getElementById('notifications-toggle')?.addEventListener('change', (e) => {
      console.log('Notifications:', e.target.checked);
    });

    document.getElementById('dark-mode-toggle')?.addEventListener('change', (e) => {
      document.body.classList.toggle('dark-theme', e.target.checked);
    });

    // Haptic feedback
    document.querySelectorAll('button, .nav-item, .tab-btn').forEach(element => {
      element.addEventListener('click', () => {
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      });
    });
  }

  // Start workout
  startWorkout() {
    if (this.workoutActive) return;
    
    this.workoutActive = true;
    this.workoutStartTime = Date.now();
    this.workoutData = { speed: 0, distance: 0, time: 0, calories: 0, tokens: 0 };
    
    // Clear previous path
    if (this.pathLine) {
      this.pathLine.setLatLngs([]);
    }
    
    // Show workout modal
    document.getElementById('workout-modal').classList.remove('hidden');
    
    // Start timer
    this.workoutTimer = setInterval(() => {
      this.updateWorkoutTimer();
    }, 1000);
    
    console.log('🏃‍♂️ Workout started');
  }

  // Update workout timer
  updateWorkoutTimer() {
    if (!this.workoutActive) return;
    
    const elapsed = Math.floor((Date.now() - this.workoutStartTime) / 1000);
    this.workoutData.time = elapsed;
    
    // Calculate calories (basic formula)
    const minutes = elapsed / 60;
    this.workoutData.calories = Math.floor(minutes * 8); // 8 cal/min average
    
    // Calculate tokens (basic formula)
    this.workoutData.tokens = (this.workoutData.distance * 0.5) + (minutes * 0.01);
    
    // Update UI
    const hours = Math.floor(elapsed / 3600);
    const mins = Math.floor((elapsed % 3600) / 60);
    const secs = elapsed % 60;
    
    const timerEl = document.getElementById('workout-timer');
    if (timerEl) {
      timerEl.textContent = `${hours.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
    }
    
    const distanceEl = document.getElementById('workout-distance');
    if (distanceEl) {
      distanceEl.textContent = this.workoutData.distance.toFixed(2);
    }
    
    const speedEl = document.getElementById('workout-speed');
    if (speedEl) {
      speedEl.textContent = this.workoutData.speed.toFixed(1);
    }
    
    // Update live stats
    document.getElementById('speed-live').textContent = this.workoutData.speed.toFixed(1);
    document.getElementById('distance-live').textContent = this.workoutData.distance.toFixed(2);
    document.getElementById('time-live').textContent = `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
  }

  // Stop workout
  stopWorkout() {
    if (!this.workoutActive) return;
    
    this.workoutActive = false;
    clearInterval(this.workoutTimer);
    
    // Save workout data
    const workout = {
      startTime: this.workoutStartTime,
      endTime: Date.now(),
      duration: this.workoutData.time,
      distance: this.workoutData.distance,
      maxSpeed: this.workoutData.speed, // For simplicity, using current speed
      calories: this.workoutData.calories,
      tokens: this.workoutData.tokens,
      date: new Date().toISOString().split('T')[0],
      type: 'cycling'
    };
    
    // Add to history
    this.workoutHistory.unshift(workout);
    
    // Update totals
    this.totalTokens += workout.tokens;
    this.todayStats.distance += workout.distance;
    this.todayStats.duration += workout.duration;
    this.todayStats.calories += workout.calories;
    this.todayStats.tokens += workout.tokens;
    
    // Update records
    this.personalRecords.longestDistance = Math.max(
      this.personalRecords.longestDistance, 
      workout.distance
    );
    this.personalRecords.longestWorkout = Math.max(
      this.personalRecords.longestWorkout, 
      workout.duration
    );
    this.personalRecords.mostCalories = Math.max(
      this.personalRecords.mostCalories, 
      workout.calories
    );
    
    // Save to localStorage
    this.saveUserData();
    
    // Update UI
    this.updateAllUI();
    
    // Close workout modal
    this.closeWorkout();
    
    console.log('✅ Workout saved:', workout);
  }

  // Close workout modal
  closeWorkout() {
    document.getElementById('workout-modal').classList.add('hidden');
  }

  // Pause workout
  pauseWorkout() {
    console.log('⏸️ Workout paused (feature to implement)');
  }

  // Switch views
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
  }

  // Switch analytics tabs
  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) activeTab.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    const targetContent = document.getElementById(`${tabName}-tab`);
    if (targetContent) {
      targetContent.classList.add('active');
    }

    this.currentTab = tabName;
  }

  // Setup charts with real data
  setupCharts() {
    if (this.currentView === 'analytics') {
      this.createDistanceTrendChart();
    }
  }

  // Create distance trend chart with real data
  createDistanceTrendChart() {
    const ctx = document.getElementById('distance-trend-chart');
    if (!ctx) return;

    if (this.charts.distanceTrend) {
      this.charts.distanceTrend.destroy();
    }

    // Calculate last 7 days data
    const last7Days = [];
    const distances = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      last7Days.push(date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }));
      
      // Sum distances for this day
      const dayDistance = this.workoutHistory
        .filter(w => w.date === dateStr)
        .reduce((sum, w) => sum + w.distance, 0);
        
      distances.push(dayDistance);
    }

    this.charts.distanceTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: last7Days,
        datasets: [{
          label: 'Distance (km)',
          data: distances,
          backgroundColor: 'rgba(0, 212, 255, 0.2)',
          borderColor: '#00d4ff',
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
            labels: { color: '#ffffff' }
          }
        },
        scales: {
          x: {
            ticks: { color: '#ffffff' },
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

  // Update all UI elements with real data
  updateAllUI() {
    // Hero section
    document.getElementById('hero-total-fixie').textContent = Math.floor(this.totalTokens);
    
    // Today stats
    document.getElementById('home-distance-today').textContent = this.todayStats.distance.toFixed(1);
    document.getElementById('home-duration-today').textContent = Math.floor(this.todayStats.duration / 60) + 'm';
    document.getElementById('home-calories-today').textContent = Math.floor(this.todayStats.calories);
    document.getElementById('home-tokens-today').textContent = Math.floor(this.todayStats.tokens);
    
    // Analytics stats
    const totalWorkouts = this.workoutHistory.length;
    const totalDistance = this.workoutHistory.reduce((sum, w) => sum + w.distance, 0);
    const totalDuration = this.workoutHistory.reduce((sum, w) => sum + w.duration, 0);
    const avgDistance = totalWorkouts > 0 ? totalDistance / totalWorkouts : 0;
    
    document.getElementById('total-trajets').textContent = totalWorkouts;
    document.getElementById('total-distance').textContent = totalDistance.toFixed(1) + ' km';
    document.getElementById('total-heures').textContent = (totalDuration / 3600).toFixed(1) + 'h';
    document.getElementById('moyenne-distance').textContent = avgDistance.toFixed(1) + ' km';
    document.getElementById('total-fixie').textContent = Math.floor(this.totalTokens);
    
    // Calculate weekly tokens
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const weeklyTokens = this.workoutHistory
      .filter(w => w.startTime > oneWeekAgo)
      .reduce((sum, w) => sum + w.tokens, 0);
    document.getElementById('weekly-fixie').textContent = '+' + Math.floor(weeklyTokens) + ' cette semaine';
    
    // Tokens per km
    const tokensPerKm = totalDistance > 0 ? this.totalTokens / totalDistance : 0;
    document.getElementById('tokens-par-km').textContent = tokensPerKm.toFixed(2);
    
    // Grade
    let grade = 'N/A';
    if (tokensPerKm >= 1.0) grade = 'A+';
    else if (tokensPerKm >= 0.8) grade = 'A';
    else if (tokensPerKm >= 0.6) grade = 'B';
    else if (tokensPerKm >= 0.4) grade = 'C';
    document.getElementById('grade-urbain').textContent = grade;
    
    // Personal records
    document.getElementById('rec-longue-distance').textContent = this.personalRecords.longestDistance.toFixed(1) + ' km';
    document.getElementById('rec-vitesse-max').textContent = this.personalRecords.fastestSpeed.toFixed(1) + ' km/h';
    document.getElementById('rec-calories-max').textContent = Math.floor(this.personalRecords.mostCalories);
    document.getElementById('rec-duree-max').textContent = this.formatDuration(this.personalRecords.longestWorkout);
    
    // Ecological impact (based on real distance)
    const co2Saved = totalDistance * 0.12; // 0.12 kg CO2 per km saved vs car
    const treesEquivalent = Math.floor(co2Saved / 2.4); // 1 tree absorbs ~2.4kg CO2/year
    const fuelSaved = totalDistance * 0.08; // 0.08L per km average consumption
    
    document.getElementById('eco-co2').textContent = co2Saved.toFixed(1) + ' kg';
    document.getElementById('eco-trees').textContent = treesEquivalent;
    document.getElementById('eco-fuel').textContent = fuelSaved.toFixed(1) + ' L';
    
    // Portfolio value (mock calculation)
    const portfolioValue = this.totalTokens * 0.05; // Assuming 0.05$ per FIXIE
    document.getElementById('portfolio-total').textContent = '$' + portfolioValue.toFixed(2);
    
    // Profile stats
    const level = Math.floor(this.totalTokens / 100) + 1;
    document.getElementById('profile-stats').textContent = `Niveau ${level} • ${Math.floor(this.totalTokens)} FIXIE`;
    
    // Rewards
    document.getElementById('total-rewards').textContent = Math.floor(this.totalTokens);
    document.getElementById('current-streak').textContent = this.calculateStreak();
    
    // Update daily goals progress
    this.updateGoalProgress('walk', this.todayStats.distance, 5.0);
    this.updateGoalProgress('bike', this.todayStats.distance, 15.0);
    this.updateGoalProgress('run', 0, 3.0); // No running data yet
  }

  // Update goal progress bars
  updateGoalProgress(type, current, target) {
    const progress = Math.min((current / target) * 100, 100);
    const progressEl = document.getElementById(`${type}-progress`);
    const barEl = document.getElementById(`${type}-bar`);
    
    if (progressEl) {
      progressEl.textContent = `${current.toFixed(1)} / ${target.toFixed(1)} km`;
    }
    if (barEl) {
      barEl.style.width = progress + '%';
    }
  }

  // Calculate workout streak
  calculateStreak() {
    if (this.workoutHistory.length === 0) return 0;
    
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let currentDate = new Date(today);
    
    for (let i = 0; i < 30; i++) { // Check last 30 days max
      const dateStr = currentDate.toISOString().split('T');
      const hasWorkout = this.workoutHistory.some(w => w.date === dateStr);
      
      if (hasWorkout) {
        streak++;
      } else if (dateStr !== today) { // Don't break streak for today if no workout yet
        break;
      }
      
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  }

  // Format duration in seconds to HH:MM or MM:SS
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  // Utility method
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.fixieApp = new FixieApp();
});
