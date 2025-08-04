import React, { useState, useRef, useEffect } from "react";
import { FaPaperPlane, FaUserCircle } from "react-icons/fa";
import { FiArrowDown } from "react-icons/fi";
import io from "socket.io-client";
import axios from "axios";

const socket = io("https://thelifesaversbackend.onrender.com/"); // Replace with your backend server's URL

interface Message {
  name: string;
  message: string;
  createdAt: string; // Timestamp for messages
}

const MessageComponent: React.FC<{ message: Message; isUser: boolean }> = ({
  message,
  isUser,
}) => {
  const formatDate = (dateString: string): string => {
    const messageDate = new Date(dateString);
    const now = new Date();

    const isToday =
      messageDate.getDate() === now.getDate() &&
      messageDate.getMonth() === now.getMonth() &&
      messageDate.getFullYear() === now.getFullYear();

    const isYesterday =
      messageDate.getDate() === now.getDate() - 1 &&
      messageDate.getMonth() === now.getMonth() &&
      messageDate.getFullYear() === now.getFullYear();

    if (isToday) {
      return `Today, ${messageDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}`;
    } else if (isYesterday) {
      return `Yesterday, ${messageDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}`;
    } else {
      return messageDate.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
  };

  return (
    <div
      className={`flex items-start space-x-4 ${isUser ? "justify-end" : ""}`}
    >
      {!isUser && (
        <div className="bg-red-600 text-white p-2 rounded-full shadow-md">
          <FaUserCircle size={24} />
        </div>
      )}
      <div
        className={`${
          isUser ? "bg-gradient-to-r from-gray-100 to-gray-200" : "bg-white"
        } p-4 rounded-lg max-w-md w-full break-words shadow-md relative`}
      >
        <p className="font-semibold text-gray-900">{message.name}</p>
        <p>{message.message}</p>
        <span className="absolute bottom-2 right-2 text-xs text-gray-500">
          {formatDate(message.createdAt)}
        </span>
      </div>
      {isUser && (
        <div className="bg-red-600 text-white p-2 rounded-full shadow-md">
          <FaUserCircle size={24} />
        </div>
      )}
    </div>
  );
};

const InputSection: React.FC<{
  newMessage: string;
  setNewMessage: React.Dispatch<React.SetStateAction<string>>;
  sendMessage: () => void;
  handleTyping: () => void;
}> = ({ newMessage, setNewMessage, sendMessage, handleTyping }) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        className="w-full p-3 sm:p-4 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm transition"
        placeholder="Type your message..."
        value={newMessage}
        onChange={(e) => {
          setNewMessage(e.target.value);
          handleTyping();
        }}
        onKeyDown={handleKeyPress}
      />
      <button
        onClick={sendMessage}
        disabled={!newMessage.trim()}
        className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full shadow-lg transition ${
          newMessage.trim()
            ? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:bg-red-700"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        <FaPaperPlane size={18} />
      </button>
    </div>
  );
};

const Community: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [typing, setTyping] = useState(false);
  const [someoneTyping, setSomeoneTyping] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected);
  const [usersOnline, setUsersOnline] = useState<number>(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const userName =
    JSON.parse(localStorage.getItem("user") || "{}")?.firstName || "You";

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/chat/history`
        );
        setMessages(response.data);
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
      }
    };

    fetchChatHistory();

    console.log("Socket connected:", socket.connected);

    // Listen to socket events
    socket.on("connect", () => {
      setIsConnected(true);
      console.log("Socket connected");
    });
    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Socket disconnected");
    });
    socket.on("usersOnline", (count: number) => setUsersOnline(count));
    socket.on("receiveMessage", (messageData: Message) => {
      setMessages((prevMessages) => [...prevMessages, messageData]);
    });
    socket.on("userTyping", () => setSomeoneTyping(true));
    socket.on("userStoppedTyping", () => setSomeoneTyping(false));

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("usersOnline");
      socket.off("receiveMessage");
      socket.off("userTyping");
      socket.off("userStoppedTyping");
    };
  }, []);

  const handleScroll = () => {
    const container = chatEndRef.current?.parentElement;

    if (container) {
      const isUserAtBottom =
        container.scrollTop + container.clientHeight >= container.scrollHeight;

      setIsAtBottom(isUserAtBottom);

      if (isUserAtBottom) {
        setShowNewMessageButton(false);
      }
    }
  };

  useEffect(() => {
    if (isAtBottom) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (messages.length > 0) {
      setShowNewMessageButton(true);
    }
  }, [messages]);

  const sendMessage = () => {
    if (newMessage.trim() !== "") {
      const messageData = {
        name: userName,
        message: newMessage,
        createdAt: new Date().toISOString(), // Add createdAt with the current time
      };

      socket.emit("sendMessage", messageData);
      socket.emit("userStoppedTyping");
      setNewMessage("");
      setTyping(false);
      setIsAtBottom(true);
    }
  };

  const handleTyping = () => {
    if (!typing) {
      setTyping(true);
      socket.emit("userTyping");
    }
    setTimeout(() => {
      setTyping(false);
      socket.emit("userStoppedTyping");
    }, 2000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 sm:px-8 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden relative max-h-[85vh] flex flex-col">
        <div className="bg-gradient-to-r from-red-500 to-red-700 text-white text-center py-6 px-6 shadow-md">
          <h1 className="text-4xl font-bold mb-2">Community Chat</h1>
          <p className="text-sm font-light">
            Connect, Chat, and Share with the Community
          </p>
          <p className="mt-2 text-xs font-medium">
            Status:{" "}
            <span
              className={`${
                isConnected ? "text-green-300" : "text-red-300"
              } font-semibold`}
            >
              {isConnected ? "Online" : "Offline"}
            </span>{" "}
            | Users Online:{" "}
            <span className="font-semibold text-yellow-300">{usersOnline}</span>
          </p>
        </div>  

        {someoneTyping && (
          <div className="flex justify-center items-center bg-red-100 text-red-700 font-semibold text-sm py-2 px-4 rounded-md mx-6 mt-2 mb-2 animate-pulse opacity-90 transition-opacity duration-700 ease-in-out">
            <span>Someone is typing...</span>
          </div>
        )}

        <div
          className="relative flex-1 overflow-y-auto space-y-4 py-6 px-6 bg-white rounded-xl"
          onScroll={handleScroll}
        >
          {messages.map((msg, index) => (
            <MessageComponent
              key={index}
              message={msg}
              isUser={msg.name === userName}
            />
          ))}
          <div ref={chatEndRef} />
        </div>

        {showNewMessageButton && (
          <div className="flex justify-end mr-2">
            <span
              onClick={() => {
                chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
                setShowNewMessageButton(false);
              }}
              className="text-red-500 hover:text-red-600 font-semibold text-sm flex items-center cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-105"
            >
              <FiArrowDown className="ml-1" /> New chat
            </span>
          </div>
        )}

        <div className="py-4 px-6 bg-white border-t border-gray-200">
          <InputSection
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            sendMessage={sendMessage}
            handleTyping={handleTyping}
          />
        </div>

        <div className="text-center py-4">
          <p className="text-xs text-gray-500">
            Join the conversation and be part of a vibrant community.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Community;
