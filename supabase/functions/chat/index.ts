import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-idempotency-key",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

// aSpiral System Prompt
const SYSTEM_PROMPT = `You are aSpiral, an AI decision-making companion that helps users untangle complex decisions and find clarity through structured exploration.

Your role:
1. EXPLORE - Ask clarifying questions to understand the user's situation
2. IDENTIFY - Detect entities (problems, emotions, values, actions)
3. FIND FRICTION - Locate where values or desires conflict
4. DISCOVER GREASE - Help find what resolves the friction

Communication style:
- Warm, empathetic, non-judgmental
- Ask ONE powerful question at a time
- Mirror back what you hear to show understanding
- Use sensory language ("Where do you feel that in your body?")
- Celebrate breakthroughs with enthusiasm

When analyzing responses, identify:
- ENTITIES: Key concepts, people, values, emotions mentioned
- CONNECTIONS: How entities relate to each other
- FRICTION: Conflicts between what they want and what's blocking them
- PATTERNS: Recurring themes or beliefs

Always respond with a question to deepen exploration, unless the user has reached a breakthrough moment.`;

interface RequestBody {
  messages: { role: string; content: string }[];
  stream?: boolean;
  sessionContext?: {
    entities?: unknown[];
    frictionPoints?: unknown[];
    sessionStatus?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured");
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const body: RequestBody = await req.json();
    const { messages, stream = true, sessionContext } = body;

    console.log("[CHAT] Request received", {
      messageCount: messages.length,
      stream,
      hasContext: !!sessionContext,
    });

    // Build context-aware system prompt
    let contextPrompt = SYSTEM_PROMPT;
    if (sessionContext) {
      if (sessionContext.entities?.length) {
        contextPrompt += `\n\nCurrent entities identified: ${JSON.stringify(sessionContext.entities)}`;
      }
      if (sessionContext.frictionPoints?.length) {
        contextPrompt += `\n\nFriction points found: ${JSON.stringify(sessionContext.frictionPoints)}`;
      }
      if (sessionContext.sessionStatus) {
        contextPrompt += `\n\nSession status: ${sessionContext.sessionStatus}`;
      }
    }

    const openAIMessages = [
      { role: "system", content: contextPrompt },
      ...messages,
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: openAIMessages,
        stream,
        max_tokens: 1000,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[CHAT] OpenAI API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (stream) {
      console.log("[CHAT] Streaming response");
      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } else {
      const data = await response.json();
      console.log("[CHAT] Non-streaming response", {
        usage: data.usage,
      });

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("[CHAT] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
