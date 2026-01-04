import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import userRoutes from './routes/user.routes.js';
import errorMiddleware from './middlewares/error.middleware.js';

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

app.use(cookieParser());

app.use(morgan('dev'));

app.get('/ping', (req, res) => {
  res.send('pong');
});

// routes of 3 modules (add here)
app.use('/api/v1/user', userRoutes);

app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Page Not Found',
  });
});

//here we write genric error handling middleware
app.use(errorMiddleware);

export default app;
