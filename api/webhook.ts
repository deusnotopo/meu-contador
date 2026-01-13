import { VercelRequest, VercelResponse } from "@vercel/node";
import { auth, db } from "./_firebase-admin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS configuration
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { status, customer } = req.body;
    console.log("Webhook Received:", {
      status,
      customer_email: customer?.email,
    });

    if (status === "approved" || status === "paid" || status === "authorized") {
      if (!customer?.email) {
        return res.status(400).json({ error: "No email provided" });
      }

      // Lookup UID via Firebase Auth
      let uid: string;
      try {
        const userRecord = await auth.getUserByEmail(customer.email);
        uid = userRecord.uid;
      } catch (authError) {
        console.warn(`Auth lookup failed for ${customer.email}:`, authError);
        return res
          .status(404)
          .json({ message: "User not registered in Auth", error: authError });
      }

      // Update the profile document at users/{uid}/data/meu_contador_profile
      const profileRef = db
        .collection("users")
        .doc(uid)
        .collection("data")
        .doc("meu_contador_profile");

      await profileRef.set(
        {
          payload: {
            isPro: true,
            subscriptionPlan: "pro",
            proSince: new Date().toISOString(),
            paymentProvider: "AppMax",
            lastPaymentStatus: status,
          },
          lastUpdated: new Date().toISOString(),
        },
        { merge: true }
      );

      console.log(`SUCCESS: Upgraded ${customer.email} (UID: ${uid}) to PRO`);
      return res.status(200).json({ success: true, message: "User upgraded" });
    }

    return res
      .status(200)
      .json({ message: "Ignored status", received: status });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
