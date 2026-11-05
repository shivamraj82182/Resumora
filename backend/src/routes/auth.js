const express = require("express");
const { z } = require("zod");

const env = require("../config/env");
const firebaseAdmin = require("../config/firebaseAdmin");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { signToken, cookieOptions } = require("../utils/jwt");
const { validate } = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimit");
const User = require("../models/User");

const router = express.Router();

const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
});

const googleLoginSchema = z.object({
  idToken: z.string().min(1),
});

const profileSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});

function issueSession(res, user) {
  const token = signToken({ sub: user._id.toString() });
  res.cookie(env.cookieName, token, cookieOptions);
}

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) throw ApiError.conflict("Email already registered");

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name,
      email,
      passwordHash,
    });

    issueSession(res, user);
    res.status(201).json({ user });
  }),
);

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // const user = await User.findOne({ email }).select("+passwordHash");
    // if (!user) throw ApiError.unauthorized("wrong email! ");

    // const ok = await user.comparePassword(password);
    // if (!ok) throw ApiError.unauthorized("wrong password! ");


    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    if (!password || !user.passwordHash) {
      throw ApiError.unauthorized(
        "Password login unavailable. Please register again or use Google login."
      );
    }

    const ok = await user.comparePassword(password);

    if (!ok) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    issueSession(res, user);
    res.json({ user });
  }),
);

router.post(
  "/google",
  authLimiter,
  validate(googleLoginSchema),
  asyncHandler(async (req, res) => {
    const { idToken } = req.body;

    let decodedToken;

    try {
      decodedToken = await firebaseAdmin.verifyIdToken(idToken);
    } catch {
      throw ApiError.unauthorized("Invalid Google authentication");
    }

    const email = decodedToken.email?.toLowerCase();

    if (!email || !decodedToken.email_verified) {
      throw ApiError.unauthorized("Google email is not verified");
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: decodedToken.name || "Google User",
        email,
      });
    }

    issueSession(res, user);

    res.json({ user });
  }),
);

router.post("/logout", (req, res) => {
  res.clearCookie(env.cookieName, {
    ...cookieOptions,
    maxAge: 0,
  });
  res.json({ ok: true });
});

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  }),
);

router.patch(
  "/profile",
  requireAuth,
  validate(profileSchema),
  asyncHandler(async (req, res) => {
    req.user.name = req.body.name;
    await req.user.save();

    res.json({ user: req.user });
  }),
);

router.patch(
  "/password",
  authLimiter,
  requireAuth,
  validate(passwordSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("+passwordHash");
    if (!user) throw ApiError.unauthorized("Session no longer valid");

    const ok = await user.comparePassword(req.body.currentPassword);
    if (!ok) throw ApiError.unauthorized("Current password is incorrect");

    user.passwordHash = await User.hashPassword(req.body.newPassword);
    await user.save();

    res.json({ ok: true });
  }),
);

router.post(
  "/google/register",
  authLimiter,
  validate(googleLoginSchema),
  asyncHandler(async (req, res) => {
    const { idToken } = req.body;

    let decodedToken;

    try {
      decodedToken = await firebaseAdmin.verifyIdToken(idToken);
    } catch {
      throw ApiError.unauthorized("Invalid Google authentication");
    }

    const email = decodedToken.email?.toLowerCase();

    if (!email || !decodedToken.email_verified) {
      throw ApiError.unauthorized("Google email is not verified");
    }

    const existing = await User.findOne({ email });

    if (existing) {
      throw ApiError.conflict(
        "Email already registered. Please sign in instead."
      );
    }

    const user = await User.create({
      name: decodedToken.name || "Google User",
      email,
    });

    issueSession(res, user);

    res.status(201).json({ user });
  }),
);

module.exports = router;
