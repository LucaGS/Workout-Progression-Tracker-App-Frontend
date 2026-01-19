## Offline-Only Betrieb

- 100% lokal mit SQLite, keine Backend- oder Sync-Funktion.
- Trainingspläne, Übungen und Workouts sind sofort offline nutzbar.
- Einstellungen: Profil nur lokal; Logout dort.

## Architektur (Clean-ish)
- UI (`Components`, `src/ui`) → Domain Usecases → Repositories (Ports) → Data (SQLite Implementierungen) → Infrastructure (DB/Migrationen).
- Domain ist framework-frei (siehe `src/domain/usecases/*`, `src/domain/ports/*`).
- Data-Repos: `src/data/repositories/*` implementieren Ports gegen SQLite.
- Infrastruktur: `src/infrastructure/db/*` (Connection, Transactions, Migrationen).
- Wiring/Container: `src/app/container.js`, Hook `useServices` liefert Usecases in der UI.
- Single Source of Truth: SQLite; Soft-Delete konsequent.

## UX-Prinzipien (Projekt)
- Sofortiges Feedback: Status-Labels statt spinner; Skeletons beim Laden.
- Klare Zustände: leere Zustände mit Handlung, Fehlermeldungen menschlich.
- Wenig Taps: häufige Aktionen als primäre Buttons; bestehende Übungen direkt wiederverwendbar.
- Offline-Selbstbewusst: Keine Online-Texte, alle Hinweise betonen lokale Speicherung.
- Touch-first: große Buttons, hohe Kontraste, simple Hierarchie.

## Wichtige UX-Änderungen
- TrainingPlan-Übersicht: Empty-State mit CTA, Skeletons, klare Statuszeilen, Settings als einzige Sekundäraktion.
- TrainingPlan-Details: Bestehende Übungen wiederverwendbar (gleiche ID), leere Zustände mit CTA, Inline-Status; Start-Workout prominent.
- Workout: Keine Alerts, inline Status; klare Fehlertexte.
- Verläufe: Leere Zustände mit Erklärung, sanfte Ladeanzeige.
- Design-System: `src/ui/theme.js` + `Components/ui/EmptyState`, `SkeletonList` für konsistente Optik/Feedback.

## Tests
- `npm test -- --runInBand`
