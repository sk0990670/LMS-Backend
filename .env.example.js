// .env.example.js
// Copy this file to .env and fill in your actual values

module.exports = {
    PORT: 5000,
    NODE_ENV: 'development',
    
    // Database
    DB_HOST: 'localhost',
    DB_PORT: 27017,
    DB_NAME: 'lms_db',
    DB_USER: 'your_db_user',
    DB_PASSWORD: 'your_db_password',
    
    // JWT
    JWT_SECRET: 'your_jwt_secret_key',
    JWT_EXPIRE: '7d',
    
    // Email
    EMAIL_HOST: 'smtp.gmail.com',
    EMAIL_PORT: 587,
    EMAIL_USER: 'your_email@gmail.com',
    EMAIL_PASSWORD: 'your_email_password',
    
    // API
    API_URL: 'http://localhost:5000',
    CORS_ORIGIN: 'http://localhost:3000',
};