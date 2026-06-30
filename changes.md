# SmartCX AI — Session Changes & Project Status

> **Date:** 30 June 2026  
> **Author:** Osi (C7 Fullstack Team, Seamfix)  
> **Scope:** Backend (NestJS) + Frontend (Angular 21)

---

## Table of Contents

1. [What Was Built Today](#1-what-was-built-today)
2. [How to Test Everything](#2-how-to-test-everything)
3. [AI Provider Setup](#3-ai-provider-setup)
4. [Dead Buttons — What They Need](#4-dead-buttons--what-they-need)
5. [What Remains to Complete the App](#5-what-remains-to-complete-the-app)

---

## 1. What Was Built Today

### 1.1 AI Provider Swap (OpenAI → Gemini)

**Files changed:** `src/ai/ai.service.ts`

The original scaffolding used OpenAI's SDK (`gpt-4o-mini`). This was replaced with a plain `fetch()` call to Google's Gemini REST API — no new SDK dependency required.

All five AI methods are preserved with identical signatures:

- `analyzeIssue(messages)` — classifies priority, sentiment, category, summary
- `generateTicketDraft(conversation, customerName)` — writes a ticket description from a conversation
- `generateInsightSummary(context)` — tactical insight for agents or dashboards
- `generateSmartReplies(context)` — returns 3 reply suggestions
- `generateResolutionSummary(ticket, messages)` — closure summary with problem/action/sentimentShift

**Key detail:** swapping AI providers in future only requires changing two `.env` values:

```
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-2.5-flash-lite
```

---

### 1.2 Inbound Webhook → Issue Creation with AI Classification

**Files changed/created:**

- `src/webhooks/dto/inbound-webhook.dto.ts` — replaced generic payload with typed fields
- `src/webhooks/webhooks.controller.ts` — replaced stub with real issue creation logic
- `src/webhooks/webhooks.module.ts` — added `IssuesModule` import
- `src/customers/customers.service.ts` — added `findOrCreate()` method
- `src/customers/customers.module.ts` — added `exports: [CustomersService]`
- `src/issues/issues.service.ts` — added `create()` method
- `src/issues/issues.module.ts` — added `AiModule` + `CustomersModule` imports

**What happens end to end:**

```
POST /api/v1/webhooks/whatsapp
        ↓
CustomersService.findOrCreate()   ← finds or creates the customer
        ↓
AiService.analyzeIssue()          ← Gemini classifies the message
        ↓
Issue saved to DB with:
  - priority (low/medium/high/urgent)
  - sentimentLabel (positive/neutral/frustrated/angry)
  - sentimentScore (-1.0 to 1.0)
  - category (Delivery, Refund, Payment, etc.)
  - aiAnalysisSummary
        ↓
RealtimeGateway.emitIssueNew()    ← frontend queue updates live
```

Both `/webhooks/whatsapp` and `/webhooks/instagram` are wired identically.

---

### 1.3 Realtime Gateway (Socket.io)

**Files created:** `src/gateway/gateway.module.ts`  
**Files changed:** `src/app.module.ts`, `src/issues/issues.module.ts`, `src/issues/issues.service.ts`

The `RealtimeGateway` already had `emitIssueNew()`, `emitTicketUpdated()`, and `emitTicketAssigned()` methods — but nothing called them. A `GatewayModule` was created to make the gateway injectable across feature modules.

`IssuesService.create()` now calls `emitIssueNew()` immediately after saving a new issue. The frontend `WebsocketService` was already listening for `issue:new` — this completes the circuit.

**Result:** a new inbound webhook message causes the Issue Queue page to update live in any open browser tab without a refresh.

---

### 1.4 Agent Reply (SEND Button on Issue Conversation)

**Files changed/created:**

- `src/issues/dto/add-message.dto.ts` — new DTO
- `src/issues/issues.service.ts` — added `addMessage()` method
- `src/issues/issues.controller.ts` — added `POST /issues/:id/messages` endpoint
- `src/app/core/services/issue.service.ts` — added `addMessage()` frontend method
- `src/app/features/issue-queue/conversation-view/conversation-view.component.ts` — wired SEND logic
- `src/app/features/issue-queue/conversation-view/conversation-view.component.html` — bound input + SEND button

Agent replies are appended to `rawMessages` on the Issue entity. The message appears immediately in the chat UI (optimistic update) and persists to the database.

---

### 1.5 AI Quick Replies on Issue Conversation

**Files changed/created:**

- `src/issues/dto/smart-replies-response.dto.ts` — new DTO
- `src/issues/issues.service.ts` — added `getSmartReplies()` method
- `src/issues/issues.controller.ts` — added `GET /issues/:id/smart-replies` endpoint
- `src/app/core/services/issue.service.ts` — added `getSmartReplies()` frontend method
- `src/app/features/issue-queue/conversation-view/conversation-view.component.ts` — added `loadSmartReplies()` and `useSuggestedReply()`
- `src/app/features/issue-queue/conversation-view/conversation-view.component.html` — suggestion chips UI
- `src/app/features/issue-queue/conversation-view/conversation-view.component.css` — chip styles with hover state

Clicking "Quick Replies" sends the full issue conversation to Gemini and returns 3 agent reply suggestions. Clicking a chip fills the message input. The agent can edit before sending.

---

### 1.6 AI Insights Card — Issue Queue

**Files changed/created:**

- `src/issues/dto/queue-insight-response.dto.ts` — new DTO
- `src/issues/issues.service.ts` — added `getQueueInsight()` method
- `src/issues/issues.controller.ts` — added `GET /issues/insights/queue` endpoint
- `src/app/core/services/issue.service.ts` — added `getQueueInsight()` frontend method
- `src/app/features/issue-queue/issue-queue/issue-queue.component.ts` — added `aiInsight` signal + load on init
- `src/app/features/issue-queue/issue-queue/issue-queue.component.html` — replaced hardcoded text

Pulls the last 20 issues, sends category+priority breakdown to Gemini, displays a one-sentence tactical insight on the queue page.

The "Team Load" and "Smart Respond" cards remain hardcoded — marked with `TODO` comments — because no agent workload data or ticket-template system exists yet.

---

### 1.7 AI Ticket Draft Generation

**Files changed/created:**

- `src/issues/dto/ticket-draft-response.dto.ts` — new DTO
- `src/issues/issues.service.ts` — added `getTicketDraft()` method
- `src/issues/issues.controller.ts` — added `GET /issues/:id/ticket-draft` endpoint
- `src/app/core/services/issue.service.ts` — added `getTicketDraft()` frontend method
- `src/app/features/tickets/create-ticket/create-ticket.component.ts` — added `regenerateDraft()` and `generatingDraft` signal
- `src/app/features/tickets/create-ticket/create-ticket.component.html` — added "✨ Generate AI Draft" button

When creating a ticket from an issue, clicking "✨ Generate AI Draft" calls Gemini with the full conversation and customer name, and populates the draft description field with a properly written ticket summary (not just the raw analysis).

---

### 1.8 AI Resolution Summary on Ticket Resolve

**Files changed:**

- `src/tickets/tickets.module.ts` — added `AiModule` import
- `src/tickets/tickets.service.ts` — injected `AiService`, rewrote `resolve()` to call `generateResolutionSummary()`
- `src/app/features/tickets/resolution-summary/resolution-summary.component.ts` — removed manual validators, split problem/action signals
- `src/app/features/tickets/resolution-summary/resolution-summary.component.html` — replaced hardcoded "The Problem" text

When an agent clicks "MARK RESOLVED", the backend gathers the full ticket message history, calls Gemini for a `{ problem, action, sentimentShift }` summary, saves it, and the frontend displays it split across "The Problem" and "The Action" sections.

---

### 1.9 AI Insight Card — Dashboard

**Files changed:**

- `src/dashboard/dashboard.module.ts` — added `AiModule` import
- `src/dashboard/dashboard.service.ts` — injected `AiService`, added `getAiInsight()` method
- `src/dashboard/dashboard.controller.ts` — added `GET /dashboard/ai-insight` endpoint
- `src/app/core/services/dashboard.service.ts` — added `getAiInsight()` frontend method
- `src/app/features/dashboard/dashboard.component.ts` — added `aiInsight` signal + load on init
- `src/app/features/dashboard/dashboard.component.html` — replaced hardcoded text

Pulls the 20 most recent open tickets and generates a tactical insight sentence for the dashboard AI panel.

---

### 1.10 Resolved Ticket UI State

**Files changed:**

- `src/app/features/tickets/ticket-workspace/ticket-workspace.component.html`
- `src/app/features/tickets/ticket-workspace/ticket-workspace.component.css`

A resolved ticket now shows:

- Green "✓ RESOLVED" badge instead of the "RESOLVE TICKET" link
- "Resolution Summary" card instead of "AI Insight Summary"
- "This ticket has been resolved. No further messages can be sent." notice instead of the message composer
- Active status button is highlighted so agents always know the current state

---

### 1.11 Cleanup

- Removed hardcoded "Internal Notes" card from Issue Conversation view — `internalNotes` is a Ticket-level field, not an Issue-level field
- Removed fake `Items: 2` line from ticket workspace Order Summary card
- "Attach file" button disabled with "Coming soon" tooltip (no file storage infrastructure exists)
- "View Logistics" button disabled with "Coming soon" tooltip
- "Manage" button on Dashboard active tickets table now navigates to `/tickets/:id`

---

## 2. How to Test Everything

### Prerequisites

**Backend `.env`:**

```
PORT=3000
CORS_ORIGIN=http://localhost:4200
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=smartcx_ai
JWT_SECRET=dev_secret_change_in_prod
JWT_EXPIRES_IN=1d
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-2.5-flash-lite
```

**Boot order:**

```bash
# Terminal 1 — backend
cd backend && npm run start:dev

# Terminal 2 — frontend
cd frontend && ng serve
```

**Seed the database** (first time only):

```bash
cd backend && npm run seed
```

**Login credentials:**

- Email: `aisha@smartcxdemo.com`
- Password: `Demo@1234`

---

### Test 1 — AI Issue Classification + Realtime Update

1. Open the Issue Queue page in your browser (`http://localhost:4200/issues`) and leave it open
2. Open Swagger in a second tab (`http://localhost:3000/api/docs`)
3. Authorize in Swagger using the JWT from a login call first (`POST /api/v1/auth/login`)
4. Find your `businessId` from `GET /api/v1/dashboard/metrics` response header or from the DB
5. `POST /api/v1/webhooks/whatsapp` with:

```json
{
  "businessId": "YOUR-BUSINESS-UUID",
  "customerName": "Test Customer",
  "phone": "08100000000",
  "message": "My order arrived damaged and I want a refund immediately!"
}
```

**Expected:** the Issue Queue tab updates live (no refresh). The new row shows AI-computed `priority`, `category`, and sentiment — not manual values.

---

### Test 2 — Agent Reply (SEND)

1. Click any issue in the queue to open the conversation view
2. Type a message in the input field
3. Click SEND or press Enter

**Expected:** message appears immediately in the chat as an agent bubble. On page refresh, it persists (stored in `rawMessages`).

---

### Test 3 — AI Quick Replies

1. Open any issue conversation
2. Click "Quick Replies"
3. Button shows "Loading..." while Gemini generates

**Expected:** 3 reply suggestion chips appear above the input. Clicking one fills the input field. You can edit before sending.

---

### Test 4 — AI Issue Queue Insight

1. Navigate to the Issue Queue page
2. Scroll to the bottom — "AI Insights" card

**Expected:** real sentence about the current issue patterns (e.g. "Multiple urgent delivery complaints suggest a systemic fulfilment issue requiring immediate escalation."). Not the hardcoded placeholder.

---

### Test 5 — Create Ticket with AI Draft

1. Open any issue conversation
2. Click "Create ticket" button (right sidebar)
3. On the Create Ticket form, select the issue from the dropdown — form auto-fills
4. Click "✨ Generate AI Draft"

**Expected:** the draft description field is replaced with a properly written ticket summary generated from the full conversation, not just the raw AI analysis.

---

### Test 6 — Resolve Ticket with AI Resolution Summary

1. Open any open ticket (`/tickets/:id`)
2. Click "RESOLVE TICKET"
3. On the Resolution page, click "MARK RESOLVED"

**Expected:**

- Toast: "Ticket resolved successfully"
- You are navigated back to the ticket workspace
- The workspace now shows "✓ RESOLVED" badge, "Resolution Summary" card with real AI text, and the message composer is replaced with a resolved notice
- The Resolution page (`/tickets/:id/resolution`) shows "The Problem" and "The Action" populated from the AI summary

---

### Test 7 — Dashboard AI Insight

1. Navigate to the Dashboard
2. Bottom-right "AI Insight" panel

**Expected:** real sentence about current open ticket patterns, not the hardcoded escalation copy.

---

## 3. AI Provider Setup

The app is built to swap AI providers by changing `.env` only. `AiService` uses plain `fetch()` — no SDK lock-in.

### Currently configured: Google Gemini

```
GEMINI_API_KEY=get from https://aistudio.google.com/apikey
GEMINI_MODEL=gemini-2.5-flash-lite
```

**Known limitations on free tier:**

- `gemini-1.5-flash` — returns 404 (deprecated for this API version)
- `gemini-2.0-flash` — returns 429 with `limit: 0` (free quota not provisioned on this account)
- `gemini-2.5-flash-lite` — works, but occasional 503 (high demand, transient — refresh resolves)

### Recommended alternative: Groq (more generous free tier)

To switch to Groq, update `ai.service.ts` — only `generateText()` changes (the private method). All five public AI methods stay identical. Groq's API is OpenAI-compatible, so the fetch body format is nearly identical.

```
GROQ_API_KEY=get from https://console.groq.com
GROQ_MODEL=llama3-8b-8192   # or mixtral-8x7b-32768
```

---

## 4. Dead Buttons — What They Need

These buttons exist in the UI but make no network requests. They are not bugs — they are features that require backend systems not yet built.

| Button                         | Location                       | What's needed to wire it                                                                                     |
| ------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| **Attach file**                | Issue conversation composer    | File storage service (S3/Cloudinary), `multer` middleware, upload endpoint, `attachmentUrl` field on message |
| **View Logistics**             | Ticket workspace Order Summary | Orders/logistics data model, separate logistics service or third-party integration                           |
| **Set Reminder**               | Ticket workspace Quick Actions | Notifications system, scheduled jobs (e.g. Bull queue), reminder entity                                      |
| **Transfer Ticket**            | Ticket workspace Quick Actions | Agent list endpoint, `PATCH /tickets/:id/assign` already exists but needs UI agent picker                    |
| **Full History**               | Ticket workspace Quick Actions | Audit log entity, event-sourcing or change-tracking on ticket updates                                        |
| **Apply Recommendation**       | Dashboard AI panel             | Action execution layer — AI recommends, system needs to act (reassign ticket, trigger alert, etc.)           |
| **Export PDF**                 | Resolution page                | PDF generation library (e.g. `puppeteer` or `@react-pdf`), export endpoint                                   |
| **Reply / Internal Note tabs** | Ticket workspace               | Tab switching logic, `isInternalNote` boolean on message — backend field exists, UI toggle not built         |
| **View order history**         | Issue conversation sidebar     | Order history endpoint, customer purchase data model                                                         |
| **Quick Replies**              | Ticket workspace               | Same endpoint already built for Issues — needs to be wired on the Ticket workspace too                       |

---

## 5. What Remains to Complete the App

Grouped by area, roughly in order of dependency.

### 5.1 Agent & Team Management

Currently there are no endpoints to list agents or manage their availability. Several features depend on this:

- `GET /users` — list agents in the business
- Agent picker on ticket assignment (UI already has the field, backend `POST /tickets/:id/assign` exists)
- "Team Availability" panel on dashboard (currently hardcoded names)
- "Team Load" card on Issue Queue (currently hardcoded)
- "Transfer Ticket" button

---

### 5.2 Ticket Workspace — Remaining Wiring

- **Reply / Internal Note toggle** — `isInternalNote` boolean exists on `Message` entity and `AddTicketMessageDto`. The UI tabs exist but don't switch modes. One-day task.
- **Priority dropdown** — currently shows the priority label but the `<select>` has no `(change)` handler. Needs `PATCH /tickets/:id` or the existing `updateStatus` extended to include priority.
- **Smart Replies on ticket** — `generateSmartReplies` is only wired on the Issue conversation. The ticket workspace also has a message composer that would benefit from it.

---

### 5.3 File Attachments

Full scope:

- Choose a storage provider (AWS S3, Cloudinary, or local `multer` for dev)
- `POST /uploads` endpoint returning a URL
- Wire `attachmentUrl` on `Message` entity (field exists, never populated)
- Frontend file picker + upload progress

---

### 5.4 Realtime — Remaining Events

The `RealtimeGateway` has three emit methods. Only one is currently called:

| Event                | Status       | Where to call it                                             |
| -------------------- | ------------ | ------------------------------------------------------------ |
| `emitIssueNew`       | ✅ Wired     | `IssuesService.create()`                                     |
| `emitTicketUpdated`  | ❌ Not wired | `TicketsService.updateStatus()`, `resolve()`, `addMessage()` |
| `emitTicketAssigned` | ❌ Not wired | `TicketsService.assign()`                                    |

Wiring these makes the ticket workspace feel live — status changes and new messages in one tab appear in other tabs without refresh.

---

### 5.5 Search

The top navigation search bar (`Search tickets, customers, notes...`) makes no API call. A full-text search endpoint across tickets, issues, and customers would be needed. PostgreSQL's `ILIKE` or `tsvector` full-text search are both viable options.

---

### 5.6 Notifications & Reminders

The "Set Reminder" button and a proper notifications system would require:

- A `Reminder` entity with `dueAt`, `ticketId`, `userId`
- A scheduled job runner (e.g. Bull + Redis, or NestJS `@Cron`)
- In-app notification UI (could reuse the existing Socket.io gateway with a new event type)

---

### 5.7 Audit Log / Full History

Every meaningful action on a ticket (created, assigned, status changed, message sent, resolved) should be recorded in an `AuditLog` entity. The "Full History" button would render this. This is good practice for a support tool regardless of the UI feature.

---

### 5.8 Real Channel Integration

Currently webhook endpoints accept any POST — they are mocked. Real integration requires:

**WhatsApp (Meta):**

- Meta Business account verification
- WhatsApp Business API phone number approval
- Webhook verification handshake (`GET /webhooks/whatsapp` with `hub.challenge` response)
- Parsing Meta's actual payload format (nested `entry[].changes[].value.messages[]`)

**Instagram:**

- Same Meta app review process
- Instagram Basic Display API or Messaging API approval

**Email:**

- Inbound email parsing (e.g. SendGrid Inbound Parse, Mailgun Routes, or Postmark)
- Maps email sender → customer, email body → issue message

---

### 5.9 Settings Page

The Settings nav item exists but the page is a placeholder. Typical contents for a support tool:

- Business profile (name, logo, timezone)
- Agent management (invite, deactivate, change roles)
- Channel configuration (connect WhatsApp number, email address)
- SLA configuration (response time targets per priority)
- Notification preferences

---

### 5.10 Old Scaffold Cleanup

Two items left over from the original scaffold that should be removed to avoid confusion:

- `src/app/core/services/auth/auth.service.ts` — old duplicate auth service, superseded by `src/app/core/services/auth.service.ts`. Dead import risk.
- `src/app/core/models/index.ts` — contains `Task`, `Project`, `Event` types from the original scaffold template. Not used anywhere in SmartCX.
