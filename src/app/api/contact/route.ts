import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createContactMessage } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Rate limit: 3 contact messages per hour per IP
  const ip = getClientIp(req);
  const rl = rateLimit(`contact:${ip}`, 3, 3600000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many messages. Try again later." }, { status: 429 });
  }

  const body = await req.json();
  const { name, email, message, captchaToken } = body;

  // Validate fields
  if (!name || !email || !message || !captchaToken) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }
  if (typeof name !== "string" || name.length > 100) {
    return NextResponse.json({ error: "Name too long" }, { status: 400 });
  }
  if (typeof email !== "string" || email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (typeof message !== "string" || message.length > 2000) {
    return NextResponse.json({ error: "Message too long (max 2000 chars)" }, { status: 400 });
  }

  // Verify hCaptcha token
  const secret = process.env.HCAPTCHA_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Contact form unavailable" }, { status: 500 });
  }

  const verifyRes = await fetch("https://api.hcaptcha.com/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret,
      response: captchaToken,
      sitekey: process.env.HCAPTCHA_SITE_KEY || "",
    }),
  });
  const verifyData = await verifyRes.json();

  if (!verifyData.success) {
    return NextResponse.json({ error: "CAPTCHA verification failed" }, { status: 400 });
  }

  const trimmedName = name.trim().slice(0, 100);
  const trimmedEmail = email.trim().slice(0, 200);
  const trimmedMessage = message.trim().slice(0, 2000);

  // Store message in DB
  await createContactMessage(trimmedName, trimmedEmail, trimmedMessage);

  // Send email notification
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "PimpMyGit <onboarding@resend.dev>",
      to: "ghartrid@gmail.com",
      replyTo: trimmedEmail,
      subject: `[PimpMyGit] Message from ${trimmedName}`,
      text: `Name: ${trimmedName}\nEmail: ${trimmedEmail}\n\n${trimmedMessage}`,
    });
  } catch {
    // Email failed but message is stored in DB — don't fail the request
  }

  return NextResponse.json({ success: true });
}
