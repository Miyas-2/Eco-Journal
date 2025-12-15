'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, 
  Send, 
  Bot, 
  User, 
  Loader2,
  Plus,
  Mic,
  PlusCircle,
  Wind,
  Cloud,
  RefreshCw,
  History,
  X
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

interface UserProfile {
  total_points: number;
  current_streak: number;
}

export default function FocusedChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showConversations, setShowConversations] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [totalJournals, setTotalJournals] = useState(0);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [moodAverage, setMoodAverage] = useState<number | null>(null);
  const [userName, setUserName] = useState('User');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadUserData();
    loadConversations();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Set user name from user_metadata (sama seperti home page)
      const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
      setUserName(displayName);

      // Load profile data (sama seperti home page)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('total_points, current_streak')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
      }

      // Load journal data
      const { data: journals } = await supabase
        .from('journal_entries')
        .select('id, mood_score, weather_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (journals) {
        setTotalJournals(journals.length);

        // Calculate mood average
        const journalsWithMood = journals.filter(j => j.mood_score !== null);
        if (journalsWithMood.length > 0) {
          const avgMood = journalsWithMood.reduce((sum, j) => sum + (j.mood_score || 0), 0) / journalsWithMood.length;
          setMoodAverage(avgMood);
        }

        // Get latest weather data
        if (journals.length > 0 && journals[0].weather_data) {
          setWeatherData(journals[0].weather_data);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getAQILabel = (index: number | undefined) => {
    if (!index) return "No Data";
    if (index === 1) return "Good";
    if (index === 2) return "Moderate";
    if (index === 3) return "Unhealthy for Sensitive";
    if (index === 4) return "Unhealthy";
    if (index === 5) return "Very Unhealthy";
    return "Hazardous";
  };

  const getMoodLabel = (score: number | null) => {
    if (score === null) return "No Data";
    if (score >= 0.5) return "Happy";
    if (score >= 0) return "Calm";
    if (score >= -0.5) return "Anxious";
    return "Sad";
  };

  const aqiValue = weatherData?.current?.air_quality?.["us-epa-index"];
  const temperature = weatherData?.current?.temp_c;
  const weatherCondition = weatherData?.current?.condition?.text;
  const location = weatherData?.location?.name || "Your Location";
  const aqiLabel = getAQILabel(aqiValue);

  return (
    <div style={{ fontFamily: 'Lexend, sans-serif' }} className="h-screen overflow-hidden flex bg-[#f8fafc] dark:bg-[#101a22]">
      
      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative h-full w-full">
        
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-6 border-b border-slate-200/50 dark:border-slate-800 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex flex-col gap-0.5">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white">{getGreeting()}, {userName}</h2>
              <p className="text-xs text-slate-400">Let's reflect on your day.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowConversations(!showConversations)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium transition-colors"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </button>
            <button 
              onClick={startNewConversation}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#2b9dee] hover:bg-[#2b9dee]/90 text-white text-sm font-medium transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </header>

        {/* Conversation History Sidebar */}
        {showConversations && (
          <div className="absolute top-20 left-0 w-80 h-[calc(100%-5rem)] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-20 shadow-xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Conversations</h3>
                <button 
                  onClick={() => setShowConversations(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              {conversations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <History className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">No conversations yet</p>
                  <p className="text-xs text-slate-400 mt-1">Start chatting to create your first conversation</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => loadMessages(conv.id)}
                      className={`w-full text-left p-4 rounded-xl transition-all border ${
                        currentConversationId === conv.id
                          ? 'bg-[#2b9dee]/10 border-[#2b9dee]/20 shadow-sm'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-100 dark:border-slate-700'
                      }`}
                    >
                      <p className="font-medium text-sm text-slate-800 dark:text-white truncate mb-1">
                        {conv.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-2">
                        {conv.lastMessage}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{formatDate(conv.created_at)}</span>
                        <span>•</span>
                        <span>{conv.messageCount} messages</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:p-8 space-y-8 scroll-smooth">
          
          {messages.length === 0 && (
            <>
              <div className="text-center py-2">
                <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-4 py-1.5 rounded-full uppercase tracking-wide">
                  Today, {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              <div className="flex items-end gap-3 max-w-3xl mr-auto group animate-[fadeIn_0.5s_ease-out]">
                <div className="size-9 rounded-full bg-[#2b9dee]/20 flex items-center justify-center shrink-0 text-[#2b9dee] ring-2 ring-white dark:ring-[#101a22]">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-1 items-start">
                  <span className="text-xs text-slate-400 ml-1 font-medium">Jurnalin AI</span>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-bl-none shadow-sm border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 leading-relaxed max-w-lg">
                    <p className="mb-2">Hello {userName}! I'm your AI wellness companion.</p>
                    <p>I can help you reflect on your emotions, analyze your mood patterns from your {totalJournals} journal {totalJournals === 1 ? 'entry' : 'entries'}, and provide insights based on your journaling history. How are you feeling today?</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-end gap-3 max-w-3xl ${
                message.role === 'user' ? 'ml-auto justify-end' : 'mr-auto'
              } group animate-[fadeIn_0.6s_ease-out]`}
            >
              {message.role === 'assistant' && (
                <>
                  <div className="size-9 rounded-full bg-[#2b9dee]/20 flex items-center justify-center shrink-0 text-[#2b9dee] ring-2 ring-white dark:ring-[#101a22]">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col gap-1 items-start">
                    <span className="text-xs text-slate-400 ml-1 font-medium">Jurnalin AI</span>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-bl-none shadow-sm border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 leading-relaxed max-w-lg">
                      <p className="whitespace-pre-line">{message.content}</p>
                      {message.context_used && message.context_used.length > 0 && (
                        <p className="text-xs text-slate-500 mt-2">💡 Based on your journal entries</p>
                      )}
                    </div>
                  </div>
                </>
              )}
              
              {message.role === 'user' && (
                <>
                  <div className="flex flex-col gap-1 items-end">
                    <span className="text-xs text-slate-400 mr-1 font-medium">You</span>
                    <div className="bg-[#2b9dee]/10 dark:bg-[#2b9dee]/20 p-4 rounded-2xl rounded-br-none text-slate-800 dark:text-white leading-relaxed max-w-lg text-right">
                      <p className="whitespace-pre-line">{message.content}</p>
                    </div>
                  </div>
                  <div className="size-9 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center shrink-0 ring-2 ring-white dark:ring-[#101a22]">
                    <User className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  </div>
                </>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-end gap-3 max-w-3xl mr-auto group">
              <div className="size-9 rounded-full bg-[#2b9dee]/20 flex items-center justify-center shrink-0 text-[#2b9dee] ring-2 ring-white dark:ring-[#101a22]">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-1 items-start">
                <span className="text-xs text-slate-400 ml-1 font-medium">Jurnalin AI</span>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-bl-none shadow-sm border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#2b9dee]" />
                    <span className="text-sm text-slate-500">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] to-transparent dark:from-[#101a22] dark:via-[#101a22] dark:to-transparent z-10">
          <div className="max-w-4xl mx-auto relative flex items-center gap-2 bg-white dark:bg-slate-800 p-2 pl-3 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-none border border-slate-100 dark:border-slate-700/50">
            <button className="size-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
              <PlusCircle className="h-5 w-5" />
            </button>
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-slate-700 dark:text-white placeholder-slate-400 px-2 py-3" 
              placeholder="Type a message to reflect..." 
              type="text"
              disabled={isLoading}
            />
            <button className="size-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
              <Mic className="h-5 w-5" />
            </button>
            <button 
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="size-10 flex items-center justify-center rounded-full bg-[#2b9dee] hover:bg-[#2b9dee]/90 text-white shadow-md shadow-[#2b9dee]/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <p className="text-center text-xs text-slate-400 mt-3 font-light">Jurnalin can make mistakes. Please verify important information.</p>
        </div>
      </main>

      {/* Right Context Panel (Desktop) */}
      <aside className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 hidden lg:flex flex-col h-full shrink-0 overflow-y-auto">
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Environment</h3>
            <button 
              onClick={loadUserData}
              className="text-slate-400 hover:text-[#2b9dee] transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex flex-col gap-5">
            {/* Weather Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden group transition-transform hover:-translate-y-1 duration-300 border border-slate-100 dark:border-slate-700">
              <div className="absolute -right-6 -top-6 opacity-10 dark:opacity-5 text-slate-900 dark:text-white transition-opacity group-hover:opacity-15">
                <Cloud className="h-32 w-32" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Weather</span>
                  <Cloud className="h-5 w-5 text-blue-400" />
                </div>
                <div className="text-3xl font-light text-slate-800 dark:text-white mb-1">
                  {temperature ? `${temperature}°C` : '--°C'}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                  {weatherCondition || 'No Data'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">{location}</div>
              </div>
            </div>

            {/* Air Quality Card */}
            <div className={`bg-gradient-to-br p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden group transition-transform hover:-translate-y-1 duration-300 border ${
              aqiValue && aqiValue <= 2 
                ? 'from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800 border-green-100 dark:border-slate-700'
                : aqiValue && aqiValue === 3
                ? 'from-yellow-50 to-amber-50 dark:from-slate-800 dark:to-slate-800 border-yellow-100 dark:border-slate-700'
                : 'from-red-50 to-orange-50 dark:from-slate-800 dark:to-slate-800 border-red-100 dark:border-slate-700'
            }`}>
              <div className="absolute -right-6 -top-6 opacity-10 dark:opacity-5 text-slate-900 dark:text-white transition-opacity group-hover:opacity-15">
                <Wind className="h-32 w-32" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Air Quality</span>
                  <Wind className={`h-5 w-5 ${
                    aqiValue && aqiValue <= 2 ? 'text-green-400' : aqiValue && aqiValue === 3 ? 'text-yellow-400' : 'text-red-400'
                  }`} />
                </div>
                <div className="text-3xl font-light text-slate-800 dark:text-white mb-1">{aqiLabel}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                  {aqiValue ? `AQI: ${aqiValue}` : 'No Data'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {aqiValue && aqiValue <= 2 ? 'Perfect for outdoor activities' : 
                   aqiValue && aqiValue === 3 ? 'Consider indoor activities' :
                   aqiValue ? 'Stay indoors if possible' : 'Start journaling to track air quality'}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Your Journey</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Total Entries</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-white">{totalJournals}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Current Streak</span>
                  <span className="text-sm font-bold text-orange-500">
                    {userProfile?.current_streak || 0} days
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Mood Average</span>
                  <span className="text-sm font-bold text-[#2b9dee]">
                    {getMoodLabel(moodAverage)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Total Points</span>
                  <span className="text-sm font-bold text-[#2b9dee]">
                    {userProfile?.total_points || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}