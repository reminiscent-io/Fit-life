import { useState, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface MicButtonProps {
  onRecordingComplete: (text: string) => void;
  isProcessing?: boolean;
}

export default function MicButton({ onRecordingComplete, isProcessing = false }: MicButtonProps) {
  const [isListening, setIsListening] = useState(false);
  
  // Mock recording effect
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isListening) {
      // Simulate speaking duration
      timeout = setTimeout(() => {
        setIsListening(false);
        onRecordingComplete("I did 3 sets of bench press at 135 pounds for 10 reps");
      }, 3000);
    }
    
    return () => clearTimeout(timeout);
  }, [isListening, onRecordingComplete]);

  const toggleListening = () => {
    if (isProcessing) return;
    setIsListening(!isListening);
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Ripple Effect Rings */}
      <AnimatePresence>
        {isListening && (
          <>
            <motion.div
              initial={{ opacity: 0.5, scale: 1 }}
              animate={{ opacity: 0, scale: 2 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
              className="absolute inset-0 rounded-full bg-primary/20"
            />
            <motion.div
              initial={{ opacity: 0.5, scale: 1 }}
              animate={{ opacity: 0, scale: 1.5 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.5, ease: "easeOut" }}
              className="absolute inset-0 rounded-full bg-primary/10"
            />
          </>
        )}
      </AnimatePresence>

      <button
        onClick={toggleListening}
        disabled={isProcessing}
        className={cn(
          "relative z-10 flex items-center justify-center w-20 h-20 rounded-full shadow-xl transition-all duration-300",
          isListening 
            ? "bg-destructive text-destructive-foreground scale-110 shadow-destructive/40" 
            : "bg-primary text-primary-foreground hover:scale-105 shadow-primary/40",
          isProcessing && "opacity-80 cursor-not-allowed"
        )}
      >
        {isProcessing ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : isListening ? (
          <div className="flex items-center justify-center h-full w-full">
            <span className="animate-pulse h-3 w-3 bg-white rounded-full mx-0.5" />
            <span className="animate-pulse h-5 w-1 bg-white rounded-full mx-0.5 animation-delay-75" />
            <span className="animate-pulse h-3 w-1 bg-white rounded-full mx-0.5 animation-delay-150" />
          </div>
        ) : (
          <Mic className="h-8 w-8" />
        )}
      </button>

      {/* Label */}
      <div className="absolute top-24 text-center w-40">
        <span className={cn(
          "text-sm font-medium transition-colors duration-300",
          isListening ? "text-destructive" : "text-muted-foreground"
        )}>
          {isProcessing ? "Analyzing..." : isListening ? "Listening..." : "Tap to Speak"}
        </span>
      </div>
    </div>
  );
}
