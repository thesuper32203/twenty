# Wholesale CRM discovery notes

These are first-pass notes from the signed-in [SignalHub reference app](https://app.singalsms.xyz/) on 2026-10-22, compared with this Twenty checkout. They are a planning aid, not an approved feature specification. The current priority is **property and deal pipeline**. No reference-app records, messages, phone numbers, addresses, or credentials are copied here.

## Sections to shape

| Area | Reference sections observed | Notes | Priority |
| --- | --- | --- | --- |
| Property and deal pipeline | Opportunities, Deal Analyzer | [Property and pipeline](PROPERTY_AND_PIPELINE.md) | First |
| Contacts and lead intake | Contact form, Imports, lead webhooks, Do Not Contact | [Contacts and intake](CONTACTS_AND_INTAKE.md), [Homeowner imports](IMPORTS.md) | First |
| Work and communication | Inbox, Tasks, Notes | [Inbox](INBOX.md), [Operations and outreach](OPERATIONS_AND_OUTREACH.md) | After deal model |
| SMS outreach | Campaigns, Drip Campaigns, Templates, Call Logs, Numbers | [Outreach screens](OUTREACH.md), [Telnyx plan](TELNYX.md) | Provider and consent design first |
| Dashboard and reporting | Dashboard | [Dashboard metrics](DASHBOARD.md) | Metric definitions before implementation |
| Supporting tools | Templates, Call Logs, Numbers, Realtors, AI Assistant, Account, Billing, Settings | [Operations and outreach](OPERATIONS_AND_OUTREACH.md) | Later review |

The [data model](DATA_MODEL.md) now distinguishes the implemented Person–Property–Opportunity import slice from later proposals. These notes remain workflow references; verify the new metadata and upgrade command against a local workspace before treating database rollout as complete.

## Working decisions from our conversation

- A Person should expose first name, last name, phone, email, property address, city, state, and ZIP in creation and People views. This is partially implemented in the current checkout.
- An Opportunity should display the linked Person's **latest** contact details, rather than a second editable copy.
- Each homeowner CSV row is one owner. Phone and property street address are required. Duplicate People match by normalized phone: skip record updates by default or override mapped nonblank fields when selected; ambiguous matches go to review.
- Each upload is named and its resolved People join a reusable contact group, including duplicates skipped for updates. The import can create linked Opportunities for the existing By Stage board. A group is not SMS consent.
- The reference workflow is inspiration. Its pipeline names, outreach rules, and financial formulas need your review before implementation.

## Questions for the next round

1. What are your seller deal stages, and do buyers need a separate pipeline?
2. Beyond the import's Create opportunities option, when should a new contact become a deal: on reply, on webhook intake, or manually?
3. Which numbers do you want on a deal sheet: asking price, seller's minimum, ARV, repairs, MAO, assignment fee, contracted price, buyer price, and actual profit?
4. Which communications will live inside this CRM: SMS, calls, email, campaigns, AI follow-up?

Telnyx is now the selected **SMS provider**. The scope of calls and the eligibility/consent source for SMS are still open. See [Outreach screens](OUTREACH.md) and [Telnyx plan](TELNYX.md).

## Source and review limits

The observations describe what the signed-in reference workspace exposed on 2026-10-22. Several settings and stages appeared configurable, so they are examples rather than universal product rules. The Twenty comparison comes from [Feature map](../FEATURE_MAP.md), [Database map](../DATABASE_MAP.md), and the current Person, Opportunity, Task, and Note entity sources. Physical database constraints and the reference app's private schema were not inspected.
