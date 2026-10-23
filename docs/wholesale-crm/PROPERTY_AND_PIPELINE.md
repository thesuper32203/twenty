# Property and deal pipeline

## Twenty first slice in this checkout

Homeowner CSV import treats each row as an owner with a required phone and property street address. It creates or reuses a [`Property`](../../packages/twenty-server/src/modules/property/standard-objects/property.workspace-entity.ts), links the Person through an owner-role [`PersonProperty`](../../packages/twenty-server/src/modules/property/standard-objects/person-property.workspace-entity.ts), and, when the import's Opportunity option is enabled, creates or reuses an Opportunity linked to both. The Opportunity still displays current contact details from its linked Person. With duplicate override off, an existing matched Person is added to the named upload group without changing their Property or Opportunity links; see [Imports](IMPORTS.md).

The first pipeline view is Twenty's existing Opportunity `By Stage` Kanban, grouped by the standard `stage` field. Imported Opportunities start at `NEW`. The present stage choices are New, Screening, Meeting, Proposal and Customer. Seller-specific stage names, multiple named pipelines, buyer pipeline, stage history and deal analysis are **later design decisions**, not derived from the reference workspace.

## Reference workflow observed

### Opportunity board

The [Opportunities page](https://app.singalsms.xyz/opportunities) has named pipelines with ordered, editable stages. Its board supports searching, status/city/assignee filters, drag or menu stage moves, export, and a new opportunity action. A card shows the contact, property address, phone, recent activity, engagement, task urgency, property links, and a call shortcut. The same area has Pipeline, Tasks, and Leads views; the Leads view shown in this workspace configures inbound lead webhooks, rather than being a table of leads.

The reference workspace's example stages ran from new and follow-up through needs offer, offer made, contracts out, under contract, and buyer. These names are workspace configuration, **not** a recommended final pipeline. The Buyer stage in a seller pipeline is a prompt to decide whether buyers have their own workflow.

The new opportunity dialog actually creates a contact and places it in a selected pipeline/stage. Its fields are first name, last name, phone, email, property address, city, state, and ZIP. First name and phone are required there. That is close to the contact fields already requested for this CRM.

### Opportunity drawer and deal sheet

The drawer has stage controls plus Conversation, Details, Tasks, and Notes tabs. Details separates contact fields from pipeline status, assignee, do-not-contact, tags, and a deal sheet. The deal sheet displays ARV, repair cost, as-is value, target offer, agent, property, source campaign, and property-site links. An Analyze this property action opens the Deal Analyzer. Removing the card from a pipeline leaves the contact and conversation in place.

Tasks attached to a card have title, type (call, SMS, follow-up, email, meeting, other), due date/time, assignee, completion, and overdue state. Notes are shared within the account and can be pinned or edited. The conversation view combines messages, calls, and task activity.

### Deal Analyzer

The [Deal Analyzer](https://app.singalsms.xyz/deal-analyzer) begins with an address, offers sold comparable sales, lets the user choose comps, then displays a saved result. A result includes property facts, selected comps, median price per square foot, ARV, a separate provider as-is estimate, repair tier/cost, offer inputs, four strategy estimates (wholesale assignment, flip, rental/BRRRR, novation), summary, and a share action. The observed inputs include repair tier, max offer percentage of ARV, and assignment fee. Recent analyses can be reopened. The reference app charges a credit for fetching a new address; that billing rule is not a CRM requirement.

The displayed figures are estimates. We should retain the inputs, comp choices, formula version, source, and timestamp with each analysis so an old offer is explainable after data or assumptions change. Any valuation provider, formula, and report-sharing behavior need a separate decision.

## Adaptation and later phases

1. Keep **Person** as the contact identity and source of current name/phone/email. Preserve the existing property address field for the current contact form and list.
2. The first slice adds a distinct **Property** record with address and an owner-role link to Person. Extend the role vocabulary and property facts when those workflows are chosen.
3. Reuse **Opportunity** as the deal record, linked to a seller Person and a Property. Keep later offer/contract values and outcomes on the Opportunity. Show current contact details by relation, matching the user's earlier choice.
4. Represent pipeline configuration explicitly if more than one pipeline is needed. An ordered stage belongs to one pipeline; an Opportunity belongs to one pipeline and one stage at a time. Preserve stage-change history for auditing and reporting.
5. Store **Property Analysis** snapshots and selected comps separately from Property and Opportunity. A deal can point to the analysis used for a particular offer without overwriting earlier work.
6. Treat campaign source and communication activity as relations/events, rather than copying the latest message into the deal as canonical data. The card can show a derived preview.

See [data model](DATA_MODEL.md) for candidate fields and keys.

## Decisions for later phases

- Whether a Person may have more than one active deal on the same Property.
- Beyond the import's explicit Create opportunities option, when pipeline membership should begin for inbound replies, manual entry and webhooks.
- Exact seller stages, terminal outcomes, and whether buyer acquisition/disposition has its own pipeline.
- Which deal values are entered manually versus calculated, and whether offer formulas match the reference.
- Whether a property's address on Person is only a primary/display address once a Property object exists.
