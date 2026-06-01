# Security Specification

## Data Invariants
1. `users` documents can only be created by the authenticated user whose `uid` matches the document ID. They can read and update only their own document.
2. `shops` documents can only be created by an authenticated user where `ownerUserId` equals their `uid`. They can read and update only their own shop.
3. `customers` documents can only be created, read, updated, or deleted by an authenticated user where `ownerUserId` equals their `uid`.
4. `credit_entries` documents can only be created, read, updated, or deleted by an authenticated user where `ownerUserId` equals their `uid`.
5. `payments` documents can only be created, read, updated, or deleted by an authenticated user where `ownerUserId` equals their `uid`.
6. `transactions` documents can only be created, read, updated, or deleted by an authenticated user where `ownerUserId` equals their `uid`.
7. `createdAt` must be `request.time` during creation, `updatedAt` must be `request.time` during update.

## Dirty Dozen Payloads

1. **Identity Spoofing**: Attempt to create a `shops` document with `ownerUserId` equal to someone else's ID.
2. **Access Violation**: Attempt to read a `customers` document where `ownerUserId` belongs to someone else.
3. **Escalation**: Attempt to change `ownerUserId` of an existing `customers` document to transfer ownership.
4. **Invalid Type**: Attempt to set `amount` in `credit_entries` to a string instead of a number.
5. **No Constraints**: Attempt to update a `credit_entries` document without a valid `updatedAt` timestamp.
6. **Shadow Update**: Attempt to inject an unapproved ghost field `isAdmin: true` into a `users` document.
7. **Bypass Rules**: Attempt a blanket list query for `shops` without evaluating `ownerUserId`.
8. **Size Limits**: Attempt to inject a massive string (1MB) as `name` into `customers`.
9. **Creation Timestamp**: Attempt to set `createdAt` in `payments` to a past date instead of `request.time`.
10. **Orphaned Write**: Attempt to write a transaction with an invalid structure (missing fields).
11. **Malicious ID**: Attempt to create a document with `.`, `/`, or `space` in its ID string.
12. **Update Tampering**: Attempt to change immutable fields `createdAt` during an update.

