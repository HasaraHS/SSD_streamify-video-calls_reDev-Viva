import express from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { oauthLimiter } from "../middleware/rateLimiter.middleware.js";

const router = express.Router();

//Load environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const BACKEND_URL = process.env.BACKEND_URL;

//configure google strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${BACKEND_URL}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        //check if user already exists in database
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
          // create new user
          user = await User.create({
            googleId: profile.id,
            fullName: profile.displayName,
            email: profile.emails[0].value,
            profilePic: profile.photos[0].value,
          });
        } else if (!user.googleId) {
          //existing user but registered manually ...link google account
          user.googleId = profile.id;
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

//Initialize session serialization
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

//Route to initiate Google OAuth
router.get(
  "/google",
  oauthLimiter,
  (req, res, next) => {
    if (res.headersSent) return;
    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
  }
);

//Google OAuth callback route (No rate limiter here - Google calls this, not the user)
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${FRONTEND_URL}/login`,
    session: false,
  }), // disable session
  (req, res) => {
    if (!req.user) {
      return res.redirect(`${FRONTEND_URL}/login`);
    }

    const token = jwt.sign({ userId: req.user._id }, JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
    
    res.redirect(`${FRONTEND_URL}/oauth-success`);
  }
);

export default router;
