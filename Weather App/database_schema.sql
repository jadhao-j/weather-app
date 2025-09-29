-- MySQL Database Schema for Weather App
-- This file contains the SQL commands to create the database structure

-- Create database
CREATE DATABASE IF NOT EXISTS weather_app;
USE weather_app;

-- Table for storing weather searches
CREATE TABLE IF NOT EXISTS weather_searches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    temperature DECIMAL(5,2) NOT NULL,
    humidity INT NOT NULL,
    pressure DECIMAL(7,2) NOT NULL,
    wind_speed DECIMAL(5,2) NOT NULL,
    description VARCHAR(100) NOT NULL,
    visibility INT,
    uv_index INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_ip VARCHAR(45),
    INDEX idx_city (city),
    INDEX idx_timestamp (timestamp)
);

-- Table for storing favorite cities
CREATE TABLE IF NOT EXISTS favorite_cities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    user_id VARCHAR(50) DEFAULT 'default',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_city (user_id, city),
    INDEX idx_user_id (user_id)
);

-- Table for storing user preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    theme VARCHAR(20) DEFAULT 'light',
    units VARCHAR(10) DEFAULT 'metric',
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user (user_id)
);

-- Table for storing weather alerts
CREATE TABLE IF NOT EXISTS weather_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    INDEX idx_city (city),
    INDEX idx_active (is_active)
);

-- Table for storing app statistics
CREATE TABLE IF NOT EXISTS app_statistics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    total_searches INT DEFAULT 0,
    unique_cities INT DEFAULT 0,
    most_searched_city VARCHAR(100),
    average_temperature DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_date (date)
);

-- Insert sample data
INSERT INTO weather_alerts (city, alert_type, severity, message, expires_at) VALUES
('Nagpur', 'heat_wave', 'high', 'Heat wave warning: Temperature expected to reach 45°C', DATE_ADD(NOW(), INTERVAL 3 DAY)),
('Mumbai', 'rain', 'medium', 'Heavy rainfall expected in the next 24 hours', DATE_ADD(NOW(), INTERVAL 1 DAY)),
('Delhi', 'pollution', 'high', 'Air quality index is very poor. Avoid outdoor activities', DATE_ADD(NOW(), INTERVAL 2 DAY));

-- Create views for common queries
CREATE VIEW popular_cities AS
SELECT 
    city,
    COUNT(*) as search_count,
    AVG(temperature) as avg_temperature,
    MAX(timestamp) as last_searched
FROM weather_searches 
GROUP BY city 
ORDER BY search_count DESC;

CREATE VIEW daily_stats AS
SELECT 
    DATE(timestamp) as date,
    COUNT(*) as searches,
    COUNT(DISTINCT city) as unique_cities,
    AVG(temperature) as avg_temp
FROM weather_searches 
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- Create stored procedures
DELIMITER //

CREATE PROCEDURE GetWeatherStats(IN days INT)
BEGIN
    SELECT 
        COUNT(*) as total_searches,
        COUNT(DISTINCT city) as unique_cities,
        AVG(temperature) as avg_temperature,
        MAX(temperature) as max_temperature,
        MIN(temperature) as min_temperature
    FROM weather_searches 
    WHERE timestamp >= DATE_SUB(NOW(), INTERVAL days DAY);
END //

CREATE PROCEDURE GetPopularCities(IN limit_count INT)
BEGIN
    SELECT 
        city,
        COUNT(*) as search_count,
        AVG(temperature) as avg_temp
    FROM weather_searches 
    GROUP BY city 
    ORDER BY search_count DESC 
    LIMIT limit_count;
END //

DELIMITER ;

-- Create indexes for better performance
CREATE INDEX idx_weather_searches_city_date ON weather_searches(city, DATE(timestamp));
CREATE INDEX idx_weather_searches_temp ON weather_searches(temperature);
CREATE INDEX idx_favorite_cities_user ON favorite_cities(user_id, created_at);

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON weather_app.* TO 'weather_user'@'localhost' IDENTIFIED BY 'your_password';
-- FLUSH PRIVILEGES;
