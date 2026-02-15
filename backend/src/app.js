import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';


dotenv.config();


import connectDB from './config/db.js';

// ye abhi socha h ki ye routes honge, will change them later 

// import errorHandler from './middleware/errorHandler.js';

// import authRoutes from './routes/auth.js';
// import chatRoutes from './routes/chat.js';
// import flashcardRoutes from './routes/flashcards.js';
// import challengeRoutes from './routes/challenges.js';
// import gamificationRoutes from './routes/gamification.js';

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});
app.use('/api', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}


app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SocraticDev API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ye abhi socha h ki ye middleware honge, baad mein agar different hue to have to change them

// app.use('/api/auth', authRoutes);
// app.use('/api/chat', chatRoutes);
// app.use('/api/flashcards', flashcardRoutes);
// app.use('/api/challenges', challengeRoutes);
// app.use('/api/gamification', gamificationRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`
Port: ${PORT}
Environment: ${process.env.NODE_ENV || 'development'}
API URL: http://localhost:${PORT}
  `);
});

export default app;
