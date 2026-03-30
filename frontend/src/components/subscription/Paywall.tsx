import React from "react";

interface PaywallProps {
  children: React.ReactNode;
  featureName?: string;
  description?: string;
  variant?: "blur" | "card";
}

export const Paywall = ({
  children,
}: PaywallProps) => {
  // App is strictly for paying users who get the link after landing page checkout
  // This component now acts as a passthrough to maintain layout where used
  return <>{children}</>;
};
