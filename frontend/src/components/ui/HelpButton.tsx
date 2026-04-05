import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HelpButtonProps {
  tooltipText: string;
  onClick?: () => void;
  size?: "sm" | "default" | "lg";
}

export const HelpButton = ({ tooltipText, onClick, size = "sm" }: HelpButtonProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size={size === "sm" ? "icon" : size}
            onClick={onClick}
            className="text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-full transition-all"
          >
            <HelpCircle size={size === "sm" ? 16 : 18} />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-[#0b1220] border border-white/10 text-sm text-slate-300 p-3 max-w-xs">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};