// Database Integration for Weather App
// This is a basic example of how to integrate with MySQL database

class WeatherDatabase {
  constructor() {
    // Database configuration
    this.config = {
      host: 'localhost',
      user: 'your_username',
      password: 'your_password',
      database: 'weather_app',
      port: 3306
    };
    
    // For demo purposes, we'll use localStorage to simulate database
    this.isLocalStorage = true;
  }

  // Initialize database connection
  async connect() {
    if (this.isLocalStorage) {
      console.log('Using localStorage for demo database');
      return true;
    }
    
    // In a real implementation, you would use mysql2 or similar
    // const mysql = require('mysql2/promise');
    // this.connection = await mysql.createConnection(this.config);
    // return this.connection;
  }

  // Save weather search to database
  async saveWeatherSearch(city, weatherData) {
    const searchRecord = {
      id: Date.now(),
      city: city,
      temperature: weatherData.main.temp,
      humidity: weatherData.main.humidity,
      description: weatherData.weather[0].description,
      timestamp: new Date().toISOString(),
      user_ip: this.getUserIP() || 'unknown'
    };

    if (this.isLocalStorage) {
      // Save to localStorage for demo
      const searches = JSON.parse(localStorage.getItem('weather_searches') || '[]');
      searches.unshift(searchRecord);
      searches.splice(10); // Keep only last 10 searches
      localStorage.setItem('weather_searches', JSON.stringify(searches));
      return searchRecord;
    }

    // Real database implementation would be:
    // const query = 'INSERT INTO weather_searches (city, temperature, humidity, description, timestamp, user_ip) VALUES (?, ?, ?, ?, ?, ?)';
    // const [result] = await this.connection.execute(query, [
    //   searchRecord.city,
    //   searchRecord.temperature,
    //   searchRecord.humidity,
    //   searchRecord.description,
    //   searchRecord.timestamp,
    //   searchRecord.user_ip
    // ]);
    // return result;
  }

  // Get search history from database
  async getSearchHistory(limit = 10) {
    if (this.isLocalStorage) {
      const searches = JSON.parse(localStorage.getItem('weather_searches') || '[]');
      return searches.slice(0, limit);
    }

    // Real database implementation:
    // const query = 'SELECT * FROM weather_searches ORDER BY timestamp DESC LIMIT ?';
    // const [rows] = await this.connection.execute(query, [limit]);
    // return rows;
  }

  // Save favorite city
  async saveFavoriteCity(city, userId = 'default') {
    const favorite = {
      id: Date.now(),
      city: city,
      user_id: userId,
      created_at: new Date().toISOString()
    };

    if (this.isLocalStorage) {
      const favorites = JSON.parse(localStorage.getItem('favorite_cities') || '[]');
      if (!favorites.find(fav => fav.city === city)) {
        favorites.push(favorite);
        localStorage.setItem('favorite_cities', JSON.stringify(favorites));
      }
      return favorite;
    }

    // Real database implementation:
    // const query = 'INSERT INTO favorite_cities (city, user_id, created_at) VALUES (?, ?, ?)';
    // const [result] = await this.connection.execute(query, [city, userId, new Date()]);
    // return result;
  }

  // Get favorite cities
  async getFavoriteCities(userId = 'default') {
    if (this.isLocalStorage) {
      const favorites = JSON.parse(localStorage.getItem('favorite_cities') || '[]');
      return favorites.filter(fav => fav.user_id === userId);
    }

    // Real database implementation:
    // const query = 'SELECT * FROM favorite_cities WHERE user_id = ? ORDER BY created_at DESC';
    // const [rows] = await this.connection.execute(query, [userId]);
    // return rows;
  }

  // Get weather statistics
  async getWeatherStats() {
    if (this.isLocalStorage) {
      const searches = JSON.parse(localStorage.getItem('weather_searches') || '[]');
      const stats = {
        total_searches: searches.length,
        most_searched_city: this.getMostSearchedCity(searches),
        average_temperature: this.getAverageTemperature(searches),
        last_search: searches[0]?.timestamp || null
      };
      return stats;
    }

    // Real database implementation:
    // const queries = [
    //   'SELECT COUNT(*) as total FROM weather_searches',
    //   'SELECT city, COUNT(*) as count FROM weather_searches GROUP BY city ORDER BY count DESC LIMIT 1',
    //   'SELECT AVG(temperature) as avg_temp FROM weather_searches',
    //   'SELECT timestamp FROM weather_searches ORDER BY timestamp DESC LIMIT 1'
    // ];
    // const [total, mostSearched, avgTemp, lastSearch] = await Promise.all(
    //   queries.map(query => this.connection.execute(query))
    // );
    // return {
    //   total_searches: total[0][0].total,
    //   most_searched_city: mostSearched[0][0]?.city || null,
    //   average_temperature: avgTemp[0][0].avg_temp,
    //   last_search: lastSearch[0][0]?.timestamp || null
    // };
  }

  // Helper methods
  getMostSearchedCity(searches) {
    const cityCount = {};
    searches.forEach(search => {
      cityCount[search.city] = (cityCount[search.city] || 0) + 1;
    });
    return Object.keys(cityCount).reduce((a, b) => cityCount[a] > cityCount[b] ? a : b, null);
  }

  getAverageTemperature(searches) {
    if (searches.length === 0) return 0;
    const total = searches.reduce((sum, search) => sum + search.temperature, 0);
    return (total / searches.length).toFixed(1);
  }

  getUserIP() {
    // In a real application, you would get this from the server
    return '127.0.0.1';
  }

  // Close database connection
  async close() {
    if (this.connection) {
      await this.connection.end();
    }
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WeatherDatabase;
} else {
  window.WeatherDatabase = WeatherDatabase;
}
