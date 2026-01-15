import { useAuth } from "@/context/AuthContext";
import React, { useState } from "react";

interface PaywallProps {
  children: React.ReactNode;
  featureName?: string;
  description?: string;
  variant?: "blur" | "card";
}

export const Paywall = ({
  children,
  featureName = "Funcionalidade Premium",
  description = "Assine o plano PRO para desbloquear este recurso exclusivo.",
  variant = "card",
}: PaywallProps) => {
  const { isPro } = useAuth();
  const [showPlans, setShowPlans] = useState(false);

  // App is strictly for paying users who get the link after landing page checkout
  // This component now acts as a passthrough to maintain layout where used
  return <>{children}</>;
};
