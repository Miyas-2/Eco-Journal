// filepath: d:\Semester 4\Pemweb\eco-journal\lib\conversation-context.ts
import { createClient } from "@/lib/supabase/server";

export interface ConversationContext {
  recentMessages: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
  userPatterns: {
    frequentTopics: string[];
    preferredStyle: string;
  };
}

export async function getConversationContext(
  conversationId: string | null, 
  userId: string
): Promise<ConversationContext> {
  const supabase = await createClient();
  
  let recentMessages: any[] = [];
  
  if (conversationId) {
    // Get last 6 messages for context (3 exchanges)
    const { data: messages } = await supabase
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(6);
    
    recentMessages = (messages || [])
      .reverse()
      .map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.created_at
      }));
  }

  // Analyze user patterns from recent conversations
  const { data: userMessages } = await supabase
    .from("chat_messages")
    .select("content")
    .eq("user_id", userId)
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .limit(20);

  const frequentTopics = analyzeFrequentTopics(userMessages || []);

  return {
    recentMessages,
    userPatterns: {
      frequentTopics,
      preferredStyle: "supportive" // Can be enhanced based on analysis
    }
  };
}

function analyzeFrequentTopics(messages: any[]): string[] {
  const keywords = ['mood', 'anxiety', 'sleep', 'weather', 'air quality', 'stress', 'exercise', 'work'];
  const topicCounts: { [key: string]: number } = {};
  
  messages.forEach(msg => {
    const content = msg.content.toLowerCase();
    keywords.forEach(keyword => {
      if (content.includes(keyword)) {
        topicCounts[keyword] = (topicCounts[keyword] || 0) + 1;
      }
    });
  });

  return Object.entries(topicCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([topic]) => topic);
}