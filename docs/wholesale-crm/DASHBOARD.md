# Dashboard and metrics

Observed on the signed-in [SignalHub dashboard](https://app.singalsms.xyz/) on 2026-10-22. This records metric names and visible behavior, not the private workspace's current values or an approved specification for our CRM.

## Date controls and activity

- Date range choices: **Today**, **This week**, **This month**, and **Custom**. The custom picker says it allows up to 92 days ending no later than today. The page header reflects the selected period and the account's time zone.
- The main chart is labeled outgoing volume and replies by hour. Its accessible data table has **bucket, sent, replies, queued**. The queued series is described as an estimate of next batches from running campaigns. In the observed weekly/monthly views, the chart caption still described the latest day in the selected range, while the headline cards covered the whole range. Our design should label chart and card periods explicitly.
- The header also shows how many campaigns are currently transmitting and across how many numbers. A New campaign shortcut is present.

## Headline cards

| Metric shown | Observed presentation | Definition to confirm for our CRM |
| --- | --- | --- |
| Sent | Count for selected range, with comparison to the prior equivalent period when available | Count accepted provider sends, attempted sends, or delivered messages? The dashboard's number-health summary uses “accepted,” so this needs an explicit definition. |
| Replies | Count for selected range; a small same-day change appears below | Count inbound reply events. Keep this distinct from unique contacts who replied. Decide whether calls, missed calls, or automated replies count. |
| Response rate | Percentage and percentage-point comparison to prior equivalent period | Likely replies divided by sent from the displayed weekly values; this is an inference, not a verified formula. Decide whether to use unique replying contacts divided by contacted contacts instead. |
| Hot leads | Count plus context about people who replied this week | Likely current Hot status among qualifying responders; confirm whether this follows the selected date range or always uses the current week. |

The weekly/monthly cards showed comparisons such as percent change in sent volume and percentage-point change in response rate versus the previous period to date. An empty Today view showed “No comparison yet.”

## Other dashboard sections

| Section | Observed fields and actions | Likely source |
| --- | --- | --- |
| Campaigns in flight | Accepted, failures, queue; link to all campaigns; empty state when nothing is sending | Campaign runs, recipient deliveries, provider statuses, queue state |
| Follow-ups due | Tasks remaining today, total due today, overdue count, short list with due time and contact/property context; link to Tasks | Task due time/status/assignee and linked Person/Opportunity |
| Lead temperature | Hot, Warm, Cold counts, chart, change-status controls, and count of contacts who replied this week | Person/lead status plus distinct replying Person IDs; status is separate from deal stage |
| Recent replies | Count in range, count marked hot, message preview, contact/property, status and date; link to Inbox | Inbound communication events joined to Person and possibly Property |
| Numbers health | Active number count, top three by sent volume, each number's accepted percentage and sent count, other-number volume, total accepted percentage, accepted/failed split; link to Numbers | Sending number and per-number provider delivery outcomes |

## Data-model implications

- The dashboard should be **derived from source records**: messages/delivery attempts, reply events, campaign runs, tasks, People, and pipeline/deal records. Do not store each card value on a Person or Opportunity. Materialized rollups may be useful later, with a documented refresh and reconciliation path.
- Preserve each outbound attempt's provider status history (queued, accepted, failed, delivered if available), send number, campaign, timestamps, and external ID. Define exactly which state contributes to “Sent.”
- Preserve inbound reply events separately from a distinct set of People who replied. Unknown contacts need a stable phone/conversation identity until matched; the reference dashboard displayed unknown contacts in recent replies.
- Calculate all selected-range metrics in the workspace's chosen time zone, with consistent inclusive/exclusive range boundaries. Comparison periods should have the same elapsed portion for week/month-to-date.
- Avoid division-by-zero ambiguity: show a clear empty state when no qualifying sends exist.
- Lead temperature is a classification, not the Opportunity pipeline stage. Decide whether it belongs on Person, a Person–Property lead, or Opportunity before implementing its counts.
- Keep provider delivery health separate from deal conversion metrics. Real estate metrics such as leads → offers → contracts → assignments and projected/realized profit can be added after the deal stages and financial fields are agreed.

## Questions for the next round

1. Which of these reference metrics should appear on the first version of our dashboard?
2. Should response rate mean reply messages per accepted SMS, or unique responders per unique contacts reached?
3. Should Hot/Warm/Cold classify a Person, a specific property lead, or an Opportunity?
4. Do you also want wholesale-specific funnel and financial metrics: appointments, offers made, contracts signed, buyer assigned, closed deals, assignment fees, and gross profit?
