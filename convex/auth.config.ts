import { ResendOTP } from "./resendOTP";
import { ResendOTPPasswordReset } from "./resendOTPPasswordReset";

export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
    ResendOTP,
    ResendOTPPasswordReset
  ],
};
