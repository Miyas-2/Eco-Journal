import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: conversations, error } = await supabase
      .from("chat_conversations")
      .select(`
        id,
        title,
        created_at,
        updated_at,
        chat_messages!inner(content, role, created_at)
      `)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
    }

    // Format conversations with last message preview
    const formattedConversations = conversations?.map(conv => ({
      id: conv.id,
      title: conv.title,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      lastMessage: conv.chat_messages[conv.chat_messages.length - 1]?.content || "",
      messageCount: conv.chat_messages.length
    })) || [];

    return NextResponse.json({ conversations: formattedConversations });

  } catch (error) {
    console.error("Error in conversations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}