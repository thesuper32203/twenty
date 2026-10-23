# Telnyx SMS integration planning notes

The user chose Telnyx for SMS. This is an architecture outline, not a connected account or authorization to send. The reference app's [Outreach screens](OUTREACH.md) define desired workflow ideas; Telnyx's own documentation defines provider behavior.

## Provider path to support

1. Keep a Telnyx API key and webhook verification public key in server-side secrets. A sending number belongs to a Telnyx messaging profile. [Telnyx sending guide](https://developers.telnyx.com/docs/messaging/messages/send-message), [messaging profiles](https://developers.telnyx.com/docs/messaging/messages/messaging-profiles-overview).
2. Queue one outbound request per recipient/phone, after checking number capability, campaign/sequence state, schedule, consent, and suppression. Store the selected template variation and rendered body before dispatch. The provider call must be retry-safe at our job boundary.
3. Store the Telnyx message ID returned on submission, then process signed webhook events for inbound `message.received`, outbound `message.sent`, and terminal `message.finalized`. Telnyx documents an event ID and message payload ID, and says webhooks can be retried and arrive out of order. Deduplicate by provider event ID and update the message state by event time/state precedence. [Telnyx webhook guide](https://developers.telnyx.com/docs/messaging/messages/receiving-webhooks).
4. Verify Telnyx's Ed25519 signature against the **raw request body** and reject an unverified webhook. Acknowledge valid events promptly and perform CRM updates asynchronously. [Telnyx webhook guide](https://developers.telnyx.com/docs/messaging/messages/receiving-webhooks).
5. Link inbound texts by normalized sender number **and** recipient Telnyx number. If no Person matches, retain an unmatched conversation; do not guess a Property or Opportunity from a phone number alone. [Telnyx receive guide](https://developers.telnyx.com/docs/messaging/messages/receive-message).
6. Use event-level records to derive accepted/sent/delivered/failed counts, reply rates, costs, campaign progress, and number health. Telnyx also offers messaging-profile metrics, but those provider totals will not by themselves identify CRM deals or campaign recipients. [Telnyx profile metrics](https://developers.telnyx.com/api/messaging/get-messaging-profile-metrics).

## Provider readiness before live outbound SMS

The SMS use case must be reviewed against Telnyx/carrier registration and consent requirements **before** enabling campaigns or drips. Telnyx says US business traffic on local 10-digit numbers needs a registered brand, registered campaign/use case, number assignment, and approval; it specifically flags unsolicited messaging in lead generation and real estate as a disallowed use case. The reference app's sending flow does not establish that our intended audience is eligible. Record the consent source and time for each phone number, honor opt-outs, and confirm the planned wholesaling messages with Telnyx. [Telnyx 10DLC FAQ](https://support.telnyx.com/en/articles/3679260-frequently-asked-questions-about-10dlc), [Telnyx 10DLC rate-limit guidance](https://developers.telnyx.com/development/docs/messaging/10dlc/10dlc-rate-limits).

The CRM's PhoneSuppression record should apply at dispatch for manual texts, campaigns, and drips. Telnyx also has [opt-in/out management](https://developers.telnyx.com/docs/messaging/messages/advanced-opt-in-out); define how provider-level opt-outs and CRM suppression stay aligned before any live send. Do not infer consent from the presence of a phone number in a CSV.

## Candidate workspace records

| Record | Key data |
| --- | --- |
| SendingNumber | normalized E.164 number, Telnyx phone-number ID/profile ID, label, role, SMS/MMS/voice capability, active/provider state, registration reference |
| NumberGroup + membership | CRM grouping for selected campaign senders; map deliberately to a Telnyx messaging profile/number pool only if that model is chosen |
| SmsTemplate + Variation | category, body/version, merge-field schema, review status; outbound message stores chosen variation and rendered text |
| OutreachCampaign + Recipient | template version, audience snapshot, sender/profile, schedule, state; per-person/phone eligibility, send/skip/failure/reply outcome |
| CampaignBatch | campaign, planned time, allowed window/time zone, dispatch progress, retry state |
| DripSequence + Step + Enrollment | source campaign, phone selection, day offset/body, due time, current step, reply/opt-out/stop reason |
| SmsMessage + DeliveryEvent | provider message/event IDs, from/to, direction, text/media reference, segment/cost data when returned, status history, occurred-at timestamps, campaign/enrollment/person links |
| PhoneConsent + PhoneSuppression | normalized phone, source/evidence, scope, recorded/revoked times; suppression checked before every send |

All provider IDs and idempotency keys must be unique within the appropriate workspace/provider scope. These records would be added through Twenty's workspace metadata/migration pattern, with permissions and secret handling reviewed during implementation. The existing Twenty email campaign entities should not be assumed to implement SMS semantics.

## Rollout order to discuss

1. Confirm approved Telnyx use case, registration, consent evidence, and number setup.
2. Add sending-number configuration, conversation/message storage, verified inbound/status webhook handling, and suppression.
3. Add one-to-one SMS with a test number and a controlled pilot audience.
4. Add templates and bulk campaigns, then drips and reporting after delivery/reply events are reliable.
5. Treat voice calls and recordings as a separate integration decision.
