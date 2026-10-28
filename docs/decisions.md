# MVP decision log

This log records agreed product decisions for the school attendance application, including their reasons and scope limits. It is not a backlog or an implementation specification.

## Reading and updating this log

All entries below are accepted decisions recorded on 2026-10-27. For future decisions, record the date, status, decision, reason, and consequences. When a decision changes, add a new entry and mark the previous entry as superseded, linking to its replacement.

## D001 — Android-first NFC attendance

- **Date:** 2026-10-27
- **Status:** Accepted
- **Decision:** Target Android for the MVP and use `react-native-nfc-manager` to read student wristband identifiers, described as UUIDs in the original request. Store attendance records in Supabase.
- **Reason:** These are the platform, NFC library, and storage service requested for the initial application.
- **Consequences:** iOS support is outside the MVP. This records the product choice, not a claim that these integrations are already implemented.

## D002 — One school and one shared account

- **Date:** 2026-10-27
- **Status:** Accepted
- **Decision:** Serve one school in the MVP. Teachers sign in through Supabase using one shared school account, without individual teacher accounts or roles.
- **Reason:** Keep the first version simple while retaining school-level sign-in.
- **Consequences:** Multi-school support and role management are outside the MVP. The shared account does not distinguish individual teachers.

## D003 — Internet required

- **Date:** 2026-10-27
- **Status:** Accepted
- **Decision:** Require an internet connection to record attendance directly in Supabase.
- **Reason:** Avoid offline storage and synchronization complexity in the first version.
- **Consequences:** Offline attendance recording and a pending-record synchronization queue are outside the MVP.

## D004 — Explicit entry and exit modes

- **Date:** 2026-10-27
- **Status:** Accepted
- **Decision:** The teacher selects Entry or Exit mode before scanning a wristband. Scans do not automatically alternate between entry and exit.
- **Reason:** Avoid interpreting a repeated scan as an automatic exit.
- **Consequences:** Each attendance scan uses the selected mode. Duplicate-scan handling is not defined by this decision.

## D005 — Three application sections

- **Date:** 2026-10-27
- **Status:** Accepted
- **Decision:** Provide a main scanning section with guidance on where to scan and recent scans, a section listing the day's entries and exits, and a wristband-linking section named "Vincular Pulsera".
- **Reason:** Support daily attendance recording, daily consultation, and initial wristband assignment within the application.
- **Consequences:** These are the agreed sections, not a detailed UI or navigation specification. The quoted linking-section name preserves the user's wording; other UI wording remains unspecified.

## D006 — Additional code for wristband linking

- **Date:** 2026-10-27
- **Status:** Accepted
- **Decision:** Require an additional simple code to access "Vincular Pulsera", intended for developers rather than teachers. Do not add a separate developer login; the normal school Supabase login remains in place.
- **Reason:** Restrict routine access to wristband assignment without introducing roles or another login flow.
- **Consequences:** Anyone who knows the code can use it; code knowledge does not verify developer identity. Code storage, validation, and recovery are not specified here.

## D007 — Link wristbands to existing students

- **Date:** 2026-10-27
- **Status:** Accepted
- **Decision:** Students are preloaded in Supabase. In the linking section, select an existing student and scan their wristband to associate it with that student.
- **Reason:** Enable wristband assignment without adding student management to the initial application.
- **Consequences:** Student creation and management are outside the MVP. Replacement and reassignment rules are not yet defined.
