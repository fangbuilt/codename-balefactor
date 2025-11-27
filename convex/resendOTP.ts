import { Email } from "@convex-dev/auth/providers/Email";
import { Resend as ResendAPI } from "resend";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

export const ResendOTP = Email({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  from: "Cafe Lab <mailbot@i3lcafelab.biz.id>",
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
    
    console.log("1 FROM:", provider);

    if (!provider.apiKey) {
      throw new Error("Resend API key is not configured");
    }

    console.log("2 FROM:", provider);

    const resend = new ResendAPI(provider.apiKey);

    console.log("3 FROM:", provider);

    const { error } = await resend.emails.send({
      from: "Cafe Lab <mailbot@i3lcafelab.biz.id>",
      to: [identifier],
      subject: `Sign in to Cafe Lab`,
      text: `Your verification code is: ${token}\n\nThis code will expire in 15 minutes.`,
    });

    console.log("4 FROM:", provider);

    if (error) {
      throw new Error(JSON.stringify(error));
    }
  },
});
