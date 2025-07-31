// core modules
import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
import session from "express-session";
import fs from "fs";
import http from "http";
import { Server } from "socket.io";
import conversationRoutes from "./routes/livechat/conversationRoutes.js";
import messageRoutes from "./routes/livechat/messageRoutes.js";
import uploadRoutes from "./routes/livechat/uploadRoutes.js";
import Message from "./models/Message.js";
import Conversation from "./models/Conversation.js";
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
app.set("trust proxy", 1);  
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
  max: 1000,
  message: "Too many requests from this IP, please try again later",
});

app.use(limiter);

// ======================
// General Middlewares
// ======================

const allowedOrigins = [
  "http://localhost:3000",
  "https://hamro-gaming.onrender.com",
  "https://hamro-gaming-frontend.vercel.app",
   'https://frontend-1qzh.vercel.app',
   "https://hamrogamingstore.com",
    "https://www.hamrogamingstore.com"
  ]

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         console.error("Blocked by CORS:", origin);
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        // Allow REST clients like Postman or same-origin requests
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error("Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Explicit allowed methods
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'], // Allowed headers
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
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);

// ======================
// Socket.IO Setup
// ======================

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Store active connections
const activeConnections = new Map();
const adminConnections = new Set();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Handle admin joining
  socket.on("admin_join", () => {
    adminConnections.add(socket.id);
    console.log("Admin joined:", socket.id);

    // Join admin to all existing conversations
    Conversation.find().then((conversations) => {
      conversations.forEach((conv) => {
        socket.join(conv._id.toString());
      });
    });
  });

  // Handle joining conversation
  socket.on("join_conversation", async (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined room ${conversationId}`);

    // Store connection info
    activeConnections.set(socket.id, { conversationId });

    // Create conversation if it doesn't exist (for new account claims)
    try {
      let conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        // Extract order info from conversationId (assuming format: order_123456)
        const orderId = conversationId.replace("order_", "");
        conversation = await Conversation.create({
          _id: conversationId, // Use the full conversationId as _id
          participants: ["user", "admin"],
          status: "active",
          lastMessage: "",
          lastMessageTime: new Date(),
          unreadCount: 0,
        });
        console.log("Created new conversation:", conversationId);

        // Notify all admins about new conversation
        adminConnections.forEach((adminSocketId) => {
          io.to(adminSocketId).emit("new_conversation", conversation);
        });
      }
    } catch (error) {
      console.error("Error handling conversation:", error);
      // Send error back to client
      socket.emit("conversation_error", {
        error: "Failed to join conversation",
        details: error.message,
      });
    }
  });

  // Handle sending messages
  socket.on("send_message", async (data) => {
    try {
      const { conversationId, senderId, text, attachmentUrl } = data;

      const newMessage = await Message.create({
        conversationId,
        senderId,
        text,
        attachmentUrl,
      });

      console.log("Message saved:", newMessage);

      // Broadcast to all users in the conversation room
      io.to(conversationId).emit("receive_message", newMessage);

      // Also notify all admins if sender is not admin
      if (!senderId.includes("admin")) {
        adminConnections.forEach((adminSocketId) => {
          io.to(adminSocketId).emit("receive_message", newMessage);
        });
      }
    } catch (err) {
      console.error("Error saving message:", err);
      socket.emit("message_error", { error: "Failed to send message" });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    activeConnections.delete(socket.id);
    adminConnections.delete(socket.id);
  });
});

// ======================
// Error Handling
// ======================

app.use(notFound);
app.use(errorHandler);

// ======================
// Start Server
// ======================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server ready`);
});

export default app;
