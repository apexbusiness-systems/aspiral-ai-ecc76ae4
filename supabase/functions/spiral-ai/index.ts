import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// =============================================================================
// PHASE 3: AI GUARDRAILS - Enterprise-Grade Validation & Security
// =============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// =============================================================================
// ZOD SCHEMAS - Strict Output Validation
// =============================================================================

const EntitySchema = z.object({
  type: z.enum(["problem", "emotion", "value", "action", "friction", "grease"]),
  label: z.string().max(50, "Label must be under 50 characters"),
  role: z.enum([
    "external_irritant",
    "internal_conflict",
    "desire",
    "fear",
    "constraint",
    "solution"
  ]).optional(),
  emotionalValence: z.number().min(-1).max(1).optional(),
  importance: z.number().min(0).max(1).optional(),
});

const ConnectionSchema = z.object({
  from: z.number().int().min(0),
  to: z.number().int().min(0),
  type: z.enum(["causes", "blocks", "enables", "resolves", "opposes"]),
  strength: z.number().min(0).max(1),
});

// Main response schema - HARD LIMITS enforced
const ResponseSchema = z.object({
  entities: z.array(EntitySchema).max(5, "Maximum 5 entities allowed"),
  connections: z.array(ConnectionSchema).max(10, "Maximum 10 connections allowed"),
  question: z.string().max(100, "Question must be under 100 characters"),
  response: z.string().max(50, "Response must be under 50 characters"),
  friction: z.string().max(100).optional(),
  grease: z.string().max(100).optional(),
  insight: z.string().max(150).optional(),
});

type ValidatedResponse = z.infer<typeof ResponseSchema>;

// =============================================================================
// PII REDACTION - Security Layer
// =============================================================================

const PII_PATTERNS = {
  // Email addresses
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  // Phone numbers (various formats)
  phone: /(\+?1?[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g,
  // SSN
  ssn: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
  // Credit card numbers
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  // IP addresses
  ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
};

function redactPII(text: string): { redacted: string; piiFound: string[] } {
  const piiFound: string[] = [];
  let redacted = text;

  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    const matches = text.match(pattern);
    if (matches) {
      piiFound.push(`${type}: ${matches.length} instance(s)`);
      redacted = redacted.replace(pattern, `[REDACTED_${type.toUpperCase()}]`);
    }
  }

  return { redacted, piiFound };
}

// =============================================================================
// VALIDATION WITH RETRY - AI Integrity Loop
// =============================================================================

const MAX_VALIDATION_RETRIES = 2;

async function callAIWithValidation(
  systemPrompt: string,
  userContent: string,
  shouldBreakthrough: boolean
): Promise<{ data: ValidatedResponse; retryCount: number }> {
  let lastError: z.ZodError | null = null;
  let retryCount = 0;

  for (let attempt = 0; attempt <= MAX_VALIDATION_RETRIES; attempt++) {
    let prompt = systemPrompt;
    
    // On retry, add validation feedback
    if (attempt > 0 && lastError) {
      const errorMessages = lastError.errors
        .map(e => `- ${e.path.join('.')}: ${e.message}`)
        .join('\n');
      
      prompt += `\n\n⚠️ VALIDATION FAILED ON PREVIOUS ATTEMPT:\n${errorMessages}\n\nPlease fix these issues and respond with valid JSON.`;
      console.log(`[SPIRAL-AI] 🔄 Retry ${attempt}/${MAX_VALIDATION_RETRIES} with validation feedback`);
    }

    const response = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response
    let parsed: unknown;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch {
      lastError = new z.ZodError([{
        code: "custom",
        path: ["root"],
        message: "Invalid JSON response from AI",
      }]);
      retryCount = attempt + 1;
      continue;
    }

    // Validate with Zod
    const result = ResponseSchema.safeParse(parsed);
    
    if (result.success) {
      console.log(`[SPIRAL-AI] ✅ Validation passed on attempt ${attempt + 1}`);
      return { data: result.data, retryCount: attempt };
    }

    lastError = result.error;
    retryCount = attempt + 1;
    console.warn(`[SPIRAL-AI] ⚠️ Validation failed:`, result.error.errors.slice(0, 3));
  }

  // All retries failed - return safe fallback
  console.error(`[SPIRAL-AI] ❌ Validation failed after ${MAX_VALIDATION_RETRIES + 1} attempts`);
  
  return {
    data: {
      entities: [],
      connections: [],
      question: shouldBreakthrough ? "" : "What's on your mind?",
      response: "I hear you.",
      friction: undefined,
      grease: undefined,
      insight: undefined,
    },
    retryCount,
  };
}

// =============================================================================
// PROMPTS & PATTERNS
// =============================================================================

const FRUSTRATION_PATTERNS = [
  /annoying/i, /stop/i, /enough/i, /just tell me/i, /wtf/i, /ffs/i,
  /come on/i, /seriously/i, /waste.*time/i, /dragging/i, /taking forever/i,
  /get to the point/i, /skip/i, /cut to/i, /what's the answer/i,
];

const HARD_ENTITY_CAP = 5;
const MAX_QUESTIONS = 3;

const QUESTION_PATTERNS = `
QUESTION STRUCTURE (rotate these):
- Direct: "So {paraphrase}. What's grinding?"
- Excavation: "Underneath that, what else?"
- Contrast: "When you're NOT feeling {negative}, what's different?"
- Challenge: "Is it really {surface}, or something deeper?"
- Stakes: "What happens if you do nothing?"
- Binary: "Simple: stay or go?"

ABSOLUTELY FORBIDDEN:
❌ "I hear your..." / "It sounds like..."
❌ "I'm here to help..." / "Let's explore..."
❌ "Can you tell me more..."
❌ "How does that make you feel?"
❌ Starting consecutive questions with "What"

Be DIRECT. Under 15 words. Reference their EXACT words.`;

const ENTITY_EXTRACTION_PROMPT = `You are ASPIRAL's discovery engine. Extract entities and ask ONE direct question.

${QUESTION_PATTERNS}

ENTITY RULES:
1. Extract MAX 5 entities (HARD LIMIT - violating this breaks the product)
2. Combine similar concepts
3. Only extract what MATTERS to the friction

ENTITY TYPES: problem, emotion, value, friction, grease, action
ENTITY ROLES: external_irritant, internal_conflict, desire, fear, constraint, solution

CONNECTION TYPES: causes, blocks, enables, resolves, opposes

OUTPUT JSON (STRICT SCHEMA):
{
  "entities": [
    {"type": "problem", "label": "3-word max", "role": "external_irritant", "emotionalValence": -0.8, "importance": 0.9}
  ],
  "connections": [{"from": 0, "to": 1, "type": "causes", "strength": 0.8}],
  "question": "Under 15 words. Direct. No fluff.",
  "response": "Max 8 words. Acknowledge briefly."
}

VALIDATION RULES:
- entities: array, max 5 items
- label: string, max 50 chars
- question: string, max 100 chars  
- response: string, max 50 chars
- emotionalValence: number -1 to 1
- importance: number 0 to 1
- connection strength: number 0 to 1

NEVER exceed limits. Schema validation is enforced.`;

const BREAKTHROUGH_PROMPT = `Synthesize the breakthrough from this conversation.

OUTPUT JSON (STRICT SCHEMA):
{
  "friction": "The gears grinding (concise, <15 words)",
  "grease": "The solution (actionable, <15 words)", 
  "insight": "The memorable one-liner (<25 words)",
  "entities": [],
  "connections": [],
  "question": "",
  "response": ""
}

VALIDATION RULES:
- friction: string, max 100 chars
- grease: string, max 100 chars
- insight: string, max 150 chars
- question: empty string for breakthrough
- response: empty string for breakthrough

RULES:
1. Be SPECIFIC to their situation
2. Reference their actual words
3. Make insight memorable and quotable
4. Grease must be ACTIONABLE

EXAMPLES:
Traffic frustration → "You can't change the drivers. You can change how much space they take in your head."
Job decision → "You don't need to leap. You need to take the first step."

Be SPECIFIC. Be ACTIONABLE. Be MEMORABLE.`;

// =============================================================================
// REQUEST/RESPONSE TYPES
// =============================================================================

interface RequestBody {
  transcript: string;
  userTier?: string;
  ultraFast?: boolean;
  sessionContext?: {
    entities?: Array<{ type: string; label: string }>;
    conversationHistory?: string[];
    questionsAsked?: number;
    stage?: "friction" | "desire" | "blocker" | "breakthrough";
    detectedPatterns?: Array<{ name: string; confidence: number }>;
  };
  forceBreakthrough?: boolean;
  stagePrompt?: string;
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

serve(async (req) => {
  const startTime = Date.now();
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      console.error("[SPIRAL-AI] LOVABLE_API_KEY not configured");
      throw new Error("API key not configured");
    }

    const body: RequestBody = await req.json();
    const { 
      transcript, 
      sessionContext, 
      stagePrompt,
      ultraFast = false 
    } = body;
    
    // =======================================================================
    // PHASE 3: PII REDACTION - Sanitize before sending to LLM
    // =======================================================================
    const { redacted: sanitizedTranscript, piiFound } = redactPII(transcript);
    
    if (piiFound.length > 0) {
      console.log("[SPIRAL-AI] 🔒 PII redacted:", piiFound.join(", "));
    }
    
    const questionsAsked = sessionContext?.questionsAsked || 0;
    const stage = sessionContext?.stage || "friction";

    // FRUSTRATION CHECK - immediate breakthrough
    const isFrustrated = FRUSTRATION_PATTERNS.some(p => p.test(sanitizedTranscript));
    if (isFrustrated) {
      console.log("[SPIRAL-AI] ⚠️ Frustration detected, forcing breakthrough");
    }

    // Determine if breakthrough
    const shouldBreakthrough = 
      body.forceBreakthrough || 
      isFrustrated || 
      ultraFast ||
      questionsAsked >= MAX_QUESTIONS;

    console.log("[SPIRAL-AI] Processing:", {
      stage,
      questionsAsked,
      shouldBreakthrough,
      isFrustrated,
      ultraFast,
      piiRedacted: piiFound.length > 0,
      processingMs: Date.now() - startTime,
    });

    // Build context
    let contextInfo = "";
    if (sessionContext?.entities?.length) {
      contextInfo += `\nExisting entities (don't duplicate): ${sessionContext.entities.map(e => e.label).join(", ")}`;
    }
    if (sessionContext?.conversationHistory?.length) {
      // Redact PII from conversation history too
      const sanitizedHistory = sessionContext.conversationHistory.map(h => redactPII(h).redacted);
      contextInfo += `\nConversation:\n${sanitizedHistory.slice(-4).join("\n")}`;
    }
    if (sessionContext?.detectedPatterns?.length) {
      contextInfo += `\nPatterns (use for insight): ${sessionContext.detectedPatterns.map(p => p.name).join(", ")}`;
    }
    if (stagePrompt && !shouldBreakthrough) {
      contextInfo += `\n\nSTAGE: ${stagePrompt}`;
    }
    if (questionsAsked === MAX_QUESTIONS - 1 && !shouldBreakthrough) {
      contextInfo += `\n\n⚠️ LAST QUESTION - make it count.`;
    }

    const systemPrompt = shouldBreakthrough 
      ? BREAKTHROUGH_PROMPT + contextInfo 
      : ENTITY_EXTRACTION_PROMPT + contextInfo;

    // =======================================================================
    // PHASE 3: VALIDATED AI CALL - With retry on validation failure
    // =======================================================================
    const { data: validatedResult, retryCount } = await callAIWithValidation(
      systemPrompt,
      sanitizedTranscript,
      shouldBreakthrough
    );

    // Filter connections to only reference valid entity indices
    const validConnections = validatedResult.connections.filter(conn =>
      conn.from >= 0 &&
      conn.from < validatedResult.entities.length &&
      conn.to >= 0 &&
      conn.to < validatedResult.entities.length &&
      conn.strength > 0.5
    );

    const result = {
      ...validatedResult,
      connections: validConnections,
      question: shouldBreakthrough ? "" : validatedResult.question,
    };

    const processingTime = Date.now() - startTime;
    console.log("[SPIRAL-AI] ✅ Complete:", {
      entityCount: result.entities.length,
      hasQuestion: !!result.question,
      isBreakthrough: shouldBreakthrough,
      hasInsight: !!result.insight,
      validationRetries: retryCount,
      piiRedacted: piiFound.length > 0,
      processingMs: processingTime,
    });

    return new Response(JSON.stringify(result), {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json",
        "X-Processing-Time": `${processingTime}ms`,
        "X-Validation-Retries": `${retryCount}`,
        "X-PII-Redacted": piiFound.length > 0 ? "true" : "false",
      },
    });
  } catch (error) {
    console.error("[SPIRAL-AI] Error:", error);
    
    // Handle specific error types
    if (error instanceof Error && error.message.includes("429")) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (error instanceof Error && error.message.includes("402")) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        entities: [],
        connections: [],
        question: "Something went wrong. Try again?",
        response: "",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
