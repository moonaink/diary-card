# Card Model Tests

## Summary

Status: Active

Suites of the card model. Router: [TestSuiteMap.md](../Core/TestSuiteMap.md).

## Suites

### Dates

Files:

- `src/card/dates.test.ts`

Contract: weeks run Monday to Sunday, day arithmetic moves by calendar days across months, leap years and
daylight-saving changes, and only real calendar dates are accepted.

Canonical docs:

- [CardModel.md](../Systems/CardModel.md)

### Day entry

Files:

- `src/card/dayEntry.test.ts`

Contract: a blank value differs from 0, edits do not change the original entry and reject out-of-range values, the
stored form drops blank substance rows, and untrusted records are accepted or rejected with a reason.

Canonical docs:

- [CardModel.md](../Systems/CardModel.md)

### Week card

Files:

- `src/card/weekCard.test.ts`

Contract: the fill frequency thresholds, entries placed on their weekdays with empty and foreign entries ignored,
the order of substance suggestions, and the validation of week headers.

Canonical docs:

- [CardModel.md](../Systems/CardModel.md)
