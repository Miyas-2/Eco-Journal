'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Loader2,
  X,
  Plus,
  History,
  Maximize2
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  context_used?: any[];
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  lastMessage: string;
  messageCount: number;
}

export default function SimpleChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showConversations, setShowConversations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && conversations.length === 0) {
      loadConversations();
    }
  }, [isOpen]);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/chat/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setCurrentConversationId(conversationId);
        setShowConversations(false);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setIsLoading(true);

    const tempUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId: currentConversationId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (!currentConversationId) {
          setCurrentConversationId(data.conversationId);
        }

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          created_at: new Date().toISOString(),
          context_used: data.contextUsed ? ['context'] : []
        };

        setMessages(prev => [...prev, aiMessage]);
        loadConversations();
      } else {
        setMessages(prev => prev.slice(0, -1));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setShowConversations(false);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-[#2b9dee] hover:bg-[#2b9dee]/90 text-white shadow-lg shadow-[#2b9dee]/30 border-0 transition-all hover:scale-110"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </Button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div style={{ fontFamily: 'Lexend, sans-serif' }} className="fixed bottom-24 right-6 w-[420px] h-[650px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col z-40">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 rounded-t-2xl bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2b9dee]/20 rounded-xl flex items-center justify-center">
                  <Bot className="h-5 w-5 text-[#2b9dee]" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">Jurnalin AI</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Your wellness companion</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/protected/chat">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Open Focus Mode"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConversations(!showConversations)}
                  className="h-9 w-9 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <History className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startNewConversation}
                  className="h-9 w-9 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Conversations List */}
          {showConversations ? (
            <div className="flex-1 overflow-y-auto p-4">
              <h4 className="font-semibold text-slate-800 dark:text-white mb-3 text-sm">Previous Conversations</h4>
              {conversations.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-12">
                  No conversations yet
                </p>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => loadMessages(conv.id)}
                      className="w-full text-left p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700 transition-colors"
                    >
                      <p className="font-medium text-sm text-slate-800 dark:text-white truncate">
                        {conv.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                        {conv.lastMessage}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatDate(conv.created_at)} • {conv.messageCount} messages
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#f8fafc] dark:bg-[#0f1419]">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-[#2b9dee]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Bot className="h-8 w-8 text-[#2b9dee]" />
                    </div>
                    <h4 className="font-semibold text-slate-800 dark:text-white mb-2">
                      Hello! I'm your AI Guide
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed px-4">
                      I can help with insights from your wellness journey. Ask me anything about your mood patterns!
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 bg-[#2b9dee]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-[#2b9dee]" />
                          </div>
                        )}
                        
                        <div className={`max-w-[75%] ${
                          message.role === 'user' 
                            ? 'bg-[#2b9dee] text-white' 
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700'
                        } rounded-2xl px-4 py-3 shadow-sm`}>
                          <p className="text-sm leading-relaxed whitespace-pre-line">
                            {message.content}
                          </p>
                          {message.context_used && message.context_used.length > 0 && (
                            <p className="text-xs mt-2 opacity-70">
                              💡 Based on your journals
                            </p>
                          )}
                          <p className={`text-xs mt-2 ${
                            message.role === 'user' ? 'text-blue-100' : 'text-slate-400'
                          }`}>
                            {formatTime(message.created_at)}
                          </p>
                        </div>

                        {message.role === 'user' && (
                          <div className="w-8 h-8 bg-slate-300 dark:bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 bg-[#2b9dee]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-[#2b9dee]" />
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-2xl px-4 py-3 border border-slate-100 dark:border-slate-700 shadow-sm">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-[#2b9dee]" />
                            <span className="text-sm text-slate-500 dark:text-slate-400">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about your wellness..."
                    className="flex-1 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-[#2b9dee] focus:border-[#2b9dee]"
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={isLoading}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    className="rounded-xl bg-[#2b9dee] hover:bg-[#2b9dee]/90 text-white px-4 shadow-sm shadow-[#2b9dee]/30"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}