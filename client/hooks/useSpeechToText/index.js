import { useState, useRef, useEffect } from "react";

function useSpeechToText(options) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const [showFirefoxModal, setShowFirefoxModal] = useState(false);

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === "undefined") return;

    try {
      // Check for browser support
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setError("Speech recognition not supported");
        console.error("Speech recognition not supported in this browser");
        return;
      }

      // Initialize recognition
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;

      // Configure recognition
      recognition.interimResults = options?.interimResults ?? true;
      recognition.lang = options?.lang ?? "en-US";
      recognition.continuous = options?.continuous ?? true;

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setError(event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } catch (err) {
      console.error("Error initializing speech recognition:", err);
      setError(err.message);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []); // Empty dependency array since we only want to initialize once

  const startListening = () => {
    if (!recognitionRef.current) {
      console.error("Speech recognition not initialized");
      setError("Speech recognition not initialized");
      return;
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
      setError(null);
    } catch (err) {
      console.error("Failed to start recognition:", err);
      setError(err.message);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
      setIsListening(false);
    } catch (err) {
      console.error("Failed to stop recognition:", err);
    }
  };

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    showFirefoxModal,
    setShowFirefoxModal,
  };
}

export default useSpeechToText;
