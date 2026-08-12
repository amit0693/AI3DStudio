import { getAuthConfig } from "@/db";

export async function sendAuthOtp(email: string, otp: string) {
  const config = getAuthConfig();
  if (!config.resendApiKey) {
    throw new Error("Email sign-in is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.emailFrom,
      to: [email],
      subject: `${otp} is your BayLayer Labs verification code`,
      html: `
        <div style="background:#f3f8f1;padding:32px;font-family:Arial,sans-serif;color:#202722">
          <div style="max-width:520px;margin:auto;background:#fffdf8;border:1px solid #d8ded7;border-radius:18px;padding:32px">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#54705d">BayLayer Labs</p>
            <h1 style="margin:0 0 16px;font-size:26px">Your sign-in code</h1>
            <p style="margin:0 0 20px;line-height:1.6;color:#566057">Enter this one-time code to finish signing in. It expires in 10 minutes.</p>
            <div style="padding:18px;background:#e7f1e7;border-radius:12px;text-align:center;font-family:monospace;font-size:32px;font-weight:800;letter-spacing:.2em">${otp}</div>
            <p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#747d75">If you did not request this code, you can safely ignore this email. Never share the code with anyone.</p>
          </div>
        </div>`,
      text: `Your BayLayer Labs verification code is ${otp}. It expires in 10 minutes.`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Unable to send verification email (${response.status}).`);
  }
}
