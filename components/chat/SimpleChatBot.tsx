'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Loader2,
  X,
  Plus,
  History
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

    // Add user message to UI immediately
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
        
        // Update conversation ID if it's a new conversation
        if (!currentConversationId) {
          setCurrentConversationId(data.conversationId);
        }

        // Add AI response
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          created_at: new Date().toISOString(),
          context_used: data.contextUsed ? ['context'] : []
        };

        setMessages(prev => [...prev, aiMessage]);
        
        // Reload conversations to update the list
        loadConversations();
      } else {
        console.error('Failed to send message');
        // Remove the temporary user message on error
        setMessages(prev => prev.slice(0, -1));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the temporary user message on error
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
          className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg border-0"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </Button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-40">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-200 rounded-t-2xl bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-800">AI Personal Guide</h3>
                  <p className="text-xs text-slate-500">Wellness companion</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConversations(!showConversations)}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <History className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startNewConversation}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Conversations List */}
          {showConversations ? (
            <div className="flex-1 overflow-y-auto p-4">
              <h4 className="font-medium text-slate-800 mb-3">Percakapan Sebelumnya</h4>
              {conversations.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">
                  Belum ada percakapan
                </p>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => loadMessages(conv.id)}
                      className="w-full text-left p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors"
                    >
                      <p className="font-medium text-sm text-slate-800 truncate">
                        {conv.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-1">
                        {conv.lastMessage}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatDate(conv.created_at)} • {conv.messageCount} pesan
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bot className="h-8 w-8 text-blue-500" />
                    </div>
                    <h4 className="font-medium text-slate-800 mb-2">
                      Halo! Saya AI Personal Guide Anda
                    </h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Saya siap membantu dengan insight dari perjalanan wellness Anda. 
                      Tanyakan apa saja tentang pola mood, emosi, atau minta saran!
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
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                        )}
                        
                        <div className={`max-w-[80%] ${
                          message.role === 'user' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-slate-100 text-slate-800'
                        } rounded-2xl px-4 py-3`}>
                          <p className="text-sm leading-relaxed whitespace-pre-line">
                            {message.content}
                          </p>
                          {message.context_used && message.context_used.length > 0 && (
                            <p className="text-xs mt-2 opacity-70">
                              💡 Berdasarkan jurnal Anda
                            </p>
                          )}
                          <p className={`text-xs mt-2 ${
                            message.role === 'user' ? 'text-blue-100' : 'text-slate-500'
                          }`}>
                            {formatTime(message.created_at)}
                          </p>
                        </div>

                        {message.role === 'user' && (
                          <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-slate-600" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-slate-100 rounded-2xl px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                            <span className="text-sm text-slate-500">Sedang berpikir...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-slate-200">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Tanyakan tentang wellness journey Anda..."
                    className="flex-1 rounded-xl border-slate-200"
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={isLoading}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    className="rounded-xl bg-blue-500 hover:bg-blue-600 text-white px-4"
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