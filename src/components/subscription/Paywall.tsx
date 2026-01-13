import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Crown, Lock } from "lucide-react";
import React, { useState } from "react";
import { PremiumPlans } from "./PremiumPlans";

interface PaywallProps {
  children: React.ReactNode;
  featureName?: string;
  description?: string;
  variant?: "blur" | "card";
}

export const Paywall = ({ 
  children, 
  featureName = "Funcionalidade Premium", 
export const Paywall = ({
  children,
  featureName = "Funcionalidade Premium",
  description = "Assine o plano PRO para desbloquear este recurso exclusivo.",
  variant = "card"
}: PaywallProps) => {
  const { isPro } = useAuth();
  const [showPlans, setShowPlans] = useState(false);

  // App is strictly for paying users who get the link after landing page checkout
  // This component now acts as a passthrough to maintain layout where used
  return <>{children}</>;
};
