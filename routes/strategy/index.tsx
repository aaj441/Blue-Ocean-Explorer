import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/authStore";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppNav } from "~/components/AppNav";
import { HelpTooltip } from "~/components/HelpTooltip";
import {
  Plus,
  MessageSquare,
  Send,
  Trash2,
  Sparkles,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Dialog } from "@headlessui/react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/strategy/")({
  component: StrategyPage,
});

interface Message {
  role: "user" | "assistant";
  content: string;
}

function StrategyPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { token, isAuthenticated } = useAuthStore();
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/auth/login" });
    }
  }, [isAuthenticated, navigate]);

  const sessionsQuery = useQuery(
    trpc.getStrategySessions.queryOptions({
      token: token || "",
    }),
  );

  const createSessionMutation = useMutation(
    trpc.createStrategySession.mutationOptions({
      onSuccess: (newSession) => {
        toast.success("New strategy session created!");
        setIsCreating(false);
        setSelectedSessionId(newSession.id);
        sessionsQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create session");
      },
    }),
  );

  const deleteSessionMutation = useMutation(
    trpc.deleteStrategySession.mutationOptions({
      onSuccess: () => {
        toast.success("Session deleted");
        setSelectedSessionId(null);
        sessionsQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete session");
      },
    }),
  );

  const sessions = sessionsQuery.data || [];
  const selectedSession = sessions.find((s) => s.id === selectedSessionId);
  const messages: Message[] = selectedSession ? JSON.parse(selectedSession.messages) : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const handleCreateSession = () => {
    createSessionMutation.mutate({
      token: token || "",
      title: `Strategy Session ${sessions.length + 1}`,
    });
  };

  const handleDeleteSession = (sessionId: number) => {
    if (confirm("Delete this strategy session?")) {
      deleteSessionMutation.mutate({
        token: token || "",
        sessionId,
      });
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedSessionId || isStreaming) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setIsStreaming(true);
    setStreamingMessage("");

    try {
      // Use the streaming query
      const query = trpc.strategyChatStream.query({
        token: token || "",
        sessionId: selectedSessionId,
        message: userMessage,
      });

      // Handle streaming response
      for await (const chunk of query) {
        if (chunk.done) {
          // Stream complete, refetch session to get updated messages
          await sessionsQuery.refetch();
          setStreamingMessage("");
          setIsStreaming(false);
        } else {
          // Accumulate streaming text
          setStreamingMessage((prev) => prev + chunk.chunk);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
      setIsStreaming(false);
      setStreamingMessage("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav currentPage="strategy" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
          {/* Sessions Sidebar */}
          <div className="md:col-span-1 bg-white rounded-xl border border-gray-200 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Sessions</h2>
              <button
                onClick={handleCreateSession}
                disabled={createSessionMutation.isPending}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="New session"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {sessionsQuery.isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No sessions yet</p>
                <button
                  onClick={handleCreateSession}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Start your first session
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSessionId(session.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                      selectedSessionId === session.id
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-gray-50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {session.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(session.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Area */}
          <div className="md:col-span-3 bg-white rounded-xl border border-gray-200 flex flex-col">
            {!selectedSessionId ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full p-6 w-fit mx-auto mb-4">
                    <Sparkles className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2 justify-center">
                    AI Strategy Assistant
                    <HelpTooltip
                      title="How to Use"
                      content="Ask strategic questions about your opportunities, get validation on ideas, or explore Blue Ocean strategies. The AI knows your preferences and can provide personalized guidance on market creation, risk assessment, and next steps."
                    />
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md">
                    Get personalized guidance on your opportunities. Ask questions,
                    explore ideas, and validate your strategy.
                  </p>
                  <button
                    onClick={handleCreateSession}
                    disabled={createSessionMutation.isPending}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Start New Session
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 && !streamingMessage ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">
                        Start the conversation by asking a question about your opportunities.
                      </p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message, idx) => (
                        <div
                          key={idx}
                          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-3 ${
                              message.role === "user"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      ))}
                      {streamingMessage && (
                        <div className="flex justify-start">
                          <div className="max-w-[80%] rounded-lg px-4 py-3 bg-gray-100 text-gray-900">
                            <p className="text-sm whitespace-pre-wrap">{streamingMessage}</p>
                            <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1"></span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-gray-200 p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Ask about opportunities, strategy, or validation..."
                      disabled={isStreaming}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isStreaming}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
