# Contacts and lead intake

## Reference sections observed

The opportunity creation form collects first name, last name, phone, email, and property address/city/state/ZIP, then chooses a pipeline and stage. In this workspace first name and phone are required. The Details tab can edit the same contact fields and has lead temperature/status, assignee, tags, and do-not-contact.

The [Imports page](https://app.singalsms.xyz/imports) offers CSV upload, a column-mapping step before saving, and import history with row, mapped, error, duplicate, and suppressed counts. Phone 1 is required; name can be marked required. Optional mappings include separate mailing and property addresses, up to three phones, email, offer, and notes. The [Opportunities Leads view](https://app.singalsms.xyz/opportunities) exposes inbound webhooks that accept alternate field names for phone, name, email, notes, and address and add a lead to the first pipeline stage.

See [Homeowner imports](IMPORTS.md) for the implemented Twenty import contract, field map, row outcomes, and later proposals.

The [Do Not Contact page](https://app.singalsms.xyz/dnc) stores suppressed phone numbers, supports CSV import, and says server-side suppression applies to campaign, drip, and AI sends as well as manual inbox composition.

## Twenty first slice and later intake work

- Twenty **Person** holds name, phones, emails, and contact-level fields. The first slice adds Property and owner-role PersonProperty records; keep mailing address separate from property address if needed.
- Homeowner CSV import requires a valid phone and property street address, and matches an existing Person by normalized phone. One match is skipped or overridden according to the import option; multiple matches go to review. Phone matching is separate from future suppression and SMS consent checks.
- ImportBatch and ImportRowResult store batch provenance and row outcomes. Each named import uses a MessageList group containing resolved People, including skipped duplicates. Webhook intake and richer mapping provenance are later work.
- Store do-not-contact against normalized **phone numbers**, not only a Person ID. A number can move between people or be present in multiple imported records. Apply the check at send time.
- Keep imported offer and notes attached to an intake/deal record or activity with provenance. They should not silently become a current accepted offer.

## Open choices

- Required fields and duplicate policy for manual entry and webhooks; CSV uses the owner-row, required phone/address and override rules in [Homeowner imports](IMPORTS.md).
- Whether a lead represents a Person, a Person–Property relationship, or an Opportunity. The reference uses the word “lead” for several of these; the CRM should choose one meaning.
- Whether mailing address, imported secondary phone columns, additional owner roles, tags, and lead temperature belong in later releases.
