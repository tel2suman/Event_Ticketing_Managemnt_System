const transporter = require("../config/emailConfig");

const TokenModel = require("../models/Token");

const crypto = require("crypto");

const SendEmail = async (req, user) => {
  // 2. Generate a secure random token
  const verificationToken = crypto.randomBytes(32).toString("hex");

  // 3. Save the token to the database
  const savetoken = await new Token({
    userId: user._id,
    token: verificationToken,
  }).save();

  console.log("token", savetoken);

  // 4. Construct the verification URL
  const verificationUrl = `http://localhost:6000/verify?token=${verificationToken}&id=${user._id}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: "Verify Your Email Address",
    text: "",
    html: `<h3>Welcome to our platform!</h3>
        <p>Please click the link below to verify your email address. This link expires in 1 hour.</p>
    <a href="${verificationUrl}">Verify Email</a>`,
  });

  return savetoken;
}

module.exports = SendEmail;