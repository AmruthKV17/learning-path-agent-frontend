import React, { useState, useEffect } from "react";
import { Search, Sparkles, Edit, BookOpen, Zap, Loader2 } from "lucide-react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import AIAgentPage from "./AIAgentPage";
import QuizPage from "./QuizPage";

function LandingPage() {
  const [searchValue, setSearchValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const suggestions = [
    "Suggest design inspiration for a cta section",
    "Design a navigation bar component with links",
    "Suggest improvements for a form design",
    "Fix this error: 'Cannot read properties of undefined'",
  ];

  // Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []);

  async function sendMessageToRelay(message, sessionId) {
    try {
      const response = await fetch(
        "https://hook.relay.app/api/v1/playbook/cme2775ui2be90olw8bev7n88/trigger/m2aP9_6iPl9sIiOcl-VFEA",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            sessionId,
            callbackUrl: "https://learning-path-agent-backend.onrender.com/relay-callback" // Include sessionId for backend communication
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Relay app error: ${response.status}`);
      }

      // Try to get response data if available
      const responseData = await response.json().catch(() => null);
      console.log('Relay app response:', responseData);

      return responseData;
    } catch (error) {
      console.error('Error calling Relay app:', error);
      return null;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      setIsSubmitting(true);
      try {
        // Generate a unique session ID for this request
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Register with the backend server
        if (socket) {
          socket.emit('register', sessionId);
          console.log('Registered sessionId:', sessionId);
        }

        // Send to Relay app with sessionId
        const relayResponse = await sendMessageToRelay(searchValue, sessionId);

        // Navigate to AI agent page with query, sessionId, and relay response
        navigate("/ai-agent", {
          state: {
            query: searchValue,
            sessionId: sessionId,
            relayResponse: relayResponse
          }
        });
        setSearchValue("");
      } catch (err) {
        console.error("Submit failed:", err);
        setIsSubmitting(false);
        alert("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="bg-white border rounded-xl shadow-lg px-8 py-6 flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
            <p className="mt-3 text-gray-700 font-medium">Preparing your AI workspace...</p>
            <p className="mt-1 text-sm text-gray-500">This should only take a moment</p>
          </div>
        </div>
      )}
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-black transform rotate-45"></div>
            <div className="w-2 h-2 bg-black transform rotate-45"></div>
          </div>
          <span className="font-semibold text-lg">LearnPathAgent.ai</span>
        </div>

        {/* <div className="hidden md:flex items-center space-x-8">
          <a href="#" className="text-gray-700 hover:text-black">
            Demo
          </a>
          <a href="#" className="text-gray-700 hover:text-black">
            Features
          </a>
          <a href="#" className="text-gray-700 hover:text-black">
            Product
          </a>
          <a href="#" className="text-gray-700 hover:text-black">
            About
          </a>
        </div> */}

        {/* <button className="px-4 py-2 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          Log in
        </button> */}
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
        {/* Funding Banner */}
        <div className="inline-block bg-yellow-200 px-4 py-2 rounded-full text-sm font-medium mb-8">
          We haven't raised any funding since its just a prototype project 😅
        </div>

        {/* Hero Text */}
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Because Googling Random Stuff
          <br />
          Isn't a Learning Plan
        </h1>

        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          An AI-powered platform that turns any query into a clear topic, creates personalized learning paths, curates reliable resources and tests understanding — making learning faster, smarter, and more engaging.
        </p>

        {/* CTA Button
        <button className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors mb-16 inline-flex items-center space-x-2">
          <span>Get started</span>
          <span>→</span>
        </button> */}

        {/* Search Interface */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-white rounded-lg shadow-lg border p-4 mb-4">
            <form onSubmit={handleSubmit}>
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  placeholder="What you want to learn today?"
                  className="flex-1 text-gray-700 outline-none"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                />
                <button
                  type="submit"
                  className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center cursor-pointer "
                >
                  <span className="text-sm">→</span>
                </button>
              </div>
            </form>
          </div>

          {/* Search Dropdown
          {showDropdown && (
            <div className="bg-gray-700 text-white rounded-lg shadow-xl p-2 text-left">
              <div className="flex items-center space-x-2 p-2 mb-2">
                <Search className="w-4 h-4 text-gray-300" />
                <span className="text-gray-300 text-sm">Search</span>
              </div>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="px-3 py-2 hover:bg-gray-600 rounded cursor-pointer text-sm"
                  onClick={() => {
                    setSearchValue(suggestion);
                    setShowDropdown(false);
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )} */}
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10">
            <div
              className="w-full h-full bg-gradient-to-r from-transparent via-gray-300 to-transparent"
              style={{
                backgroundImage: `radial-gradient(circle, #d1d5db 1px, transparent 1px)`,
                backgroundSize: "30px 30px",
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/ai-agent" element={<AIAgentPage />} />
        <Route path="/quiz" element={<QuizPage />} />
      </Routes>
    </Router>
  );
}
