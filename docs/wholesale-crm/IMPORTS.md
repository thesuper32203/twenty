# Homeowner list import

These notes reverse engineer the signed-in reference app's [Imports page](https://app.singalsms.xyz/imports) as observed on 2026-10-22. No homeowner list was uploaded or imported during this review. The post-upload mapping and preview screens were not available without selecting a file, so their detailed controls remain unverified. The design recommendations below are labeled separately from observed behavior.

## Twenty first slice: owner rows and named groups

The implementation in this checkout treats **one CSV row as one owner**. A valid phone number and property street address are required; name, email, city, state and ZIP are optional mappings. The **Contacts & Data → Imports** sidebar entry opens `/imports`, with an upload control and saved history. The upload dialog asks for a group name, offers **Override existing contacts matched by phone** and **Create opportunities for imported owners**, then opens the CSV column-mapping wizard and previews per-row `CREATE`, `UPDATE`, `SKIP`, `REVIEW` or `ERROR` outcomes before commit. The Opportunity option starts enabled. The UI reports invalid rows as errors instead of silently dropping them.

The server normalizes the phone and compares it with existing primary and additional Person phone numbers. Exactly one match is a duplicate: with override off, Person, Property and Opportunity records are left unchanged, but the Person still joins the named group; with override on, only mapped nonblank contact fields are updated and the Property/owner/Opportunity links are ensured. More than one Person match, or more than one matching Property for a row that would be written, goes to review without choosing arbitrarily. Rows missing a valid phone or street address are errors. The same Person can occur in multiple owner rows, while group membership is unique per Person and group.

The group uses Twenty's existing [`MessageList`](../../packages/twenty-server/src/modules/emailing/standard-objects/message-list.workspace-entity.ts) and [`MessageListMember`](../../packages/twenty-server/src/modules/emailing/standard-objects/message-list-member.workspace-entity.ts) records. A repeated import can reuse a group associated with an earlier homeowner batch; a name matching multiple or unrelated Lists is rejected rather than guessed. People can open Contact groups from the People view and inspect a group's members. Later SMS campaign selection can use this group, but import membership is **not** SMS consent.

[`previewHomeownerImport`](../../packages/twenty-server/src/modules/wholesale-import/resolvers/homeowner-import.resolver.ts) is read-only and previews the first 500 mapped rows of a large upload. `commitHomeownerImport` accepts at most 1,000 rows per request; the browser sends 500-row chunks with an `offset` and `totalRows` up to 100,000. Each chunk writes row results, Person/Property/owner relations, group memberships and optional Opportunities in its own workspace transaction. The same idempotency key and batch are reused for every chunk. The server serializes chunks for that key, rejects out-of-order or conflicting payloads, and treats a completed chunk retry as a no-op. The batch remains `PROCESSING` until all rows are saved. If the browser loses a request, Retry continues in the same tab; reselecting the same file with the same options can also replay already saved chunks. The wizard keeps mapped rows in browser memory, so the tab must stay open while a large import runs. This is a bounded request path, not a background queue.

`homeownerImportHistory` returns the newest 50 imports, including mapped-column count and distinct normalized phones on resolved Person rows. The distinct count is aggregated in the database instead of loading all row results into server memory. Duplicates are skipped rows. The existing Opportunity `By Stage` Kanban displays imported deals at its `NEW` stage; custom seller stages and multiple pipelines are later work.

## Observed workflow

1. **Upload CSV.** The page accepts a drag-and-drop file or file selection and says the next step matches columns to contact fields before anything is saved.
2. **Map source columns.** The source column names can vary. Completed-import details preserve the selected source-column → destination-field mappings and a count of mapped columns.
3. **Choose required fields.** Phone 1 is always required. The page says additional mapped fields, including first and last name, can be marked required; rows missing a marked field are skipped. A completed import's error table listed row numbers and the missing required fields.
4. **Import and review.** The history table shows filename/status, rows, unique numbers kept as contacts, mapped-column count, errors, duplicate/suppressed rows, upload time, and a Details action. Details shows rows, kept, skipped, errors, mapping, and row-level rejection reasons. History can indicate that an import was used by a campaign.

The reference UI calls the kept records **contacts**. It does not show a distinct Property object. It also does not expose the exact duplicate key, cross-file behavior, suppression rule, whether existing contacts are updated, or the full preview/commit controls. Those points must be specified for our CRM rather than inferred from the labels.

## Source fields exposed by the reference

| Destination key | Meaning | Observed requirement |
| --- | --- | --- |
| `phone` | Phone 1 | Required on every row |
| `first_name`, `last_name` | Homeowner name | Optional unless marked required during mapping |
| `property_address`, `property_city`, `property_state`, `property_zip` | Property location | Optional |
| `mailing_*` | Separate mailing address/city/state/ZIP | Optional |
| `phone_2`, `phone_3` | Other numbers | Optional |
| `email`, `offer`, `notes` | Contact detail and imported context | Optional |

One completed mapping used source columns named Phone 1, First Name, Last Name, Property/Street Address, City, State, and ZIP. Another completed mapping sent a source column labeled **Email** to `notes` and then rejected some rows for missing required notes. This demonstrates why our mapping review should call attention to suspicious source/destination pairs before import.

**No consent/permission-to-text field was shown.** A phone number present in a purchased or exported homeowner list is not evidence that it can receive Telnyx outreach. Keep the homeowner import and SMS eligibility as separate decisions; see [Telnyx notes](TELNYX.md).

## Further import design (beyond the first slice)

### Preview before commit

- Reuse Twenty's existing [spreadsheet import wizard](../../packages/twenty-front/src/modules/spreadsheet-import/steps/components/SpreadsheetImportStepperContainer.tsx) for upload, matching, and validation where possible. The current [object-record import hook](../../packages/twenty-front/src/modules/object-record/spreadsheet-import/hooks/useOpenObjectRecordsSpreadsheetImportDialog.ts) batch-upserts records of one object; a homeowner import may need coordinated Person, Property, and relationship writes plus durable import history.
- In preview, show source headers and sample values beside destination fields, count valid/invalid/duplicate/suppressed rows, allow “ignore column,” and highlight suspicious mappings such as Email → Notes or city → ZIP. Display the required-field choices before commit.
- Normalize phone numbers for matching (retain original value), validate state/ZIP/email format without silently discarding the source value, and show the affected rows. Do not silently overwrite a Person's current phone, email, or property data from a new file.
- Preserve the exact imported file/column schema and mapping version, but define retention for raw homeowner data. The import confirmation should state how many People, Properties, and Person–Property links will be created, updated, skipped, or sent for review.

### Record mapping

| Imported value | Initial target in Twenty | Longer-term model |
| --- | --- | --- |
| First/last name, phone(s), email | Person | Person identity and contact methods |
| Property address/city/state/ZIP | Property record and owner-role PersonProperty relation; Person `propertyAddress` remains a contact display field | Decide whether Person display address should follow a selected primary Property |
| Mailing address | Do not confuse with property address | Person mailing-address field, if needed |
| Offer/notes | Intake provenance or Note with source | An imported offer is not an accepted/current Opportunity offer |
| File membership | ImportBatch and MessageList/MessageListMember | Campaign audience snapshot and eligibility remain later work |
| SMS permission | Not present in the reference mapping | Separate PhoneConsent evidence and PhoneSuppression checks |

One Person may be tied to several properties, and one property may have several owners. Repeated phone numbers may represent a shared household, an old number, or a duplicate row. The first slice matches exactly one Person by normalized phone and sends multiple Person matches to review; it does not merge two People. A future campaign audience should retain the list/batch membership used when it was launched, even if a Person later changes details.

## Import records and later candidates

| Record | Main fields and purpose |
| --- | --- |
| ImportBatch (implemented) | Group name and MessageList relation, original filename, checksum, server payload digest, status, override flag, mapped-column count and row counts. The checksum is unique among active batches. |
| ImportRowResult (implemented) | Batch relation, source row number, normalized phone, outcome/reason, Person/Property/Opportunity IDs. `(batch, row number)` is unique among active results. |
| MessageList/MessageListMember (reused) | Named group and one Person membership per group for contacts resolved from the upload, including skipped duplicates. |
| ImportFieldMapping (later) | Persisted source header/index, destination field/subfield, required and ignored flags for reproducible mapping history. |
| Campaign audience snapshot (later) | Capture selected Person and phone eligibility at launch time; group membership alone is not a send authorization or frozen recipient list. |

Use workspace-scoped foreign keys and indexes for batch history, row outcomes, phone lookup, and address lookup. Apply the multi-record import in controlled batches with idempotency so a retry or browser interruption cannot duplicate homeowners. Reconcile counts from row outcomes rather than maintaining unrelated totals.

## Remaining decisions for a real sample file

1. What columns do your homeowner exports actually contain, including owner 2, mailing address, property identifiers, and multiple phone numbers?
2. How should the import map multiple owners in one source row, mailing addresses, parcel identifiers and secondary phone columns? The current mapping accepts one owner and one required phone and street address per row.
3. Should contacts without a valid phone or street address enter a separate property-only intake flow? The current import records them as errors.
4. What verified SMS consent evidence, if any, accompanies a list? Keep it separate from contact identity and group membership.
5. How long should original files, mapping metadata and row diagnostics be retained? The first slice stores filename and outcomes, not the full raw CSV.

## Reference inconsistencies / limits

- A history row showed a campaign-use label while its Details dialog said “Not yet.” Treat usage as a relationship to verify, not a field to copy blindly.
- The visible Details dialog lists missing-field errors, but did not explain individual duplicate or suppression decisions. The full duplicate algorithm and upload wizard remain unverified.
