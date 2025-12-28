# OMNiLiNK Enablement Guide for ASPIRAL

## What is OMNiLiNK?

OMNiLiNK is the integration bus that connects all APEX apps together.

When enabled, ASPIRAL can:
- Share breakthrough insights with other APEX apps
- Trigger actions in other apps based on discoveries
- Receive context from other apps to enrich spiral sessions

**Important:** OMNiLiNK is **optional**. ASPIRAL works perfectly without it.

## How to Enable OMNiLiNK

### Step 1: Get Your Credentials

Contact your APEX administrator or OMNiLiNK support to get:
- Hub URL
- Tenant ID
- API Key

### Step 2: Set Environment Variables

Add these to your environment configuration:

```bash
VITE_OMNILINK_ENABLED=true
VITE_OMNILINK_BASE_URL=https://hub.apexbiz.io
VITE_OMNILINK_TENANT_ID=your-tenant-id
VITE_OMNILINK_API_KEY=your-api-key
```

For edge functions, also set:
```bash
OMNILINK_ENABLED=true
OMNILINK_BASE_URL=https://hub.apexbiz.io
OMNILINK_TENANT_ID=your-tenant-id
OMNILINK_API_KEY=your-api-key
```

### Step 3: Redeploy ASPIRAL

Restart or redeploy the ASPIRAL app for changes to take effect.

### Step 4: Verify Connection

Check the OMNiLiNK health status:

**Via API:**
```
GET /functions/v1/omnilink-health
```

**Expected Response (when working):**
```json
{
  "status": "ok",
  "message": "OMNiLiNK integration operational",
  "circuitBreakerState": "CLOSED",
  "queuedEvents": 0
}
```

**If you see "status": "error":**
- Double-check your API key
- Verify the Hub URL is correct
- Contact OMNiLiNK support

## How to Disable OMNiLiNK

Set:
```bash
VITE_OMNILINK_ENABLED=false
```

Or remove all OMNiLiNK environment variables, then redeploy.

The healthcheck will show:
```json
{
  "status": "disabled",
  "message": "OMNiLiNK integration is disabled (OK)"
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        ASPIRAL App                          │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐ │
│  │ SessionStore│───▶│OmniLinkAdapter│───▶│ Circuit Breaker│ │
│  └─────────────┘    └─────────────┘    └────────┬────────┘ │
│                                                  │          │
│                           ┌──────────────────────┤          │
│                           ▼                      ▼          │
│                    ┌─────────────┐        ┌───────────┐    │
│                    │ Event Queue │        │ OMNiLiNK  │    │
│                    │ (localStorage)       │    Hub    │    │
│                    └─────────────┘        └───────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Events Published

| Event Type | Trigger | Payload |
|------------|---------|---------|
| `aspiral:session.started` | User starts session | sessionId, userId |
| `aspiral:session.ended` | Session completed | sessionId, duration, entityCount |
| `aspiral:pattern.detected` | AI detects pattern | sessionId, pattern, confidence |
| `aspiral:breakthrough.achieved` | User has breakthrough | sessionId, friction, grease |

## Troubleshooting

**Problem:** Healthcheck shows "error"
**Solution:** Check environment variables, verify API key hasn't expired

**Problem:** Events not appearing in other apps
**Solution:** Verify OMNiLiNK is enabled in BOTH apps

**Problem:** ASPIRAL won't start
**Solution:** Set `VITE_OMNILINK_ENABLED=false` and contact support

**Problem:** Circuit breaker is OPEN
**Solution:** This means the hub is unreachable. Events are queued and will be sent when connection recovers.

## Files Reference

- `/src/integrations/omnilink/` - Main integration module
- `/src/integrations/omnilink/adapter.ts` - Event publishing logic
- `/src/integrations/omnilink/circuitBreaker.ts` - Failure protection
- `/src/integrations/omnilink/eventQueue.ts` - Offline event queuing
- `/supabase/functions/omnilink-health/` - Health check endpoint
