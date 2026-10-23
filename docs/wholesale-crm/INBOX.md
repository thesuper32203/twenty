# Inbox discovery notes

Observed in the signed-in [SignalHub Inbox](https://app.singalsms.xyz/inbox) on 2026-10-22. These are workflow notes for adapting Twenty to real estate wholesaling, not a copy of the reference app's database or a final feature specification. No contact records or message content are reproduced here.

## What the reference Inbox shows

| Area | Observed behavior | CRM implication |
| --- | --- | --- |
| Conversation queue | Views for all, unread, needs reply, awaiting reply, missed calls, opted out, hidden, and starred conversations. Counts appear beside views. The list shows the latest SMS or call, timestamp, unread/failed/opted-out cues, contact/property context when known, and an engagement indicator. | Store message and call events with timestamps and direction. Derive queue views from events and explicit thread state; define our own engagement score before showing one. |
| Find and filter | Search can target all fields or name, phone, message, or address. Status and campaign filters are available; tag filter was disabled in the inspected workspace. Filters can be saved after criteria are set. | Index normalized phone, contact name, property address, and message search within workspace permissions. Saved views belong to the user or workspace. |
| Thread | Selecting a conversation opens its timeline. The inspected thread contained an outgoing call with recording controls and a missed call. The header offers rename, call, star, do-not-contact, block, and contact details. | Present SMS and call activity together while storing each event in its own channel-specific record. Define distinct behavior for suppression versus blocking inbound contact. |
| Reply composer | Message field, attachment, reusable MicroMessage, send-later control, sender-number selector, character/segment count, and Send. A suggested-reply action is present and priced per suggestion in the reference app. Send was disabled for an empty composer. | Start with manual one-to-one SMS using a selected Telnyx number; save the actual sender, recipient, content, and outcome. Scheduling, AI suggestion, and MMS need separate decisions. |
| Contact rail | Status choices included Hot, Warm, Cold, Not Interested, and Wrong number. The rail showed pipeline/CRM action, deal-sheet values (ARV, repair cost, as-is value, target offer, agent, property, source campaign), editable address/city/state/ZIP, activity over 14 days, upcoming tasks, tags, and notes. | Show the linked Person's latest details and the selected Property/Opportunity context. Keep analysis values on a deal/analysis record rather than duplicating them on every conversation. |
| New message | A compose dialog asks for optional first/last name, sender number, required destination phone, message, and optional attachment. | A new outbound conversation may begin before a complete Person exists. Preserve the exact normalized number pair and create/link a Person through a deliberate matching flow. |

## Proposed Twenty workflow

1. **Inbox queue:** show unread, needs reply, awaiting reply, missed call, and opted-out views. Keep unread and assignment/visibility state explicit; derive reply state from the most recent qualifying direction and call outcome, with a documented rule for automated sends.
2. **Identity:** a thread is scoped to the workspace, remote E.164 phone, and our Telnyx sending number. Link it to a Person when the match is reliable. One Person can have multiple phones and multiple threads; an unknown inbound number remains visible without a Person.
3. **Property/deal context:** show Person's current name, phone, email, and related properties. Allow the user to choose the relevant Property and Opportunity for a thread; do not infer one merely from a phone number when multiple properties or deals exist.
4. **Timeline:** show inbound/outbound SMS, provider delivery/failure updates, calls/missed calls, and related tasks/notes with actor, source, and time. Call recordings and AI suggestions are later-scope features unless voice and AI providers are selected.
5. **Reply:** choose a sending number, check consent/suppression and number eligibility on the server, then enqueue the message. Return visible pending, sent, delivered, failed, and opted-out states. Honor suppression for manual replies as well as campaigns and drips.
6. **Contact rail:** edit contact/property fields through their actual records. Status, tags, notes, tasks, and deal sheet should link to the same Person/Property/Opportunity objects used elsewhere in the CRM.

## Candidate records and fields

| Record | Fields / relationship | Integrity rule |
| --- | --- | --- |
| Conversation | workspace, remote normalized phone, local SendingNumber, optional Person, optional selected Property/Opportunity, assignee, hidden/starred/unread state, last activity | Unique active thread per workspace + local number + remote number unless a deliberate multi-thread model is chosen. Preserve unmatched inbound threads. |
| SmsMessage | conversation, Telnyx message ID, direction, from/to, body, media references, status, sent/received time, optional campaign/drip/template attribution | Deduplicate provider IDs; never overwrite the original content with a status update. Restrict message search to authorized workspace data. |
| SmsDeliveryEvent | message, Telnyx event ID, status, provider timestamp, safe diagnostic data | Append and deduplicate events; handle retry and out-of-order webhooks. |
| CallEvent | conversation, direction, outcome, timestamps, optional provider/recording reference | Keep separate from SMS. Voice provider and recording permissions remain undecided. |
| ConversationView | owner/workspace, name, search/filter definition, sort | Save only validated fields; apply workspace permissions at query time. |
| PhoneConsent / PhoneSuppression | normalized phone, evidence/source, scope, effective times | Check on every send path; an imported phone number is not consent. |

Use Twenty's workspace object/metadata and migration approach when implementation begins. [Data model](DATA_MODEL.md) and [Telnyx planning](TELNYX.md) cover the shared records and webhook path. The reference app's internal schema was not inspected.

## Decisions before implementation

- Should multiple Telnyx numbers create separate Inbox threads for the same seller, or a combined display with separate underlying threads?
- What exact event makes a thread “needs reply” or “awaiting reply,” especially after a missed call or an automated campaign send?
- Who can see/assign/hide a thread, and are statuses Person-wide or Property/Opportunity-specific?
- Should the first release include only manual SMS, with scheduling, attachments, AI suggestions, and voice added later?
- Which consent source and Telnyx-approved messaging use case permit replies and outreach to imported homeowners?
