const express = require("express");
const passport = require("passport");
const AuthController = require("../../controllers/api/authController");
const AuthMiddleware = require("../../middlewares/authMiddleware");
const ValidationMiddleware = require("../../middlewares/validationMiddleware");
const HttpStatusCode = require("../../utils/httpStatusCode");
const { authLimiter } = require("../../utils/limiter");


const {
  registerValidation,
  loginValidation,
  resendVerificationEmailValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
} = require("../../validations/authValidation");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Registration, login, email verification, password reset/change, token refresh, profile, Google OAuth.
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user account
 *     description: Creates a new user (role defaults to 'user'). Sends a verification email; the account cannot log in until verified.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: "Geeta Roy" }
 *               email: { type: string, format: email }
 *               password: { type: string, format: password, example: "Aa@123456789" }
 *     responses:
 *       201:
 *         description: User registered
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
// Register a new user account.
router.post(
  "/register",
  authLimiter,
  ValidationMiddleware.validate(registerValidation),
  AuthController.register,
);

/**
 * @swagger
 * /api/v1/auth/verify-email:
 *   get:
 *     tags: [Auth]
 *     summary: Verify a registered user's email
 *     security: []
 *     parameters:
 *       - { name: token, in: query, required: true, schema: { type: string } }
 *       - { name: id, in: query, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Email verified
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 */
// Verify a registered user's email address.
// router.get("/verify-email", AuthController.verifyEmail);

/**
 * @swagger
 * /api/v1/auth/resend-verification-email:
 *   post:
 *     tags: [Auth]
 *     summary: Resend the email verification link
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Link resent
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 */
// Resend the email verification link.
// router.post(
//   "/resend-verification-email",
//   authLimiter,
//   ValidationMiddleware.validate(resendVerificationEmailValidation),
//   AuthController.resendVerificationEmail,
// );

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate a verified user
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: "shreya@yopmail.com" }
 *               password: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Login successful — returns accessToken/refreshToken
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessMessage'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/AuthTokens' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403:
 *         description: Email not verified
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
// Authenticate a verified user.
router.post(
  "/login",
  authLimiter,
  ValidationMiddleware.validate(loginValidation),
  AuthController.login,
);

/**
 * @swagger
 * /api/v1/auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate refresh token and issue new tokens
 *     description: Works via cookie or via refreshToken in the body.
 *     security: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: New tokens issued
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessMessage'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/AuthTokens' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
// Rotate the current refresh token and issue new authentication tokens.
router.post("/refresh-token", authLimiter, AuthController.refreshToken);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset link
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Reset link sent
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
// Request a password reset link.
// router.post(
//   "/forgot-password",
//   authLimiter,
//   ValidationMiddleware.validate(forgotPasswordValidation),
//   AuthController.forgotPassword,
// );

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   patch:
 *     tags: [Auth]
 *     summary: Reset the account password using a valid reset token
 *     security: []
 *     parameters:
 *       - { name: token, in: query, required: true, schema: { type: string } }
 *       - { name: id, in: query, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password: { type: string, format: password, example: "Aa@123456789" }
 *     responses:
 *       200:
 *         description: Password reset
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 */
// Reset the account password using a valid password reset token.
// router.patch(
//   "/reset-password",
//   authLimiter,
//   ValidationMiddleware.validate(resetPasswordValidation),
//   AuthController.resetPassword,
// );

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   patch:
 *     tags: [Auth]
 *     summary: Change the logged-in user's password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword: { type: string, format: password }
 *               newPassword: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Password changed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
// router.patch(
//   "/change-password",
//   AuthMiddleware,
//   ValidationMiddleware.validate(changePasswordValidation),
//   AuthController.changePassword,
// );

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Invalidate refresh token and clear auth cookies
 *     responses:
 *       200:
 *         description: Logged out
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessMessage' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
// Invalidate the active refresh token and clear authentication cookies.
router.post("/logout", AuthMiddleware, AuthController.logout);

/**
 * @swagger
 * /api/v1/auth/profile:
 *   get:
 *     tags: [Auth]
 *     summary: Get the authenticated user's profile
 *     responses:
 *       200:
 *         description: Profile
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessMessage'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
// Retrieve the authenticated user's profile.
router.get("/profile", AuthMiddleware, AuthController.getProfile);

// Google OAuth is only wired up when it's actually configured — see the
// matching guard in app/config/passport.js. Without it, the "google"
// passport strategy is never registered and authenticate() would throw.
const isGoogleOAuthConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CALLBACK_URL,
);

/**
 * @swagger
 * /api/v1/auth/google:
 *   get:
 *     tags: [Auth]
 *     summary: Start Google OAuth login (open in a browser, not via Try-it-out)
 *     description: >
 *       Not a normal JSON API call — redirects (302) to Google's consent screen. Open this URL
 *       directly in a browser tab. Google then redirects to /api/v1/auth/google/callback. Only
 *       active if GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_CALLBACK_URL are configured on the
 *       server; otherwise returns 503.
 *     security: []
 *     responses:
 *       302: { description: Redirect to Google's consent screen }
 *       503:
 *         description: Google OAuth not configured on this server
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */

/**
 * @swagger
 * /api/v1/auth/google/callback:
 *   get:
 *     tags: [Auth]
 *     summary: Google OAuth callback (reference only — never call directly)
 *     description: >
 *       Google's own redirect after the user approves access hits this URL with a real
 *       authorization code. On success, sets accessToken/refreshToken cookies and redirects
 *       (302) to FRONTEND_URL. Must exactly match the 'Authorized redirect URI' configured on
 *       the Google Cloud OAuth client.
 *     security: []
 *     parameters:
 *       - name: code
 *         in: query
 *         required: true
 *         schema: { type: string }
 *         description: Authorization code issued by Google
 *     responses:
 *       302: { description: Redirect to FRONTEND_URL with auth cookies set }
 *       500: { $ref: '#/components/responses/ServerError' }
 */
if (isGoogleOAuthConfigured) {
  // Kick off the Google OAuth consent flow.
  router.get(
    "/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,
    }),
  );

  // Google redirects back here after the user approves/denies access.
  router.get(
    "/google/callback",
    passport.authenticate("google", {
      session: false,
      failureRedirect: `${process.env.FRONTEND_URL}?error=google_auth_failed`,
    }),
    AuthController.googleLogin,
  );
} else {
  router.get("/google", (req, res) => {
    res.status(HttpStatusCode.SERVICE_UNAVAILABLE).json({
      success: false,
      message: "Google OAuth is not configured on this server.",
    });
  });
}

module.exports = router;
