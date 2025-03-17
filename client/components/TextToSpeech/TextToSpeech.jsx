import React, { useEffect, useState } from "react";
import styles from "./TextToSpeech.module.css";

function TextToSpeech({ text }) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleSpeak = () => {
    if ("speechSynthesis" in window && text) {
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.voice = speechSynthesis
        .getVoices()
        .find((voice) => voice.name === "Google US English");
      utterance.pith = 1;
      utterance.rate = 1;
      utterance.volumn = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } else {
      alert(
        "Text-to-speech is not supported in this browser or no text provided",
      );
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <div>
      <button
        onClick={handleSpeak}
        disabled={isSpeaking}
        className={styles.button}
      >
        {isSpeaking ? "Speaking..." : "Speak"}
      </button>
      <button
        onClick={handleStop}
        disabled={!isSpeaking}
        className={styles.button}
      >
        Stop
      </button>
    </div>
  );
}

export default TextToSpeech;
