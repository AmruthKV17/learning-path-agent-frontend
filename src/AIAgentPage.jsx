import React, { useState, useEffect } from "react";
import { ArrowLeft, Sparkles, Loader2, CheckCircle, XCircle, Search } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import TodoistService from "./services/todoistService";
import TodoistDisplay from "./components/TodoistDisplay";
import {LayeredBackground} from 'animated-backgrounds'

export default function AIAgentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [todoistData, setTodoistData] = useState(null);
  const [todoistLoading, setTodoistLoading] = useState(true);
  const [todoistError, setTodoistError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [relayResponse, setRelayResponse] = useState(null);
  
  const query = location.state?.query || "No query provided";
  const sessionId = location.state?.sessionId;

  // Initialize Socket.IO connection
  useEffect(() => {
    if (sessionId) {
      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);

      // Register with the same sessionId
      newSocket.emit('register', sessionId);
      console.log('Registered sessionId in AI Agent page:', sessionId);

      // Listen for relay responses
      newSocket.on('relay-response', (data) => {
        console.log('Received relay response:', data);
        setRelayResponse(data);
        
        // If we get project information, fetch Todoist data
        if (data.projectName) {
          fetchTodoistProject(data.projectName);
        }
      });

      // Cleanup on unmount
      return () => {
        if (newSocket) {
          newSocket.close();
        }
      };
    }
  }, [sessionId]);

  // Fetch Todoist project by name
  const fetchTodoistProject = async (projectName) => {
    try {
      setTodoistLoading(true);
      setTodoistError(null);
      
      console.log('Fetching Todoist project:', projectName);
      const data = await TodoistService.getProjectByName(projectName);
      setTodoistData(data);
    } catch (error) {
      console.error('Error fetching Todoist project:', error);
      setTodoistError(error.message || 'Failed to fetch Todoist data');
    } finally {
      setTodoistLoading(false);
    }
  };

  // Poll for new project if no relay response
  const pollForNewProject = async () => {
    try {
      setTodoistLoading(true);
      setTodoistError(null);
      
      console.log('Polling for new project based on query:', query);
      const data = await TodoistService.pollForNewProject(query);
      setTodoistData(data);
    } catch (error) {
      console.error('Error polling for new project:', error);
      setTodoistError(error.message || 'Failed to fetch Todoist data');
    } finally {
      setTodoistLoading(false);
    }
  };

  useEffect(() => {
    // Simulate AI processing time
    const timer = setTimeout(() => {
      setIsLoading(false);
      // For demo purposes, we'll show a mock result
      // In a real app, you'd get the actual response from your Relay app
      setResult({
        message: `Analysis complete for: "${query}". Your AI agent has processed your request and generated personalized insights.`,
        suggestions: [
          "Consider adding more visual hierarchy",
          "Try using contrasting colors for better accessibility",
          "Implement responsive design patterns"
        ]
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch Todoist data based on relay response or fallback to polling
  useEffect(() => {
    const fetchTodoistData = async () => {
      try {
        setTodoistLoading(true);
        setTodoistError(null);
        
        // Get relay response from location state or real-time
        const initialRelayResponse = location.state?.relayResponse;
        
        if (initialRelayResponse && initialRelayResponse.projectName) {
          // If Relay app returned project name, use it
          console.log('Using project name from initial relay response:', initialRelayResponse.projectName);
          const data = await TodoistService.getProjectByName(initialRelayResponse.projectName);
          setTodoistData(data);
        } else if (relayResponse && relayResponse.projectName) {
          // Use real-time relay response
          console.log('Using project name from real-time relay response:', relayResponse.projectName);
          const data = await TodoistService.getProjectByName(relayResponse.projectName);
          setTodoistData(data);
        } else {
          // Fallback: poll for new project
          console.log('No project name from relay response, polling for new project');
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for Relay app
          await pollForNewProject();
        }
      } catch (error) {
        console.error('Error fetching Todoist data:', error);
        setTodoistError(error.message || 'Failed to fetch Todoist data');
      } finally {
        setTodoistLoading(false);
      }
    };

    // Only fetch if we're not loading and have a query
    if (!isLoading && query) {
      fetchTodoistData();
    }
  }, [location.state?.relayResponse, relayResponse, isLoading, query]);

  const handleBackToHome = () => {
    navigate("/");
  };

    const cosmicScene = [
  { 
    animation: 'fireflies', 
    opacity: 0.8, 
    blendMode: 'normal',
    speed: 0.3 
  },
  { 
    animation: 'cosmicDust', 
    opacity: 0.8, 
    blendMode: 'screen',
    speed: 0.8 
  },
  { 
    animation: 'auroraBorealis', 
    opacity: 0.28, 
    blendMode: 'lighten',
    speed: 1.2
  }
];

  return (
    <div className="min-h-screen ">
      <LayeredBackground layers={cosmicScene}/>
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-black transform rotate-45"></div>
            <div className="w-2 h-2 bg-black transform rotate-45"></div>
          </div>
          <span className="font-semibold text-lg">LearnPathAgent.ai</span>
        </div>

        <button
          onClick={handleBackToHome}
          className="px-4 py-2 bg-transparent hover:bg-gray-50/40 rounded-lg shadow-sm border hover:shadow-md transition-shadow flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-yellow-200 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>AI Agent Processing</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Your AI Learning Plan Scheduler
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We're analyzing your request and generating personalized insights for you.
          </p>
          
          {/* Original Query Display */}
          <div className="mt-6 bg-white rounded-lg shadow-sm border p-4 max-w-2xl mx-auto">
            <div className="flex items-center space-x-2 mb-2">
              <Search className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Your Query:</span>
            </div>
            <p className="text-gray-900 font-medium">{query}</p>
          </div>

          {/* Session Status */}
          {sessionId && (
            <div className="mt-4 bg-blue-50 rounded-lg border p-3 max-w-2xl mx-auto">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-blue-700">
                  {relayResponse ? 'Connected to AI Agent' : 'Waiting for AI Agent response...'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow-lg border p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
              <h2 className="text-xl font-semibold text-gray-900">
                Processing your request...
              </h2>
              <p className="text-gray-600 max-w-md">
                Our AI agent is working on your query. This usually takes a few seconds.
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {!isLoading && result && (
          <div className="space-y-6">
            {/* Main Result */}
            <div className="bg-white rounded-lg shadow-lg border p-6">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Analysis Complete
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {result.message}
                  </p>
                </div>
              </div>
            </div>

            {/* Todoist Integration */}
            <div className="bg-gray-50/30 rounded-lg shadow-lg border p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Sparkles className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Your Todoist Project
                </h3>
              </div>
              
              <TodoistDisplay
                project={todoistData?.project}
                todos={todoistData?.todos}
                isLoading={todoistLoading}
                error={todoistError}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => {
                  const topics = (todoistData?.todos || [])
                    .map(t => t.content)
                    .filter(Boolean)
                    .slice(0, 12);
                  navigate("/quiz", { state: { topics } });
                }}
                className="bg-slate-800 text-white cursor-pointer hover:bg-transparent hover:text-slate-900 border  px-6 py-3 rounded-lg font-medium  transition-colors"
              >
                Test Your Knowledge
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="bg-white rounded-lg shadow-lg border p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="w-12 h-12 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900">
                Something went wrong
              </h2>
              <p className="text-gray-600 max-w-md">
                {error}
              </p>
              <button 
                onClick={handleBackToHome}
                className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
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
  );
} 