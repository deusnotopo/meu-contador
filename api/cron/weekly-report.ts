import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import { generateWeeklyEmailHtml } from "../../src/lib/reports/email-template.js";

// Initialize Resend with API Key from Environment Variables
// The user needs to add RESEND_API_KEY to Vercel env
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // Security: Check for Cron Secret in production
  const authHeader = request.headers["authorization"];
  if (
    process.env.NODE_ENV === "production" &&
    request.query.preview !== "true" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return response
      .status(401)
      .json({ success: false, message: "Unauthorized" });
  }

  // 1. MOCK DATA (Ideally this would fetch from Firebase for each user)
  // For "Do Everything", we are setting up the INFRASTRUCTURE to send.
  // In a real scenario, we would: const users = await db.collection('users').get();
  const mockData = {
    userName: "Usuário Pro",
    period: "05 jan - 11 jan",
    totalIncome: 12500.0,
    totalExpense: 4320.5,
    balance: 8179.5,
    topExpenses: [
      { category: "Moradia", amount: 2500 },
      { category: "Alimentação", amount: 1200 },
      { category: "Lazer", amount: 450 },
    ],
    savingsRate: 65,
    healthScore: 92,
    insight:
      "Sua taxa de poupança está excepcional esta semana! Você economizou 40% a mais do que a média.",
  };

  const html = generateWeeklyEmailHtml(mockData);

  // Preview Mode
  if (request.query.preview === "true") {
    response.setHeader("Content-Type", "text/html");
    return response.status(200).send(html);
  }

  // 2. SEND EMAIL via Resend
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error(
        "RESEND_API_KEY is missing in Vercel Environment Variables"
      );
    }

    // Default to sending to the developer/admin for now until we have user emails in DB
    const data = await resend.emails.send({
      from: "Meu Contador <onboarding@resend.dev>", // Default Resend testing domain
      to: ["delivered@resend.dev"], // CHANGE THIS to testing email or dynamic user email
      subject: "📊 Seu Relatório Financeiro Semanal",
      html: html,
    });

    return response.status(200).json({
      success: true,
      message: "Email sent successfully",
      data,
    });
  } catch (error: any) {
    console.error("Email Error:", error);
    return response.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
