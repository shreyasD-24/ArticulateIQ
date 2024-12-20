

import React, { useState } from "react";
import { X, Send, Loader2, Upload, Maximize2, Minimize2 } from "lucide-react";
import axios from "axios";
const ChatModal = () => {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [documentSummary, setDocumentSummary] = useState(null);
  const [isDocumentUploaded, setIsDocumentUploaded] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // ... keep existing handleDocumentUpload, sendMessage, and handleRemoveDocument functions ...
  const apiBaseUrl = "http://localhost:3000";

  const handleDocumentUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== "application/pdf") {
      alert("Please upload a valid PDF file.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await axios.post(`${apiBaseUrl}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDocumentSummary(data.summary);
      setIsDocumentUploaded(true);
      setChatHistory([]); // Reset chat history with new document

      // Automatically ask about the document if the summary is not empty
      if (data.summary) {
        console.log(data.summary);
        await sendMessage("What is your view on the document?", data.summary);
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Failed to upload the document.");
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (initialMessage = null, summary = null) => {
    const currentMessage = initialMessage || message;
    if (!currentMessage.trim()) return;

    setIsLoading(true);

    try {
      // Choose endpoint based on whether document is uploaded
      const endpoint = isDocumentUploaded
        ? "/generate_response_with_context"
        : "/generate_response";

      // Prepare payload based on the endpoint
      const payload = {
        auth_message: "hello",
        message: currentMessage,
        chat_history: chatHistory,
        ...(isDocumentUploaded && {
          document_summary: summary || documentSummary,
        }),
      };

      const { data } = await axios.post(`${apiBaseUrl}${endpoint}`, payload);

      // Update chat history with user message and response
      setChatHistory((prev) => [
        ...prev,
        { role: "user", content: currentMessage },
        { role: "assistant", content: data.response },
      ]);

      // Clear message input after sending
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send the message.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file removal
  const handleRemoveDocument = () => {
    setDocumentSummary(null);
    setIsDocumentUploaded(false);
    setChatHistory([]);
  };

  return (
    <div className="fixed bottom-0 right-0 z-50">
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsChatModalOpen(!isChatModalOpen)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
      >
        {isChatModalOpen ? (
          <X size={24} />
        ) : (
          <div className="flex items-center space-x-2">
            <span className="hidden sm:inline">Chat Assistant</span>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
        )}
      </button>

      {/* Chat Modal */}
      <div
        className={`fixed bottom-0 right-0 transition-transform duration-300 ease-in-out ${
          isChatModalOpen
            ? "transform translate-x-0"
            : "transform translate-x-full"
        }`}
      >
        <div
          className={`bg-white rounded-tl-2xl shadow-2xl flex flex-col transition-all duration-300 ${
            isExpanded ? "w-[600px] h-screen" : "w-[400px] h-[600px]"
          }`}
        >
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-tl-2xl flex items-center justify-between">
            <h2 className="text-xl font-semibold">Chat Assistant</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-blue-700 rounded"
              >
                {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
              <button
                onClick={() => setIsChatModalOpen(false)}
                className="p-1 hover:bg-blue-700 rounded"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Document Upload */}
          <div className="border-b p-4">
            <div className="flex items-center space-x-2">
              <Upload size={20} className="text-blue-600" />
              <label className="relative cursor-pointer bg-blue-50 rounded-lg px-4 py-2 hover:bg-blue-100 transition-colors">
                <span className="text-blue-600 text-sm font-medium">
                  {isDocumentUploaded ? "Change Document" : "Upload PDF"}
                </span>
                <input
                  type="file"
                  onChange={handleDocumentUpload}
                  disabled={isLoading}
                  className="hidden"
                />
              </label>
              {isDocumentUploaded && (
                <button
                  onClick={handleRemoveDocument}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {chatHistory.map((chat, index) => (
              <div
                key={index}
                className={`flex ${
                  chat.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    chat.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {chat.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-center">
                <Loader2 className="animate-spin text-blue-600" />
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 bg-white border-t">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && !isLoading && sendMessage()
                }
                disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
              <button
                onClick={() => sendMessage()}
                disabled={isLoading}
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
