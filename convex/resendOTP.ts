import { Email } from "@convex-dev/auth/providers/Email";
import { Resend as ResendAPI } from "resend";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

export const ResendOTP = Email({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: 60 * 15, // 15 minutes
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
  async sendVerificationRequest({ identifier, provider, token }: { identifier: string; provider: { apiKey?: string }; token: string }) {
    if (!provider.apiKey) {
      throw new Error("Resend API key is not configured");
    }
    const resend = new ResendAPI(provider.apiKey);
    const { error } = await resend.emails.send({
      from: "Cafe Lab <dmarc@i3lcafelab.biz.id>",
      to: [identifier],
      subject: `Sign in to Cafe Lab`,
      text: `Your verification code is: ${token}\n\nThis code will expire in 15 minutes.`,
    });

    if (error) {
      throw new Error(JSON.stringify(error));
    }
  },
});
