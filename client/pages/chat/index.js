import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import {
  FaPlus,
  FaComment,
  FaTrash,
  FaUser,
  FaInfoCircle,
} from "react-icons/fa";

import openRouterService from "../../services/openRouterService";
import styles from "./chat.module.css";

const Disclaimer = () => {
  return (
    <div className={styles.disclaimer}>
      <div className={styles.disclaimerContent}>
        <FaInfoCircle className={styles.disclaimerIcon} />
        <p className={styles.disclaimerText}>
          Information provided may not be 100% accurate. Always consult with a
          healthcare professional for medical advice.
        </p>
      </div>
    </div>
  );
};

const EmptyState = ({ onNewChat }) => (
  <div className={styles.emptyState}>
    <div className={styles.emptyStateIconContainer}>
      <FaComment className={styles.emptyStateIcon} />
    </div>
    <h2>Welcome to Baby Care Assistant</h2>
    <p>Get reliable answers to your questions about infant and child care.</p>
    <button className={styles.newChatButton} onClick={onNewChat}>
      <FaPlus /> Start a new conversation
    </button>
  </div>
);

const Notification = ({ message, visible }) => {
  if (!visible) return null;

  return (
    <div className={styles.notification}>
      <FaInfoCircle className={styles.notificationIcon} />
      <span>{message}</span>
    </div>
  );
};

const generateSmartTitle = (userQuery, botResponse = "") => {
  if (!userQuery || userQuery.trim() === "") {
    return "New conversation";
  }

  const normalizedQuery = userQuery.toLowerCase().trim();

  const topics = {
    "Sleep Issues": [
      "sleep",
      "nap",
      "bedtime",
      "night",
      "wake",
      "waking",
      "tired",
      "drowsy",
      "snore",
      "snoring",
    ],
    "Feeding & Nutrition": [
      "feed",
      "formula",
      "breast",
      "milk",
      "bottle",
      "eat",
      "eating",
      "food",
      "solid",
      "nurse",
      "hungry",
      "appetite",
      "nutrition",
    ],
    Development: [
      "milestone",
      "crawl",
      "walk",
      "talk",
      "roll",
      "sit",
      "stand",
      "development",
      "grow",
      "skill",
      "motor",
    ],
    "Health Concern": [
      "sick",
      "fever",
      "temperature",
      "cold",
      "cough",
      "rash",
      "vomit",
      "diarrhea",
      "constipation",
      "doctor",
      "medicine",
      "vaccine",
    ],
    "Behavior & Routine": [
      "cry",
      "crying",
      "fussy",
      "tantrum",
      "behavior",
      "calm",
      "soothe",
      "habit",
      "routine",
      "discipline",
    ],
    Teething: ["teeth", "tooth", "teething", "gum", "drool"],
    "Diapering & Potty": [
      "diaper",
      "poop",
      "pee",
      "stool",
      "urine",
      "bowel",
      "toilet",
      "potty",
    ],
  };

  let agePrefix = "";
  const ageMatch = normalizedQuery.match(
    /(\d+)\s*(month|week|year|day)s?\s*(old)?/,
  );
  if (ageMatch) {
    agePrefix = `${ageMatch[1]} ${ageMatch[2]}${
      parseInt(ageMatch[1]) !== 1 ? "s" : ""
    }: `;
  }

  let matchedCategory = "";
  let highestScore = 0;
  let bestKeyword = "";

  Object.entries(topics).forEach(([category, keywords]) => {
    keywords.forEach((keyword) => {
      if (normalizedQuery.includes(keyword)) {
        const position = normalizedQuery.indexOf(keyword);
        const score = 10 - Math.min(position / 10, 9);

        if (score > highestScore) {
          highestScore = score;
          matchedCategory = category;
          bestKeyword = keyword;
        }
      }
    });
  });

  if (matchedCategory) {
    return `${matchedCategory}`;
  }

  let cleanedQuery = normalizedQuery
    .replace(
      /^(is|are|the|about|how|what|when|why|do|does|can|could|should|would)\s+/i,
      "",
    )
    .replace(/my baby(\s+is)?(\s+has)?/i, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleanedQuery.length > 0) {
    cleanedQuery = cleanedQuery.charAt(0).toUpperCase() + cleanedQuery.slice(1);
  }

  if (cleanedQuery.length > 35) {
    cleanedQuery = cleanedQuery.substring(0, 32) + "...";
  } else if (cleanedQuery.length === 0) {
    const words = normalizedQuery.split(" ").slice(0, 5).join(" ");
    cleanedQuery = words.charAt(0).toUpperCase() + words.slice(1);

    if (cleanedQuery.length > 35) {
      cleanedQuery = cleanedQuery.substring(0, 32) + "...";
    }
  }

  return `${agePrefix}${cleanedQuery}`;
};

const ChatPage = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [newChatBlocked, setNewChatBlocked] = useState(false);
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
  });
  const messagesEndRef = useRef(null);
  const [activeChatTitle, setActiveChatTitle] = useState("");

  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      const timeoutId = setTimeout(() => {
        messagesEndRef.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [messages]);

  const showNotification = (message, duration = 3000) => {
    setNotification({ visible: true, message });
    setTimeout(() => {
      setNotification({ visible: false, message: "" });
    }, duration);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      loadConversations();
    }
  });

  const loadConversations = () => {
    const storedConversations = localStorage.getItem(
      "babyAssistantConversations",
    );

    if (storedConversations) {
      try {
        let parsedConversations = JSON.parse(storedConversations);

        parsedConversations = parsedConversations.filter((conversation) => {
          return (
            conversation.messages.length > 1 ||
            conversation.messages.some((msg) => !msg.isBot)
          );
        });

        localStorage.setItem(
          "babyAssistantConversations",
          JSON.stringify(parsedConversations),
        );

        setConversations(parsedConversations);

        if (parsedConversations.length > 0 && !activeConversation) {
          setActiveConversation(parsedConversations[0].id);
          setActiveChatTitle(parsedConversations[0].title || "Chat");
          setMessages(parsedConversations[0].messages);
        }
      } catch (error) {
        console.error("Error parsing conversations:", error);
        showNotification("Error loading conversations");
      }
    }
  };

  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(
        "babyAssistantConversations",
        JSON.stringify(conversations),
      );
    }
  }, [conversations]);

  const createNewConversation = () => {
    const emptyConversation = conversations.find(
      (conv) =>
        conv.title === "New conversation" &&
        conv.messages.length === 1 &&
        conv.messages[0].isBot,
    );

    if (window) {
      window.scrollTo(0, 0);
    }

    if (emptyConversation) {
      setActiveConversation(emptyConversation.id);
      setActiveChatTitle("New conversation");
      setMessages(emptyConversation.messages);

      setNewChatBlocked(true);
      setTimeout(() => setNewChatBlocked(false), 3000);
      return;
    }

    const newId = Date.now().toString();
    const newConversation = {
      id: newId,
      title: "New conversation",
      lastUpdated: new Date().toISOString(),
      messages: [
        {
          text: "Hello! I'm your baby care assistant. I can answer questions about infant care, feeding, development, and more for children ages 0-7. How can I help you today?",
          isBot: true,
        },
      ],
    };

    setConversations([newConversation, ...conversations]);
    setActiveConversation(newId);
    setActiveChatTitle("New conversation");
    setMessages(newConversation.messages);
  };

  const deleteConversation = (id, e) => {
    e.stopPropagation();
    const updatedConversations = conversations.filter((conv) => conv.id !== id);
    setConversations(updatedConversations);

    if (activeConversation === id) {
      if (updatedConversations.length > 0) {
        setActiveConversation(updatedConversations[0].id);
        setActiveChatTitle(updatedConversations[0].title || "Chat");
        setMessages(updatedConversations[0].messages);
      } else {
        setActiveConversation(null);
        setActiveChatTitle("");
        setMessages([]);
      }
    }
  };

  const switchConversation = (id) => {
    if (id === activeConversation) return;

    if (window) {
      window.scrollTo(0, 0);
    }

    const conversation = conversations.find((conv) => conv.id === id);
    if (conversation) {
      setActiveConversation(id);
      setActiveChatTitle(conversation.title || "Chat");
      setMessages(conversation.messages);

      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({
            behavior: "auto",
            block: "end",
          });
        }
      }, 50);
    }
  };

  const isRelevantQuery = (query) => {
    if (!query || query.trim() === "") return false;

    const RELEVANT_KEYWORDS = [
      "baby",
      "infant",
      "child",
      "toddler",
      "newborn",
      "kids",
      "childhood",
      "feeding",
      "formula",
      "breastfeed",
      "breastmilk",
      "milk",
      "bottle",
      "diaper",
      "sleep",
      "crying",
      "colic",
      "fever",
      "vaccination",
      "vaccine",
      "growth",
      "development",
      "milestone",
      "weight",
      "height",
      "head",
      "crawl",
      "walk",
      "talk",
      "teeth",
      "teething",
      "solid food",
      "symptom",
      "doctor",
      "pediatrician",
      "stool",
      "poop",
      "cough",
      "cold",
      "rash",
      "temperature",
      "ear",
      "eye",
      "nose",
      "throat",
      "mouth",
      "belly",
      "stomach",
      "allergy",
      "eczema",
      "constipation",
      "diarrhea",
      "nap",
      "routine",
      "schedule",
      "cry",
      "fussy",
      "reflux",
      "jaundice",
      "umbilical",
      "bath",
      "bathe",
      "potty",
      "toilet",
      "pacifier",
      "toy",
      "tummy time",
      "checkup",
      "appointment",
      "prenatal",
      "postnatal",
      "premature",
      "preemie",
      "nutrition",
      "preschool",
      "daycare",
      "nanny",
      "caregiver",
      "car seat",
      "stroller",
      "carrier",
      "birth",
      "postpartum",
      "pregnant",
    ];

    const normalizedQuery = query.toLowerCase();
    return RELEVANT_KEYWORDS.some((keyword) =>
      normalizedQuery.includes(keyword),
    );
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!inputText.trim()) {
      const emptyMessage = {
        text: "Your message was empty. Please try again.",
        isBot: true,
      };
      const updatedMessages = [...messages, emptyMessage];

      setMessages(updatedMessages);

      if (activeConversation) {
        const updatedConversations = conversations.map((conv) => {
          if (conv.id === activeConversation) {
            return {
              ...conv,
              messages: updatedMessages,
              lastUpdated: new Date().toISOString(),
            };
          }
          return conv;
        });
        setConversations(updatedConversations);
      }

      return;
    }

    if (!activeConversation) {
      createNewConversation();
      showNotification(
        "New conversation created. Please try sending your message again.",
      );
      return;
    }

    const userMessage = { text: inputText, isBot: false };
    const updatedMessages = [...messages, userMessage];
    const currentInput = inputText;

    setMessages(updatedMessages);
    setInputText("");
    setIsLoading(true);

    let currentConversation = conversations.find(
      (conv) => conv.id === activeConversation,
    );
    if (currentConversation) {
      let updatedTitle = currentConversation.title;
      if (updatedTitle === "New conversation") {
        updatedTitle = generateSmartTitle(currentInput);
        setActiveChatTitle(updatedTitle);
      }

      let updatedConversations = conversations.map((conv) => {
        if (conv.id === activeConversation) {
          return {
            ...conv,
            title: updatedTitle,
            messages: updatedMessages,
            lastUpdated: new Date().toISOString(),
          };
        }
        return conv;
      });

      setConversations(updatedConversations);
    }

    try {
      let botReply;

      if (!isRelevantQuery(currentInput)) {
        botReply =
          "I'm specialized in helping with questions about babies and children ages 0-7. " +
          "If you have questions about feeding, growth, development, symptoms, or " +
          "other child-related topics, I'd be happy to assist. Could you please ask " +
          "a question related to infant or child care?";
      } else {
        const conversationHistory = messages.slice(1).map((msg) => ({
          role: msg.isBot ? "assistant" : "user",
          content: msg.text,
        }));

        const enhancedPrompt = `As an expert in infant and child care (ages 0-7), please answer the following question: ${currentInput}`;

        const response = await openRouterService.generateResponse(
          enhancedPrompt,
          conversationHistory,
        );

        botReply =
          typeof response === "object" && response.responseText
            ? response.responseText
            : typeof response === "string"
            ? response
            : "Sorry, I couldn't generate a response";
      }

      const botMessage = { text: botReply, isBot: true };
      const finalMessages = [...updatedMessages, botMessage];

      let updatedTitle = currentConversation.title;
      if (
        updatedTitle === "New conversation" ||
        (currentConversation.messages.length <= 2 &&
          updatedTitle === generateSmartTitle(currentInput))
      ) {
        updatedTitle = generateSmartTitle(currentInput, botReply);
        setActiveChatTitle(updatedTitle);
      }

      setMessages(finalMessages);

      const updatedConversations = conversations.map((conv) => {
        if (conv.id === activeConversation) {
          return {
            ...conv,
            title: updatedTitle,
            messages: finalMessages,
            lastUpdated: new Date().toISOString(),
          };
        }
        return conv;
      });

      setConversations(updatedConversations);
    } catch (error) {
      console.error("Error calling OpenRouter API:", error);

      const errorMessage = {
        text: "Sorry, I encountered an error. Please try again later.",
        isBot: true,
      };

      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);

      const updatedConversations = conversations.map((conv) => {
        if (conv.id === activeConversation) {
          return {
            ...conv,
            messages: finalMessages,
            lastUpdated: new Date().toISOString(),
          };
        }
        return conv;
      });

      setConversations(updatedConversations);
      showNotification(
        "Error connecting to the assistant. Please try again later.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Baby Care Assistant | Chat</title>
        <meta
          name="description"
          content="Chat with our Baby Care Assistant for answers about infant and child care"
        />
      </Head>

      <div className={styles.chatPageContainer}>
        {notification.visible && (
          <Notification
            message={notification.message}
            visible={notification.visible}
          />
        )}

        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2>Baby Care Assistant</h2>
            {newChatBlocked && (
              <div className={styles.notification}>
                Using existing empty chat
              </div>
            )}
            <button
              className={styles.newChatButton}
              onClick={createNewConversation}
            >
              <FaPlus /> New Chat
            </button>
          </div>

          <div className={styles.conversationsList}>
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`${styles.conversationItem} ${
                  activeConversation === conversation.id
                    ? styles.activeConversation
                    : ""
                }`}
                onClick={() => switchConversation(conversation.id)}
              >
                <div className={styles.conversationDetails}>
                  <div className={styles.conversationIconWrap}>
                    <FaComment className={styles.conversationIcon} />
                  </div>
                  <div className={styles.conversationText}>
                    <h3>{conversation.title}</h3>
                    <p>
                      {new Date(conversation.lastUpdated).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  className={styles.deleteButton}
                  onClick={(e) => deleteConversation(conversation.id, e)}
                  aria-label="Delete conversation"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.chatArea}>
          {activeConversation ? (
            <>
              <div className={styles.chatHeader}>
                <h2>{activeChatTitle || "Chat"}</h2>
              </div>

              <div className={styles.messagesList}>
                <Disclaimer />

                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`${styles.message} ${
                      message.isBot ? styles.botMessage : styles.userMessage
                    }`}
                  >
                    <div className={styles.messageIcon}>
                      {message.isBot ? <FaComment /> : <FaUser />}
                    </div>
                    <div className={styles.messageContent}>
                      <div className={styles.messageText}>{message.text}</div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className={`${styles.message} ${styles.botMessage}`}>
                    <div className={styles.messageIcon}>
                      <FaComment />
                    </div>
                    <div className={styles.messageContent}>
                      <div
                        className={`${styles.messageText} ${styles.typingIndicator}`}
                      >
                        <span>.</span>
                        <span>.</span>
                        <span>.</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <form className={styles.inputArea} onSubmit={sendMessage}>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
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
                  Send
                </button>
              </form>
            </>
          ) : (
            <EmptyState onNewChat={createNewConversation} />
          )}
        </div>
      </div>
    </>
  );
};

export default ChatPage;
