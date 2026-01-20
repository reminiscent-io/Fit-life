import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Mic, MicOff, Loader2, X, Dumbbell, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, type AiInsight } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const SUGGESTED_QUESTIONS = [
  "What have I been working on recently?",
  "Where have I seen improvement?",
  "What muscle groups am I neglecting?",
  "Give me a workout for today",
];

export default function AiCoach() {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [insight, setInsight] = useState<AiInsight | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const askMutation = useMutation({
    mutationFn: (q: string) => api.askAiCoach(q),
    onSuccess: (data) => {
      setInsight(data);
    },
  });

  const handleAsk = (q?: string) => {
    const questionToAsk = q || question;
    if (!questionToAsk.trim()) return;

    setInsight(null);
    askMutation.mutate(questionToAsk);
    if (!q) setQuestion("");
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });

        setIsTranscribing(true);
        try {
          const text = await api.transcribeAudio(audioBlob);
          if (text && text.trim()) {
            setQuestion(text);
            // Automatically ask after transcription
            askMutation.mutate(text);
          }
        } catch (error) {
          console.error("Transcription failed:", error);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsListening(true);

      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  }, [askMutation]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsListening(false);

      if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
      }
    }
  }, []);

  const toggleListening = () => {
    if (askMutation.isPending || isTranscribing) return;

    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setInsight(null);
    setQuestion("");
  };

  const isLoading = askMutation.isPending || isTranscribing;

  return (
    <>
      {/* Floating AI Coach Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40",
          "flex items-center gap-2 px-4 py-3 rounded-full",
          "bg-gradient-to-r from-violet-500 to-purple-600",
          "text-white font-medium shadow-lg shadow-purple-500/30",
          "hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Sparkles className="h-5 w-5" />
        <span className="hidden sm:inline">AI Coach</span>
      </motion.button>

      {/* AI Coach Drawer */}
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DrawerTitle className="font-heading">AI Fitness Coach</DrawerTitle>
                  <DrawerDescription>Ask me anything about your fitness journey</DrawerDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DrawerHeader>

          <ScrollArea className="flex-1 p-4 max-h-[60vh]">
            {/* Suggested Questions */}
            {!insight && !isLoading && (
              <div className="space-y-3 mb-6">
                <p className="text-sm text-muted-foreground font-medium">Try asking:</p>
                <div className="grid gap-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleAsk(q)}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted text-left transition-colors group"
                    >
                      <span className="text-sm">{q}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                  <motion.div
                    className="absolute inset-0 rounded-full bg-violet-500/20"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                </div>
                <p className="text-muted-foreground">
                  {isTranscribing ? "Transcribing your question..." : "Analyzing your fitness data..."}
                </p>
              </div>
            )}

            {/* AI Response */}
            {insight && !isLoading && (
              <div className="space-y-6">
                {/* Main Answer */}
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">{insight.answer}</p>
                </div>

                {/* Recommendations */}
                {insight.recommendations && insight.recommendations.length > 0 && (
                  <Card className="border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20">
                    <CardContent className="p-4">
                      <h4 className="font-heading font-bold text-sm mb-3 text-violet-700 dark:text-violet-300">
                        Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {insight.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-violet-500 mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Suggested Workout */}
                {insight.suggestedWorkout && (
                  <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Dumbbell className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <h4 className="font-heading font-bold text-sm text-green-700 dark:text-green-300">
                          {insight.suggestedWorkout.name}
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {insight.suggestedWorkout.exercises.map((exercise, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900 shadow-sm"
                          >
                            <div>
                              <p className="font-medium text-sm">{exercise.exerciseName}</p>
                              {exercise.notes && (
                                <p className="text-xs text-muted-foreground mt-0.5">{exercise.notes}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {exercise.sets} x {exercise.reps}
                              </p>
                              {exercise.weight && (
                                <p className="text-xs text-muted-foreground">{exercise.weight} lbs</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Ask Another Question */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setInsight(null)}
                >
                  Ask another question
                </Button>
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t bg-background">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                  placeholder="Ask about your fitness..."
                  disabled={isLoading}
                  className="pr-10"
                />
              </div>

              {/* Voice Input Button */}
              <Button
                variant={isListening ? "destructive" : "outline"}
                size="icon"
                onClick={toggleListening}
                disabled={askMutation.isPending}
                className="shrink-0"
              >
                <AnimatePresence mode="wait">
                  {isTranscribing ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </motion.div>
                  ) : isListening ? (
                    <motion.div
                      key="listening"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                    >
                      <MicOff className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                    >
                      <Mic className="h-4 w-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>

              {/* Send Button */}
              <Button
                onClick={() => handleAsk()}
                disabled={!question.trim() || isLoading}
                className="shrink-0 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {isListening && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-center text-destructive mt-2"
              >
                Listening... Tap the mic to stop
              </motion.p>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
