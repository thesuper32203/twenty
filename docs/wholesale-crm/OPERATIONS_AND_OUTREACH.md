# Operations and outreach

This is a section inventory for later design rounds. Property and deal records take priority. Features below were observed in the [reference app](https://app.singalsms.xyz/); they are not yet selected for this CRM.

| Section | Observed workflow | Likely data boundary / question |
| --- | --- | --- |
| Dashboard | Sends, replies, response rate, hot leads, campaigns, follow-ups, recent replies, number health | See the detailed [dashboard metric notes](DASHBOARD.md). |
| Inbox | Conversation views, search/filter, SMS/call timeline, contact rail, manual reply, sender selection | See the detailed [Inbox notes](INBOX.md). SMS provider is Telnyx; voice scope remains open. |
| Tasks | Due/overdue/upcoming/done views, assignee and type filters, snooze and completion | Reuse Twenty Task and record targets; task type and snooze may need fields. |
| Notes | Per-opportunity notes, author, pin, edit, account visibility | Reuse Twenty Note/targets; pin and visibility require review. |
| Campaigns | Bulk outreach with list, template, number; live/scheduled/paused/done/failed states | See [Outreach screens](OUTREACH.md) and [Telnyx plan](TELNYX.md). Existing Twenty campaign code is email oriented. |
| Drip Campaigns | Follow-up sequence for contacts who did not reply | Sequence steps, enrollment, stop conditions, suppression, send log; see [Outreach screens](OUTREACH.md). |
| Templates | Message categories, variations, merge fields, spinner, performance | See [Outreach screens](OUTREACH.md). |
| Call Logs and Numbers | Call history/recordings and sending-number management | SMS uses Telnyx; voice provider scope remains open. See [Outreach screens](OUTREACH.md). |
| Realtors | Separate realtor section | Decide whether realtor is a Person role/tag, organization, or distinct object. |
| AI Assistant | Assistant section and optional AI campaign replies/follow-up | Requires explicit scope, review controls, and activity logging. |
| Account, Billing, Settings, Learn | Workspace management and help sections | Reuse Twenty account/settings when possible; reference credit billing is not assumed. |

## Cross-cutting needs

- Show one coherent timeline on a contact/deal: SMS, calls, tasks, notes, stage changes, and imported events, with source and timestamps.
- Keep a communication tied to its contact and phone number. Link it to a Property or Opportunity only when attribution is known; a person may discuss multiple addresses.
- Before any automated or manual SMS send, check normalized-number suppression and record the decision. Actual outreach behavior and legal/compliance requirements need a separate review before implementation.
- Give webhook, import, and provider events stable external IDs so retries cannot create duplicate contacts, messages, or charges.
