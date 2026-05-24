import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import dns from "dns";

// Force IPv4 DNS resolution order first to bypass Render.com IPv6 outbound connection issues (ENETUNREACH)
dns.setDefaultResultOrder("ipv4first");

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// OTP Store Map: email -> { code, expiresAt }
const otpStore = new Map<string, { code: string; expiresAt: number }>();
// Lockout Store Map: email -> { failedAttempts: number; lockedUntil: number }
const lockoutStore = new Map<string, { failedAttempts: number; lockedUntil: number }>();

async function startServer() {
  app.use(express.json());

  // API Route: Send OTP for password recovery (limited to 10 minutes)
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email, registeredEmails } = req.body;
      if (!email || !email.trim()) {
        return res.status(400).json({ error: "Email address is required." });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check lockout status
      const lockout = lockoutStore.get(normalizedEmail);
      if (lockout && Date.now() < lockout.lockedUntil) {
        const remainingMs = lockout.lockedUntil - Date.now();
        const remainingMins = Math.ceil(remainingMs / 60000);
        return res.status(403).json({
          error: `Too many failed attempts. The password reset flow for this email has been temporarily locked. Please try again in ${remainingMins} minute(s).`
        });
      }

      // Check user existence in registered emails
      if (registeredEmails && Array.isArray(registeredEmails)) {
        const exists = registeredEmails.some(
          (e: string) => e.toLowerCase().trim() === normalizedEmail
        );
        if (!exists) {
          console.log(`[AUTH] Forgot password requested for unregistered email: ${normalizedEmail}. Returning error.`);
          return res.status(404).json({
            error: "This email address is not registered on CitConnect. Please register first or verify that you typed it correctly."
          });
        }
      }

      // Generate a secure, 6-digit dynamic OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // exactly 10 minutes expiry
      otpStore.set(normalizedEmail, { code: otp, expiresAt });

      console.log(`[AUTH] Generated OTP ${otp} for email ${normalizedEmail}`);

      let transporter = null;
      let senderEmail = "security@cit.edu.al";
      let isConfigured = false;

      // Check if Gmail attributes exist in .env
      if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
        senderEmail = process.env.GMAIL_USER;
        transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS,
          },
          family: 4 // Force IPv4 to bypass Render.com's IPv6 outbound connection issues
        } as any);
        isConfigured = true;
      } else if (
        process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
      ) {
        senderEmail = process.env.SMTP_USER;
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          family: 4 // Force IPv4 to bypass Render.com's IPv6 outbound connection issues
        } as any);
        isConfigured = true;
      }

      // If not configured, fall back to sandbox development mode and return OTP in the secure response
      if (!isConfigured || !transporter) {
        console.warn(`[AUTH] Real email support was not configured. Falling back to sandbox preview mode.`);
        return res.json({
          success: true,
          isDemoMode: true,
          otp: otp,
          message: "No SMTP configuration detected in .env secrets. We have triggered the development sandbox fallback; your verification key code is: " + otp + ". Enter this code to verify your ownership."
        });
      }

      const mailOptions = {
        from: `"CitConnect Academic Support" <${senderEmail}>`,
        to: email.trim(),
        subject: "Your password reset code",
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px;">
              <span style="font-size: 24px; font-weight: 800; color: #3b82f6; letter-spacing: -0.5px;">CitConnect</span>
              <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0; text-transform: uppercase; tracking: 1px; font-weight: 700;">Canadian Institute of Technology</p>
            </div>
            <div>
              <p style="font-size: 15px; color: #334155; line-height: 1.6; font-weight: 500;">Hello Student,</p>
              <p style="font-size: 14px; color: #475569; line-height: 1.6;">You initiated a security request to recover your password on the official CitConnect student network. Please enter the following 6-digit confirmation key code in your web browser:</p>
              
              <div style="text-align: center; padding: 20px; margin: 25px 0; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1e3a8a;">
                ${otp}
              </div>
              
              <p style="font-size: 12px; color: #ef4444; font-weight: 700; margin: 15px 0; text-align: center;">🛡️ This academic verification code expires in exactly 10 minutes.</p>
              <p style="font-size: 13px; color: #64748b; line-height: 1.6;">If you did not request this recovery email, please secure your profile by changing your current password in settings, or ignore this message.</p>
            </div>
            <div style="border-top: 1px solid #f1f5f9; margin-top: 35px; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8; font-weight: 500;">
              &copy; ${new Date().getFullYear()} Canadian Institute of Technology. All rights reserved. <br/>
              Tirana, Albania • <a href="https://cit.edu.al" style="color: #3b82f6; text-decoration: none;">cit.edu.al</a>
            </div>
          </div>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`[AUTH] Live email dispatched successfully.`);
        res.json({
          success: true,
          message: "Code successfully generated and dispatched to your email address.",
        });
      } catch (sendError: any) {
        console.error(`[AUTH] Delivery error: ${sendError.message}`);
        res.status(500).json({
          error: `SMTP mail delivery failed: ${sendError.message}. Please verify that your GMAIL_USER and GMAIL_PASS variables are configured correctly.`
        });
      }
    } catch (error: any) {
      console.error("[AUTH ERROR] Failed to execute forgot-password request:", error);
      res.status(500).json({ error: "Failed to dispatch recovery email: " + error.message });
    }
  });

  // API Route: Verify recovery code OTP and manage lockout security
  app.post("/api/verify-otp", (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ error: "Email and recovery code are required." });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check lockout status
      const lockout = lockoutStore.get(normalizedEmail);
      if (lockout && Date.now() < lockout.lockedUntil) {
        const remainingMs = lockout.lockedUntil - Date.now();
        const remainingMins = Math.ceil(remainingMs / 60000);
        return res.status(403).json({
          error: `Too many failed attempts. The password reset flow for this email has been temporarily locked. Please try again in ${remainingMins} minute(s).`
        });
      }

      const record = otpStore.get(normalizedEmail);
      if (!record) {
        // Increment failure lockout count
        let curLock = lockout || { failedAttempts: 0, lockedUntil: 0 };
        curLock.failedAttempts += 1;
        if (curLock.failedAttempts >= 5) {
          curLock.lockedUntil = Date.now() + 5 * 60 * 1000; // 5 min lockout
          lockoutStore.set(normalizedEmail, curLock);
          return res.status(403).json({
            error: "Too many failed attempts. The password reset flow for this email has been temporarily locked. Please try again in 5 minutes."
          });
        }
        lockoutStore.set(normalizedEmail, curLock);
        return res.status(400).json({
          error: `No pending password reset request was found or the code you provided is invalid. You have ${5 - curLock.failedAttempts} attempt(s) remaining.`
        });
      }

      if (Date.now() > record.expiresAt) {
        otpStore.delete(normalizedEmail);
        return res.status(400).json({ error: "This OTP verification code has expired. Please request a new security code." });
      }

      if (record.code !== code.trim()) {
        // Increment failure lockout count
        let curLock = lockout || { failedAttempts: 0, lockedUntil: 0 };
        curLock.failedAttempts += 1;
        if (curLock.failedAttempts >= 5) {
          curLock.lockedUntil = Date.now() + 5 * 60 * 1000; // 5 min lockout
          lockoutStore.set(normalizedEmail, curLock);
          return res.status(403).json({
            error: "Too many failed attempts. The password reset flow for this email has been temporarily locked. Please try again in 5 minutes."
          });
        }
        lockoutStore.set(normalizedEmail, curLock);
        return res.status(400).json({
          error: `Incorrect security verification code. You have ${5 - curLock.failedAttempts} attempt(s) remaining.`
        });
      }

      // Successful verification! Erase code and lockout entries to invalidate re-usability
      otpStore.delete(normalizedEmail);
      lockoutStore.delete(normalizedEmail);

      res.json({ success: true, message: "Account verification successful." });
    } catch (error: any) {
      console.error("[AUTH ERROR] Verification failed:", error);
      res.status(500).json({ error: "Internal verification fault." });
    }
  });

  // Vite middleware setup for full development compilation
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Full-stack engine running on port ${PORT}`);
  });
}

startServer();
