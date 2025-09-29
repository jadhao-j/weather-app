// Advanced Weather Dashboard JavaScript
class WeatherApp {
  constructor() {
    this.apiKey = "7a010613f662b56185d6923aa16b732e";
    this.baseUrl = "https://api.openweathermap.org/data/2.5";
    this.geoUrl = "https://api.openweathermap.org/geo/1.0";
    this.currentTheme = localStorage.getItem('theme') || 'light';
    this.favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    this.searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
    this.charts = {};
    
    // Initialize database
    this.database = new WeatherDatabase();
    
    this.initializeApp();
  }

  initializeApp() {
    this.setupEventListeners();
    this.applyTheme();
    this.loadFavorites();
    this.setupSearchSuggestions();
    this.loadCurrentLocation();
  }

  setupEventListeners() {
    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', () => this.searchWeather());
    document.getElementById('cityInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.searchWeather();
    });

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

    // Location button
    document.getElementById('locationBtn').addEventListener('click', () => this.getCurrentLocation());

    // Quick action buttons
    document.querySelectorAll('.quick-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const city = e.currentTarget.dataset.city;
        document.getElementById('cityInput').value = city;
        this.searchWeather();
      });
    });

    // Search input for suggestions
    document.getElementById('cityInput').addEventListener('input', (e) => {
      this.handleSearchInput(e.target.value);
    });
  }

  async searchWeather() {
    const city = document.getElementById('cityInput').value.trim();
    if (!city) {
      this.showNotification('Please enter a city name', 'warning');
      return;
    }

    // City name validation and suggestions
    const citySuggestions = {
      'nagpur city': 'Nagpur',
      'nagpur city maharashtra': 'Nagpur',
      'mumbai city': 'Mumbai',
      'delhi city': 'Delhi',
      'bangalore city': 'Bangalore',
      'kolkata city': 'Kolkata',
      'chennai city': 'Chennai',
      'hyderabad city': 'Hyderabad',
      'pune city': 'Pune'
    };

    const normalizedCity = city.toLowerCase();
    if (citySuggestions[normalizedCity]) {
      document.getElementById('cityInput').value = citySuggestions[normalizedCity];
      this.showNotification(`Searching for ${citySuggestions[normalizedCity]} instead`, 'info');
    }

    this.showLoading(true);
    
    try {
      // Get current weather
      const currentWeather = await this.fetchCurrentWeather(city);
      
      // Get 5-day forecast
      const forecast = await this.fetchForecast(city);
      
      // Display results
      this.displayCurrentWeather(currentWeather);
      this.displayForecast(forecast);
      this.displayCharts(forecast);
      this.displayAdditionalInfo(currentWeather);
      
      // Add to search history
      this.addToSearchHistory(city);
      
      // Save to database
      try {
        await this.database.saveWeatherSearch(city, currentWeather);
        console.log('Weather search saved to database');
      } catch (error) {
        console.warn('Failed to save to database:', error);
      }
      
      // Show weather content
      document.getElementById('weatherContent').style.display = 'block';
      document.getElementById('weatherContent').classList.add('fade-in-up');
      
      this.showNotification(`Weather data loaded for ${currentWeather.name}`, 'success');
      
    } catch (error) {
      console.error('Error fetching weather:', error);
      
      // Provide helpful error messages
      if (error.message.includes('not found')) {
        this.showNotification(`City "${city}" not found. Try: "Nagpur", "Mumbai", "Delhi", or "Bangalore"`, 'error');
      } else if (error.message.includes('API key')) {
        this.showNotification('API configuration error. Please contact support.', 'error');
      } else {
        this.showNotification('Network error. Please check your internet connection and try again.', 'error');
      }
    } finally {
      this.showLoading(false);
    }
  }

  async fetchCurrentWeather(city) {
    const response = await fetch(
      `${this.baseUrl}/weather?q=${city}&appid=${this.apiKey}&units=metric`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.cod === '404') {
        throw new Error(`City "${city}" not found. Please try a different city name.`);
      } else if (errorData.cod === '401') {
        throw new Error('Invalid API key. Please check the configuration.');
      } else {
        throw new Error(`API Error: ${errorData.message || 'Unknown error occurred'}`);
      }
    }
    
    return await response.json();
  }

  async fetchForecast(city) {
    const response = await fetch(
      `${this.baseUrl}/forecast?q=${city}&appid=${this.apiKey}&units=metric`
    );
    
    if (!response.ok) {
      throw new Error('Forecast not available');
    }
    
    return await response.json();
  }

  displayCurrentWeather(data) {
    const card = document.getElementById('currentWeatherCard');
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    card.innerHTML = `
      <div class="weather-header">
        <div class="weather-location">
          <h2>${data.name}, ${data.sys.country}</h2>
          <p class="weather-date">${currentDate}</p>
        </div>
        <button class="btn btn-outline-primary" onclick="weatherApp.addToFavorites('${data.name}')">
          <i class="fas fa-heart"></i> Add to Favorites
        </button>
      </div>
      
      <div class="weather-main">
        <div class="weather-icon-container">
          <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png" 
               alt="${data.weather[0].description}" class="weather-icon">
          <p class="weather-description">${data.weather[0].description}</p>
        </div>
        
        <div class="weather-temp-container">
          <div class="weather-temp">${Math.round(data.main.temp)}°C</div>
          <div class="weather-feels-like">Feels like ${Math.round(data.main.feels_like)}°C</div>
        </div>
      </div>
      
      <div class="weather-details">
        <div class="detail-item">
          <div class="detail-icon"><i class="fas fa-thermometer-half"></i></div>
          <div class="detail-value">${Math.round(data.main.temp_min)}° / ${Math.round(data.main.temp_max)}°</div>
          <div class="detail-label">Min / Max</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-icon"><i class="fas fa-tint"></i></div>
          <div class="detail-value">${data.main.humidity}%</div>
          <div class="detail-label">Humidity</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-icon"><i class="fas fa-wind"></i></div>
          <div class="detail-value">${data.wind.speed} m/s</div>
          <div class="detail-label">Wind Speed</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-icon"><i class="fas fa-eye"></i></div>
          <div class="detail-value">${data.visibility / 1000} km</div>
          <div class="detail-label">Visibility</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-icon"><i class="fas fa-compress-arrows-alt"></i></div>
          <div class="detail-value">${data.main.pressure} hPa</div>
          <div class="detail-label">Pressure</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-icon"><i class="fas fa-sun"></i></div>
          <div class="detail-value">${new Date(data.sys.sunrise * 1000).toLocaleTimeString()}</div>
          <div class="detail-label">Sunrise</div>
        </div>
      </div>
    `;
  }

  displayForecast(data) {
    const container = document.getElementById('forecastContainer');
    const dailyForecasts = this.groupForecastByDay(data.list);
    
    container.innerHTML = dailyForecasts.map(day => `
      <div class="forecast-card">
        <div class="forecast-day">${day.date}</div>
        <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png" 
             alt="${day.description}" class="forecast-icon">
        <div class="forecast-temp">${day.temp}°C</div>
        <div class="forecast-description">${day.description}</div>
        <div class="forecast-details">
          <small>Min: ${day.tempMin}°C | Max: ${day.tempMax}°C</small>
        </div>
      </div>
    `).join('');
  }

  groupForecastByDay(forecastList) {
    const dailyData = {};
    
    forecastList.forEach(item => {
      const date = new Date(item.dt * 1000).toDateString();
      if (!dailyData[date]) {
        dailyData[date] = {
          date: new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' }),
          temp: Math.round(item.main.temp),
          tempMin: Math.round(item.main.temp_min),
          tempMax: Math.round(item.main.temp_max),
          description: item.weather[0].description,
          icon: item.weather[0].icon,
          humidity: item.main.humidity,
          windSpeed: item.wind.speed
        };
        } else {
        // Update with max/min temps
        dailyData[date].tempMin = Math.min(dailyData[date].tempMin, Math.round(item.main.temp_min));
        dailyData[date].tempMax = Math.max(dailyData[date].tempMax, Math.round(item.main.temp_max));
      }
    });
    
    return Object.values(dailyData).slice(0, 5);
  }

  displayCharts(forecastData) {
    // Show loading state for charts
    const tempContainer = document.querySelector('#temperatureChart').parentElement;
    const humidityContainer = document.querySelector('#humidityChart').parentElement;
    
    // Store original canvas elements
    const tempCanvas = document.getElementById('temperatureChart');
    const humidityCanvas = document.getElementById('humidityChart');
    
    // Show loading spinners
    tempContainer.innerHTML = `
      <div class="d-flex justify-content-center align-items-center" style="height: 150px;">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading temperature chart...</span>
        </div>
      </div>
    `;
    
    humidityContainer.innerHTML = `
      <div class="d-flex justify-content-center align-items-center" style="height: 150px;">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading humidity chart...</span>
        </div>
      </div>
    `;
    
    // Lazy load charts with a small delay to improve performance
    setTimeout(() => {
      // Restore temperature chart canvas
      tempContainer.innerHTML = '<canvas id="temperatureChart"></canvas>';
      this.createTemperatureChart(forecastData);
    }, 100);
    
    setTimeout(() => {
      // Restore humidity chart canvas
      humidityContainer.innerHTML = '<canvas id="humidityChart"></canvas>';
      this.createHumidityChart(forecastData);
    }, 200);
  }

  createTemperatureChart(forecastData) {
    const canvas = document.getElementById('temperatureChart');
    if (!canvas) {
      console.warn('Temperature chart canvas not found');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    
    if (this.charts.temperature) {
      this.charts.temperature.destroy();
    }
    
    const dailyData = this.groupForecastByDay(forecastData.list);
    const labels = dailyData.map(day => day.date.substring(0, 3)); // Short day names
    const temps = dailyData.map(day => day.temp);
    const minTemps = dailyData.map(day => day.tempMin);
    const maxTemps = dailyData.map(day => day.tempMax);
    
    this.charts.temperature = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Avg',
            data: temps,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Min',
            data: minTemps,
            borderColor: '#4ecdc4',
            backgroundColor: 'rgba(78, 205, 196, 0.1)',
            tension: 0.4,
            fill: false,
            pointRadius: 3,
            pointHoverRadius: 5
          },
          {
            label: 'Max',
            data: maxTemps,
            borderColor: '#f093fb',
            backgroundColor: 'rgba(240, 147, 251, 0.1)',
            tension: 0.4,
            fill: false,
            pointRadius: 3,
            pointHoverRadius: 5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1000, // Reduced animation time
          easing: 'easeInOutQuart'
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 11
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 10
              }
            }
          },
          y: {
            beginAtZero: false,
            grid: {
              color: 'rgba(0,0,0,0.1)'
            },
            ticks: {
              font: {
                size: 10
              }
            },
            title: {
              display: true,
              text: '°C',
              font: {
                size: 11
              }
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

  createHumidityChart(forecastData) {
    const canvas = document.getElementById('humidityChart');
    if (!canvas) {
      console.warn('Humidity chart canvas not found');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    
    if (this.charts.humidity) {
      this.charts.humidity.destroy();
    }
    
    const dailyData = this.groupForecastByDay(forecastData.list);
    const labels = dailyData.map(day => day.date.substring(0, 3)); // Short day names
    const humidity = dailyData.map(day => day.humidity);
    const pressure = forecastData.list.slice(0, 5).map(item => item.main.pressure);
    
    this.charts.humidity = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Humidity %',
            data: humidity,
            backgroundColor: 'rgba(78, 205, 196, 0.7)',
            borderColor: '#4ecdc4',
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false
          },
          {
            label: 'Pressure hPa',
            data: pressure,
            backgroundColor: 'rgba(102, 126, 234, 0.7)',
            borderColor: '#667eea',
            borderWidth: 1,
            yAxisID: 'y1',
            borderRadius: 4,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 800, // Reduced animation time
          easing: 'easeInOutQuart'
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 11
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 10
              }
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            grid: {
              color: 'rgba(0,0,0,0.1)'
            },
            ticks: {
              font: {
                size: 10
              }
            },
            title: {
              display: true,
              text: 'Humidity %',
              font: {
                size: 11
              }
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: {
              drawOnChartArea: false,
            },
            ticks: {
              font: {
                size: 10
              }
            },
            title: {
              display: true,
              text: 'Pressure hPa',
              font: {
                size: 11
              }
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

  displayAdditionalInfo(data) {
    // UV Index (mock data since it requires separate API call)
    document.getElementById('uvIndex').textContent = Math.floor(Math.random() * 11);
    
    // Visibility
    document.getElementById('visibility').textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    
    // Wind Direction
    const windDirection = this.getWindDirection(data.wind.deg);
    document.getElementById('windDirection').textContent = `${windDirection} (${data.wind.deg}°)`;
  }

  getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', this.currentTheme);
    this.applyTheme();
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    const themeIcon = document.querySelector('#themeToggle i');
    themeIcon.className = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
  }

  async getCurrentLocation() {
    if (!navigator.geolocation) {
      this.showNotification('Geolocation is not supported by this browser', 'error');
      return;
    }

    this.showLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `${this.geoUrl}/reverse?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}`
          );
          const data = await response.json();
          
          if (data.length > 0) {
            const city = data[0].name;
            document.getElementById('cityInput').value = city;
            await this.searchWeather();
          }
        } catch (error) {
          this.showNotification('Failed to get location data', 'error');
        } finally {
          this.showLoading(false);
        }
      },
      (error) => {
        this.showNotification('Unable to retrieve your location', 'error');
        this.showLoading(false);
      }
    );
  }

  addToFavorites(cityName) {
    if (!this.favorites.includes(cityName)) {
      this.favorites.push(cityName);
      localStorage.setItem('favorites', JSON.stringify(this.favorites));
      this.loadFavorites();
      this.showNotification(`${cityName} added to favorites`, 'success');
    } else {
      this.showNotification(`${cityName} is already in favorites`, 'info');
    }
  }

  removeFromFavorites(cityName) {
    this.favorites = this.favorites.filter(city => city !== cityName);
    localStorage.setItem('favorites', JSON.stringify(this.favorites));
    this.loadFavorites();
    this.showNotification(`${cityName} removed from favorites`, 'info');
  }

  loadFavorites() {
    const container = document.getElementById('favoritesContainer');
    
    if (this.favorites.length === 0) {
      container.innerHTML = '<p class="text-center text-white">No favorite cities yet. Add some cities to see them here!</p>';
      return;
    }
    
    container.innerHTML = this.favorites.map(city => `
      <div class="favorite-card" onclick="weatherApp.searchFavoriteCity('${city}')">
        <div class="favorite-header">
          <div class="favorite-city">${city}</div>
          <button class="remove-favorite" onclick="event.stopPropagation(); weatherApp.removeFromFavorites('${city}')">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="favorite-temp">--°C</div>
        <div class="favorite-description">Click to load weather</div>
      </div>
    `).join('');
  }

  async searchFavoriteCity(cityName) {
    document.getElementById('cityInput').value = cityName;
    await this.searchWeather();
  }

  addToSearchHistory(city) {
    if (!this.searchHistory.includes(city)) {
      this.searchHistory.unshift(city);
      this.searchHistory = this.searchHistory.slice(0, 10); // Keep only last 10 searches
      localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
    }
  }

  setupSearchSuggestions() {
    const input = document.getElementById('cityInput');
    const suggestions = document.getElementById('searchSuggestions');
    
    input.addEventListener('focus', () => {
      if (this.searchHistory.length > 0) {
        this.showSearchSuggestions();
      }
    });
    
    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !suggestions.contains(e.target)) {
        suggestions.style.display = 'none';
      }
    });
  }

  showSearchSuggestions() {
    const suggestions = document.getElementById('searchSuggestions');
    suggestions.innerHTML = this.searchHistory.map(city => `
      <div class="suggestion-item" onclick="weatherApp.selectSuggestion('${city}')">
        <i class="fas fa-history me-2"></i>${city}
      </div>
    `).join('');
    suggestions.style.display = 'block';
  }

  selectSuggestion(city) {
    document.getElementById('cityInput').value = city;
    document.getElementById('searchSuggestions').style.display = 'none';
    this.searchWeather();
  }

  handleSearchInput(value) {
    const suggestions = document.getElementById('searchSuggestions');
    
    if (value.length > 0) {
      const filteredHistory = this.searchHistory.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
      );
      
      if (filteredHistory.length > 0) {
        suggestions.innerHTML = filteredHistory.map(city => `
          <div class="suggestion-item" onclick="weatherApp.selectSuggestion('${city}')">
            <i class="fas fa-search me-2"></i>${city}
          </div>
        `).join('');
        suggestions.style.display = 'block';
      } else {
        suggestions.style.display = 'none';
      }
    } else {
      suggestions.style.display = 'none';
    }
  }

  showLoading(show) {
    const loadingContainer = document.getElementById('loadingContainer');
    const weatherContent = document.getElementById('weatherContent');
    
    if (show) {
      loadingContainer.style.display = 'block';
      weatherContent.style.display = 'none';
    } else {
      loadingContainer.style.display = 'none';
    }
  }

  showNotification(message, type = 'info') {
    const toast = document.getElementById('notificationToast');
    const toastBody = document.getElementById('toastBody');
    
    toastBody.textContent = message;
    
    // Add type-specific styling
    toast.className = `toast ${type}`;
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
  }

  async loadCurrentLocation() {
    // Try to load weather for user's current location on app start
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `${this.geoUrl}/reverse?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}`
            );
            const data = await response.json();
            
            if (data.length > 0) {
              const city = data[0].name;
              document.getElementById('cityInput').value = city;
              await this.searchWeather();
            }
          } catch (error) {
            console.log('Could not load current location weather');
          }
        },
        (error) => {
          console.log('Geolocation not available or denied');
        }
      );
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.weatherApp = new WeatherApp();
});

// Add some utility functions for better UX
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Add smooth scrolling for better navigation
document.addEventListener('DOMContentLoaded', () => {
  // Add smooth scroll behavior
  document.documentElement.style.scrollBehavior = 'smooth';
  
  // Add intersection observer for animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-up');
      }
    });
  }, observerOptions);
  
  // Observe all cards for animations
  document.querySelectorAll('.forecast-card, .info-card, .chart-card').forEach(card => {
    observer.observe(card);
  });
});
