# Outreach section reference notes

Observed in the signed-in reference app on 2026-10-22. These screens are inspiration for the wholesaling CRM. The user selected **Telnyx for SMS**; the reference app's provider and private data model are unknown. No campaign, message, call, number, or template was changed during this review.

## Campaigns

The [Campaigns page](https://app.singalsms.xyz/campaigns) has All, Live, Scheduled, Paused, Done, and Failed views. It shows sent today, delivery rate, response rate, and spend, then a searchable table with campaign/audience, sender, status, sent/queued/failed, reply rate, batch progress and allowed hours, AI auto-reply status, created date, and actions. It can filter campaigns using AI replies or a single sender instead of a pool. A campaign detail route exists, but the selected detail page did not finish loading during this review, so its controls remain unverified.

The create dialog groups fields into:

- **Message:** campaign name, saved template, and sending number or group/pool.
- **Audience:** an imported contact list. In this workspace the dialog said all existing lists had already been used; whether a list must be single-use is a reference-app rule to review, not a proposed requirement.
- **AI auto-reply:** optional switch to have an agent answer campaign replies. This is a later decision.
- **Delivery:** time zone, optional start date/time, allowed daily hours, optional batch sending. Batching exposes contacts per batch, gap between batches, daily window, and send days. The unbatched form described a one-message-per-second pass.

The UI distinguishes campaign status, recipient delivery outcomes, and reply rate. We need separate records for each; a single campaign counter cannot explain failures or retries.

## Drip Campaigns

The [Drip Campaigns page](https://app.singalsms.xyz/drip-campaigns) has All, Running, Paused, and Done views. The creation dialog enrolls recipients reached by a source campaign **who never replied**. It permits completed or running source campaigns with sends; a running campaign offers only already-reached contacts.

The dialog chooses phone 1, 2, and/or 3; time zone and optional send time; allowed send days; optional batch sending; and message steps by day offset from enrollment. A step has body text, merge fields, a spinner for alternate wording, character/segment feedback, and an add-step action. The reference says delivery uses the contact's own time zone and stays inside allowed hours. The example merge fields include name, phone, email, property address/city/state/ZIP, offer, and company name.

For our CRM, enrollment should record the **specific recipient and phone number reached**, the source campaign send, current step, and stop reason. Confirm stop conditions beyond reply, such as opt-out, wrong number, deal status, manual pause, and invalid phone. Phone 2/3 may need separate consent and identity handling.

## Templates

The [Templates page](https://app.singalsms.xyz/templates) groups message bodies as Initial, Follow-up, Drip, and Micro, with search and performance filters. A template can contain multiple complete variations; the sender picks one per recipient, then resolves any `[Hi/Hey]` spinner inside it. Cards show stage, variation count, preview, characters/segments, sends, and reply rate.

The new-template dialog observed Initial and Follow-up stages, name, variations, merge fields/spinner controls, and live requirements including a restricted-word list. The displayed category choices differ between the list and creation dialog, so the full template taxonomy is unverified. Our design should store the **chosen variation and final rendered text on each outbound message**, so message history and performance remain accurate after a template edit. A restricted-word checker can assist review but does not establish consent or provider eligibility.

## Call Logs

The [Call Logs page](https://app.singalsms.xyz/call-logs) supports search, refresh, and pagination. Its table shows contact, call type (including missed and outbound), recording/player or “No recording,” date, and actions to open the conversation. Some rows show the team member who placed the call. Call recordings are accessible by playback and link-copy controls.

**Telnyx SMS does not by itself define the voice implementation.** Decide whether calls will use Telnyx Voice, another provider, or external call logging before designing call controls and recording storage. Until then, retain Call Logs as a separate planned module; do not imply that SMS webhooks produce call events.

## Numbers

The [Numbers page](https://app.singalsms.xyz/numbers) summarizes active lines, monthly cost, delivery acceptance, and sends over 30 days. It filters/searches lines by group and health. The table shows line/label and type, group, SMS/MMS/Voice capabilities, health, sent volume, cost, status, and actions. A line may be **Blasting** or **Personal**. The reference only lets blasting lines join a group; groups are selectable as campaign senders. A configuration dialog edits type, label, group, and allowed capabilities. The buy-number dialog searches by area code and displays a cost before purchase. We inspected it without searching or purchasing.

Our first Telnyx version can register existing numbers and their messaging profile/capabilities in the CRM. In-app number purchase, release, cost accounting, line health, and voice settings are later decisions. A UI toggle cannot create a Telnyx capability; provider state must be checked before enabling a send.

## Decisions for the next round

1. Will your first outreach version send one-to-one SMS, bulk campaigns, both, or also drips?
2. Where does permission to text each phone number come from, and should imports carry a consent source/time?
3. Should follow-ups stop as soon as a person replies to **any** number, or only the exact number and campaign thread?
4. Do you want one sending number per conversation, or a provider-managed pool? The reference's number groups and [Telnyx Number Pool](https://developers.telnyx.com/docs/messaging/messages/number-pool) are distinct configurations.
5. Are calls and recordings part of the Telnyx rollout, or a later module?

See [Telnyx integration notes](TELNYX.md) for provider-specific data and readiness requirements.
