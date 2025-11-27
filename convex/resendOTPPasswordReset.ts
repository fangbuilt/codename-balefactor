import Resend from "@auth/core/providers/resend";
import { Resend as ResendAPI } from "resend";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

export const ResendOTPPasswordReset = Resend({
  id: "resend-otp-password-reset",
  apiKey: process.env.AUTH_RESEND_KEY,
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes) {
        crypto.getRandomValues(bytes);
      },
    };

    const alphabet = "0123456789";
    const length = 8;
    return generateRandomString(random, alphabet, length);
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const resend = new ResendAPI(provider.apiKey);
    const { error } = await resend.emails.send({
      from: "Cafe Lab <mailbot@i3lcafelab.biz.id>",
      to: [email],
      subject: `Reset your password in Cafe Lab`,
      text: `Your password reset code is: ${token}\n\nThis code will expire in 15 minutes.\n\nIf you didn't request this, please ignore this email.`,
    });

    if (error) {
      throw new Error("Could not send password reset email");
    }
  },
});

