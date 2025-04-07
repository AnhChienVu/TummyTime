import React, { useState, useEffect, useRef } from "react";
import { FaComment, FaTimes, FaPaperPlane, FaInfoCircle } from "react-icons/fa";
import styles from "./ChatBot.module.css";
import openRouterService from "../../services/openRouterService";

const RELEVANT_KEYWORDS = [
  'baby', 'infant', 'child', 'toddler', 'newborn', 'kids', 'childhood',
  'feeding', 'formula', 'breastfeed', 'breastmilk', 'milk', 'bottle', 
  'diaper', 'sleep', 'crying', 'colic', 'fever', 'vaccination', 'vaccine',
  'growth', 'development', 'milestone', 'weight', 'height', 'head', 'crawl',
  'walk', 'talk', 'teeth', 'teething', 'solid food', 'symptom', 'doctor',
  'pediatrician', 'stool', 'poop', 'cough', 'cold', 'rash', 'temperature',
  'ear', 'eye', 'nose', 'throat', 'mouth', 'belly', 'stomach', 'allergy',
  'eczema', 'constipation', 'diarrhea', 'nap', 'routine', 'schedule', 'cry',
  'fussy', 'reflux', 'jaundice', 'umbilical', 'bath', 'bathe', 'potty', 'toilet',
  'pacifier', 'toy', 'tummy time', 'checkup', 'appointment', 'prenatal', 'postnatal',
  'premature', 'preemie', 'nutrition', 'preschool', 'daycare', 'nanny', 'caregiver',
  'car seat', 'stroller', 'carrier', 'birth', 'postpartum', 'pregnant'
];

const generateSmartTitle = (userMessage, botReply = '') => {
  if (!userMessage || userMessage.trim() === '') {
    return 'New chat';
  }

  const normalizedQuery = userMessage.toLowerCase().trim();
  
  const topics = {
    'Sleep Issues': ['sleep', 'nap', 'bedtime', 'night', 'wake', 'waking', 'tired', 'drowsy', 'snore', 'snoring'],
    'Feeding & Nutrition': ['feed', 'formula', 'breast', 'milk', 'bottle', 'eat', 'eating', 'food', 'solid', 'nurse', 'hungry'],
    'Development': ['milestone', 'crawl', 'walk', 'talk', 'roll', 'sit', 'stand', 'development', 'grow', 'skill', 'motor'],
    'Health Concern': ['sick', 'fever', 'temperature', 'cold', 'cough', 'rash', 'vomit', 'diarrhea', 'constipation', 'doctor'],
    'Behavior': ['cry', 'crying', 'fussy', 'tantrum', 'behavior', 'calm', 'soothe', 'habit', 'routine', 'discipline'],
    'Teething': ['teeth', 'tooth', 'teething', 'gum', 'drool'],
    'Diapering': ['diaper', 'poop', 'pee', 'stool', 'urine', 'bowel', 'toilet', 'potty']
  };

  for (const [category, keywords] of Object.entries(topics)) {
    for (const keyword of keywords) {
      if (normalizedQuery.includes(keyword)) {
        return category;
      }
    }
  }

  const cleanedMessage = normalizedQuery
    .replace(/^(is|are|my|the|about|how|what|when|why|do|does|can|could|should|would)\s+/i, '')
    .replace(/my baby(\s+is)?(\s+has)?/i, '')
    .trim();

  if (cleanedMessage.length === 0) {
    return 'Baby Care Question';
  }

  const firstWords = cleanedMessage.split(/\s+/).slice(0, 4).join(' ');
  const title = firstWords.charAt(0).toUpperCase() + firstWords.slice(1);
  
  return title.length > 30 ? title.substring(0, 27) + '...' : title;
};

const Disclaimer = () => {
  return (
    <div className={styles.disclaimer}>
      <div className={styles.disclaimerContent}>
        <FaInfoCircle className={styles.disclaimerIcon} />
        <p className={styles.disclaimerText}>
          Information provided may not be 100% accurate. Always consult with a healthcare professional for medical advice.
        </p>
      </div>
    </div>
  );
};

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your baby care assistant. I can answer questions about infant care, feeding, development, and more for children ages 0-7. How can I help you today?", isBot: true }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    setCurrentSessionId(`floating-chat-${Date.now()}`);
  }, []);

  const isRelevantQuery = (query) => {
    if (!query || query.trim() === "") return false;
    
    const normalizedQuery = query.toLowerCase();
    return RELEVANT_KEYWORDS.some(keyword => normalizedQuery.includes(keyword));
  };

  const toggleChat = () => {
    if (isOpen && hasUserInteracted) {
      setCurrentSessionId(`floating-chat-${Date.now()}`);
      setMessages([
        { text: "Hello! I'm your baby care assistant. I can answer questions about infant care, feeding, development, and more for children ages 0-7. How can I help you today?", isBot: true }
      ]);
      setHasUserInteracted(false);
    }
    
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    if (messages.length <= 1 || !currentSessionId) return;
    
    try {
      const storedConversations = localStorage.getItem('babyAssistantConversations');
      let conversations = [];
      
      if (storedConversations) {
        conversations = JSON.parse(storedConversations);
      }
      
      let currentConvo = conversations.find(c => c.id === currentSessionId);
      
      if (currentConvo) {
        currentConvo.messages = messages;
        currentConvo.lastUpdated = new Date().toISOString();
      } else {
        const firstUserMessage = messages.find(m => !m.isBot);
        const firstBotResponse = firstUserMessage ? 
          messages[messages.indexOf(firstUserMessage) + 1] : null;
        
        let title = "New conversation";
        if (firstUserMessage) {
          title = generateSmartTitle(
            firstUserMessage.text, 
            firstBotResponse && firstBotResponse.isBot ? firstBotResponse.text : ''
          );
        }
        
        currentConvo = {
          id: currentSessionId,
          title: title,
          messages: messages,
          lastUpdated: new Date().toISOString()
        };
        
        conversations.unshift(currentConvo);
        
        conversations = conversations.filter(convo => {
          if (convo.id === currentSessionId) return true;
          
          if (convo.messages.length > 1 || convo.messages.some(msg => !msg.isBot)) {
            return true;
          }
          
          return false;
        });
      }
      
      localStorage.setItem('babyAssistantConversations', JSON.stringify(conversations));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }, [messages, currentSessionId]);

  const showTemporaryNotification = (message, duration = 3000) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, duration);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    setHasUserInteracted(true);
    
    if (!inputText.trim()) {
      setMessages(prev => [
        ...prev,
        { text: "Your message was empty. Please try again.", isBot: true }
      ]);
      return;
    }
    
    const userMessage = { text: inputText, isBot: false };
    const currentInput = inputText;
    setMessages([...messages, userMessage]);
    setInputText("");
    setIsLoading(true);
    
    try {
      if (!isRelevantQuery(currentInput)) {
        setTimeout(() => {
          setMessages(prev => [
            ...prev, 
            { 
              text: "I'm specialized in helping with questions about babies and children ages 0-7. " +
                    "If you have questions about feeding, growth, development, symptoms, or " +
                    "other child-related topics, I'd be happy to assist. Could you please ask " +
                    "a question related to infant or child care?", 
              isBot: true 
            }
          ]);
          setIsLoading(false);
        }, 1000);
        return;
      }
      
      const enhancedPrompt = `As an expert in infant and child care (ages 0-7), please answer the following question: ${currentInput}`;
      
      const conversationHistory = messages
        .slice(1)
        .map(msg => ({
          role: msg.isBot ? "assistant" : "user",
          content: msg.text
        }));
      
      const response = await openRouterService.generateResponse(enhancedPrompt, conversationHistory);
      
      const botReply = typeof response === 'object' && response.responseText 
        ? response.responseText 
        : (typeof response === 'string' ? response : "Sorry, I couldn't generate a response");
      
      setMessages(prev => [...prev, { text: botReply, isBot: true }]);
    } catch (error) {
      console.error("Error calling OpenRouter API:", error);
      setMessages(prev => [
        ...prev, 
        { text: "Sorry, I encountered an error. Please try again later.", isBot: true }
      ]);
      showTemporaryNotification("Error connecting to the assistant. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.chatbotContainer}>
      {showNotification && (
        <div className={styles.notification}>
          <div className={styles.notificationContent}>
            <FaInfoCircle className={styles.notificationIcon} />
            <span className={styles.notificationMessage}>{notificationMessage}</span>
          </div>
        </div>
      )}
      
      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <div className={styles.chatTitle}>
              <div className={styles.logoWrapper}>
                <FaComment className={styles.botIcon} />
              </div>
              <span>Baby Care Assistant</span>
            </div>
            <button 
              className={styles.closeButton} 
              onClick={toggleChat}
              aria-label="Close chat"
            >
              <FaTimes />
            </button>
          </div>
          
          <div className={styles.chatMessages}>
            <Disclaimer />
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`${styles.message} ${message.isBot ? styles.botMessage : styles.userMessage}`}
              >
                {message.text}
              </div>
            ))}
            {isLoading && (
              <div className={`${styles.message} ${styles.botMessage} ${styles.typingIndicator}`}>
                <span>.</span><span>.</span><span>.</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <form className={styles.inputArea} onSubmit={sendMessage}>
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder="Type your message..."
              disabled={isLoading}
              className={styles.inputField}
            />
            <button 
              type="submit" 
              disabled={isLoading || !inputText.trim()} 
              className={styles.sendButton}
              aria-label="Send message"
            >
              <FaPaperPlane />
            </button>
          </form>
        </div>
      )}
      
      <button 
        className={styles.chatButton} 
        onClick={toggleChat}
        aria-label="Toggle chat"
      >
        <FaComment />
      </button>
    </div>
  );
};

export default ChatBot;