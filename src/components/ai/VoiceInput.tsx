import { Button } from "@/components/ui/button";
import { Mic, MicOff, Waves } from "lucide-react";
import React, { useEffect, useState } from "react";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isProcessing?: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  isProcessing = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    ) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = "pt-BR";

      recognitionInstance.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      recognitionInstance.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          setError("Permissão de microfone negada.");
        } else {
          setError("Erro ao ouvir. Tente novamente.");
        }
      };

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
      };

      setRecognition(recognitionInstance);
    } else {
      setError("Seu navegador não suporta reconhecimento de voz.");
    }
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  if (error) {
    return (
      <span className="text-xs text-red-400 ml-2" title={error}>
        <MicOff size={16} />
      </span>
    );
  }

  return (
    <Button
      type="button"
      size="icon"
      variant={isListening ? "default" : "ghost"}
      onClick={toggleListening}
      disabled={isProcessing}
      className={`transition-all duration-300 ${
        isListening
          ? "bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse"
          : "text-slate-400 hover:text-indigo-400"
      }`}
      title={isListening ? "Parar de ouvir" : "Falar comando"}
    >
      {isListening ? <Waves className="animate-pulse" /> : <Mic />}
    </Button>
  );
};
