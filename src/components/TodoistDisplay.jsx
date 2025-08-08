import React, { useState } from "react";
import { CheckCircle, Circle, Clock, Calendar, FolderOpen, ListTodo, ExternalLink } from "lucide-react";
import TodoistService from "../services/todoistService";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL_ENV = import.meta.env.VITE_GEMINI_MODEL || "gemini-1.5-flash"; // set in .env to any available model
const GEMINI_API_VERSION = import.meta.env.VITE_GEMINI_API_VERSION || "v1beta";

function buildGeminiUrl(model) {
  return `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
}

// Utility to fetch learning resources from Gemini with model fallback
async function fetchLearningResources(topic) {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key is missing. Please set VITE_GEMINI_API_KEY in your .env file.");
  }
  const prompt = `Give me 3 reputable learning resources (with direct links) to learn about the topic: "${topic}". Prefer official documentation, top YouTube videos, or well-known educational sites. Format as a markdown list of clickable links with a short description for each.`;
  const body = { contents: [{ parts: [{ text: prompt }] }] };

  const tryModelsInOrder = [GEMINI_MODEL_ENV, "gemini-1.5-flash", "gemini-1.5-pro"]
    // remove duplicates while preserving order
    .filter((m, idx, arr) => arr.indexOf(m) === idx);

  let lastError;
  for (const model of tryModelsInOrder) {
    const url = buildGeminiUrl(model);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    let data = {};
    try {
      data = await response.json();
    } catch {}

    if (response.ok) {
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (text) return text;
      lastError = new Error("Gemini returned empty content");
      break;
    }

    const message = data?.error?.message || "Unexpected error";
    // Store last error
    lastError = new Error(`Failed with model '${model}' (${response.status}): ${message}`);
    // For 404 / unsupported method, continue to next model; otherwise, stop
    if (!(response.status === 404 || /not found|not supported/i.test(message))) {
      break;
    }
  }

  console.error("Gemini API error:", lastError?.message);
  throw new Error(
    `${lastError?.message}. Try setting VITE_GEMINI_MODEL to a supported model (e.g., gemini-1.5-flash) or adjust VITE_GEMINI_API_VERSION.`
  );
}

export default function TodoistDisplay({ project, todos, isLoading, error }) {
  const [localTodos, setLocalTodos] = useState(todos || []);
  const [updatingTodos, setUpdatingTodos] = useState(new Set());
  const [resourcesCache, setResourcesCache] = useState({}); // { [todoId]: markdown }
  const [loadingResources, setLoadingResources] = useState({}); // { [todoId]: true/false }
  const [resourcesError, setResourcesError] = useState({}); // { [todoId]: errorMsg }

  React.useEffect(() => {
    setLocalTodos(todos || []);
  }, [todos]);

  const handleTodoToggle = async (todoId, currentCompleted) => {
    try {
      setUpdatingTodos(prev => new Set(prev).add(todoId));
      setLocalTodos(prev => prev.map(todo => todo.id === todoId ? { ...todo, completed: !currentCompleted } : todo));
      await TodoistService.updateTodoCompletion(todoId, !currentCompleted);
    } catch (error) {
      setLocalTodos(prev => prev.map(todo => todo.id === todoId ? { ...todo, completed: currentCompleted } : todo));
      alert(`Failed to update todo: ${error.message}`);
    } finally {
      setUpdatingTodos(prev => { const newSet = new Set(prev); newSet.delete(todoId); return newSet; });
    }
  };

  // Fetch resources for a topic (todo)
  const handleFetchResources = async (todo) => {
    if (resourcesCache[todo.id] || loadingResources[todo.id]) return;
    setLoadingResources(prev => ({ ...prev, [todo.id]: true }));
    setResourcesError(prev => ({ ...prev, [todo.id]: undefined }));
    try {
      const markdown = await fetchLearningResources(todo.content);
      setResourcesCache(prev => ({ ...prev, [todo.id]: markdown }));
    } catch (err) {
      setResourcesError(prev => ({ ...prev, [todo.id]: err.message }));
    } finally {
      setLoadingResources(prev => ({ ...prev, [todo.id]: false }));
    }
  };

  // Parse markdown links (simple)
  function parseMarkdownLinks(md) {
    const regex = /\[(.*?)\]\((.*?)\)/g;
    const items = [];
    let match;
    while ((match = regex.exec(md)) !== null) {
      items.push({ desc: match[1], url: match[2] });
    }
    return items;
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg border p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg border p-6">
        <div className="flex items-center space-x-3 text-red-600 mb-4">
          <Circle className="w-6 h-6" />
          <h3 className="text-lg font-semibold">Error Loading Todoist Data</h3>
        </div>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (!project || !localTodos) {
    return (
      <div className="bg-white rounded-lg shadow-lg border p-6">
        <div className="flex items-center space-x-3 text-gray-500 mb-4">
          <FolderOpen className="w-6 h-6" />
          <h3 className="text-lg font-semibold">No Project Found</h3>
        </div>
        <p className="text-gray-600">
          No Todoist project was found. The AI agent may still be processing your request.
        </p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 4: return 'text-red-500';
      case 3: return 'text-orange-500';
      case 2: return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 4: return 'High';
      case 3: return 'Medium';
      case 2: return 'Low';
      default: return 'None';
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-white rounded-lg shadow-lg border p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <FolderOpen className="w-6 h-6 text-blue-500" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {project.name}
              </h3>
              <p className="text-sm text-gray-500">
                Created {formatDate(project.created_at)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {localTodos.length}
            </div>
            <div className="text-sm text-gray-500">Tasks</div>
          </div>
        </div>
        {project.description && (
          <p className="text-gray-600 mb-4">{project.description}</p>
        )}
      </div>

      {/* Todos List */}
      <div className="bg-white rounded-lg shadow-lg border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <ListTodo className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
        </div>

        {localTodos.length === 0 ? (
          <div className="text-center py-8">
            <Circle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No tasks found in this project</p>
          </div>
        ) : (
          <div className="space-y-3">
            {localTodos.map((todo) => {
              const isUpdating = updatingTodos.has(todo.id);
              return (
                <div
                  key={todo.id}
                  className={`flex flex-col space-y-2 p-3 rounded-lg border ${
                    todo.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  } ${isUpdating ? 'opacity-75' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <button
                        onClick={() => handleTodoToggle(todo.id, todo.completed)}
                        disabled={isUpdating}
                        className={`transition-all duration-200 hover:scale-110 ${
                          isUpdating ? 'cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        {todo.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`font-medium ${
                            todo.completed ? 'text-green-700 line-through' : 'text-gray-900'
                          }`}>
                            {todo.content}
                            {isUpdating && (
                              <span className="ml-2 text-xs text-gray-500">(updating...)</span>
                            )}
                          </p>
                          {todo.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {todo.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {todo.priority > 1 && (
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                              getPriorityColor(todo.priority)
                            } bg-opacity-10`}>
                              {getPriorityText(todo.priority)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        {todo.due && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(todo.due.date)}</span>
                          </div>
                        )}
                        {todo.created_at && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Created {formatDate(todo.created_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Learning Resources Section */}
                  <div className="mt-2 ml-8">
                    <button
                      className="text-xs text-blue-600 underline hover:text-blue-800"
                      onClick={() => handleFetchResources(todo)}
                      disabled={loadingResources[todo.id]}
                    >
                      {resourcesCache[todo.id]
                        ? "Show Learning Resources"
                        : loadingResources[todo.id]
                        ? "Loading..."
                        : "Get Learning Resources"}
                    </button>
                    {/* Show resources if loaded */}
                    {resourcesError[todo.id] && (
                      <div className="text-xs text-red-500 mt-1">{resourcesError[todo.id]}</div>
                    )}
                    {resourcesCache[todo.id] && (
                      <ul className="mt-2 space-y-1">
                        {parseMarkdownLinks(resourcesCache[todo.id]).map((item, idx) => (
                          <li key={idx} className="flex items-center space-x-1">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-700 hover:underline flex items-center"
                            >
                              {item.desc}
                              <ExternalLink className="w-3 h-3 ml-1 inline-block" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-lg border p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {localTodos.filter(todo => todo.completed).length}
          </div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="bg-white rounded-lg shadow-lg border p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {localTodos.filter(todo => !todo.completed).length}
          </div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
        <div className="bg-white rounded-lg shadow-lg border p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {localTodos.filter(todo => todo.priority >= 3).length}
          </div>
          <div className="text-sm text-gray-500">High Priority</div>
        </div>
      </div>
    </div>
  );
}
