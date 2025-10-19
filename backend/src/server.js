import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import session from "express-session";
import passport from "passport";
import csrf from "csurf"; 

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import authGoogleRouter from "./routes/authGoogle.js";

import { connectDB } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT;


//reqiure mongo sanitization package
import mongoSanitize from "express-mongo-sanitize";

const __dirname = path.resolve();

// Trust proxy - Required for rate limiting to work correctly
app.set('trust proxy', 1);

app.use(
  cors({
    origin: "http://localhost:5173",
    // allow frontend to send cookies
    credentials: true, 
  })
);

app.use(express.json());
app.use(cookieParser());

//removes any keys begining with $ or containing 
app.use(mongoSanitize());

// Session middleware for passport
app.use(
  session({
    secret: process.env.SESSION_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, 
  })
);

// Initialize passport middleware
app.use(passport.initialize());
app.use(passport.session());



// CSRF protection middleware
const csrfProtection = csrf({ cookie: true });

// Route for frontend to fetch CSRF token
app.get("/api/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Routes - Apply rate limiting in routes, CSRF applied per route
// Auth routes have their own rate limiting middleware
app.use("/api/auth", csrfProtection, authRoutes);
app.use("/api/users", csrfProtection, userRoutes);
app.use("/api/chat", csrfProtection, chatRoutes);

// Use the Google authentication routes
app.use("/auth", authGoogleRouter);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
