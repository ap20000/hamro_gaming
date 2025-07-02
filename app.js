// core modules
import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
import session from "express-session";
import fs from "fs";
import http from 'http';

import { Server } from 'socket.io';
import conversationRoutes from './routes/livechat/conversationRoutes.js';
import messageRoutes from './routes/livechat/messageRoutes.js';
import uploadRoutes from './routes/livechat/uploadRoutes.js';
import Message from './models/Message.js';

import passport from "passport";
import "./config/passport.js";
import paymentRoutes from "./routes/paymentRoutes.js";

//image processing

import path from "path";
import { fileURLToPath } from "url";

// security modules
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import xss from "xss"; // use `xss` instead of `xss-clean`

// internal imports
import authRoutes from "./routes/authRoutes.js";
import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve uploads folder
// --- Ensure images/games folder exists ---
const gamesImagePath = path.join(__dirname, "/uploads/games");
if (!fs.existsSync(gamesImagePath)) {
  fs.mkdirSync(gamesImagePath, { recursive: true });
}

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const paymentQRPath = path.join(__dirname, "/uploads/payment");
if (!fs.existsSync(paymentQRPath)) {
  fs.mkdirSync(paymentQRPath, { recursive: true });
}

// Serve QR images via public route
app.use("/uploads/payment", express.static(paymentQRPath));

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
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
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
    if (typeof input === "string") return xss(input);
    if (typeof input === "object" && input !== null) {
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
  message: "Too many requests from this IP, please try again later",
});
app.use(limiter);

// ======================
// General Middlewares
// ======================

const allowedOrigins = [
  "http://localhost:3000",
  "https://hamro-gaming.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error("Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));

// ======================
// Routes
// ======================

app.use(
  session({
    secret: process.env.SESSION_SECRET || "mysecretkey",
    resave: false,
    saveUninitialized: false,
    // store: MongoStore.create({
    //   mongoUrl: process.env.MONGO_URI,
    //   collectionName: 'sessions',
    // }),
    cookie: {
      secure: process.env.NODE_ENV === "production", // true on HTTPS
      httpOnly: true,
      sameSite: "none", // allow cookies in cross-origin requests
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/product", userRoutes);
app.use("/api/payment", paymentRoutes);

app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined room ${conversationId}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const { conversationId, senderId, text, attachmentUrl } = data;
      const newMessage = await Message.create({
        conversationId,
        senderId,
        text,
        attachmentUrl,
      });
      io.to(conversationId).emit('receive_message', newMessage);
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// ======================
// Error Handling
// ======================

app.use(notFound);
app.use(errorHandler);

export default app;
