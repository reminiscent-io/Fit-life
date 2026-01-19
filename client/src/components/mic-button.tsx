import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface MicButtonProps {
  onRecordingComplete: (text: string) => void;
  isProcessing?: boolean;
}

export default function MicButton({ onRecordingComplete, isProcessing = false }: MicButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Use webm format which Whisper supports well
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());

        const audioBlob = new Blob(chunksRef.current, { type: mimeType });

        // Send to transcription API
        setIsTranscribing(true);
        try {
          const text = await api.transcribeAudio(audioBlob);
          if (text && text.trim()) {
            onRecordingComplete(text);
          }
        } catch (error) {
          console.error("Transcription failed:", error);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsListening(true);

      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsListening(false);

      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
      }
    }
  }, []);

  const toggleListening = () => {
    if (isProcessing || isTranscribing) return;

    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const showProcessing = isProcessing || isTranscribing;

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
        disabled={showProcessing}
        className={cn(
          "relative z-10 flex items-center justify-center w-20 h-20 rounded-full shadow-xl transition-all duration-300",
          isListening
            ? "bg-destructive text-destructive-foreground scale-110 shadow-destructive/40"
            : "bg-primary text-primary-foreground hover:scale-105 shadow-primary/40",
          showProcessing && "opacity-80 cursor-not-allowed"
        )}
      >
        {showProcessing ? (
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
          {isTranscribing ? "Transcribing..." : isProcessing ? "Analyzing..." : isListening ? "Listening..." : "Tap to Speak"}
        </span>
      </div>
    </div>
  );
}
