// core modules
import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import cors from 'cors';
import session from 'express-session';
import fs from 'fs';



import passport from 'passport';
import './config/passport.js'; 

//image processing

import path from 'path';
import { fileURLToPath } from 'url';

// security modules
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import xss from 'xss'; // use `xss` instead of `xss-clean`

// internal imports
import authRoutes from './routes/authRoutes.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve uploads folder
// --- Ensure images/games folder exists ---
const gamesImagePath = path.join(__dirname, '/uploads/games');
if (!fs.existsSync(gamesImagePath)) {
  fs.mkdirSync(gamesImagePath, { recursive: true });
}

app.use('/uploads/games', express.static(path.join(__dirname, 'uploads')));

// ======================
// Security Middlewares
// ======================

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Custom sanitizer to prevent NoSQL injection
app.use((req, res, next) => {
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (/^\$/.test(key) || /\./.test(key)) {
        delete obj[key]; // remove dangerous keys
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]); // recurse
      }
    }
  };

  sanitizeObject(req.body);
  sanitizeObject(req.params);
  next();
});

// Custom XSS cleaner using `xss` package
const xssSanitize = (req, res, next) => {
  const clean = (input) => {
    if (typeof input === 'string') return xss(input);
    if (typeof input === 'object' && input !== null) {
      for (const key in input) {
        input[key] = clean(input[key]);
      }
    }
    return input;
  };

  req.body = clean(req.body);
  req.params = clean(req.params);
  next();
};
app.use(xssSanitize);

// Rate limiting to prevent brute-force and DoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later',
});
app.use(limiter);

// ======================
// General Middlewares
// ======================

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// ======================
// Routes
// ======================

app.use(session({
  secret: process.env.SESSION_SECRET || 'mysecretkey',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // use true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },
}));

app.use(passport.initialize());
app.use(passport.session());


app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);


// ======================
// Error Handling
// ======================

app.use(notFound);         
app.use(errorHandler);     

export default app;
