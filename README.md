# Workout Progression Tracker (Offline)

Offline-first React-Native/Expo App zum Anlegen von Trainingsplaenen, Uebungen und Workouts - komplett ohne Backend.

## Ueberblick
- Offline-only: alle Daten liegen lokal in SQLite, kein Sync oder Backend.
- Trainingsplaene anlegen/entfernen, Uebungen hinzufuegen oder wiederverwenden, Workouts starten und Saetze erfassen.
- React Navigation Stack fuer die Screens, simples Theme in `src/ui/theme.js` und wiederverwendbare UI-Bausteine (`EmptyState`, `SkeletonList`).

## Schnellstart
1) Abhaengigkeiten: `npm install`
2) App starten: `npm start` (Expo Dev Tools), optional `npm run android` / `npm run ios`
3) Tests: `npm test`

## Architektur
```
UI (React Native Screens/Components)    -> src/ui
Hook + Container (DI)                   -> src/app/useServices.js, src/app/container.js
Domain (Use Cases, Ports, Entities)     -> src/domain
Data (Repository-Implementierungen)     -> src/data/repositories
Infrastructure (DB, Migrations, TX)     -> src/infrastructure/db
```
- UI: Screens in `src/ui/screens` konsumieren Services ueber `useServices()` (zustandsarm, Fokus auf Anzeige/Interaktion).
- App/Container: `src/app/container.js` bootet die DB, instanziiert Repositories und bindet sie an Domain-Use-Cases; `useServices` stellt sie der UI zur Verfuegung.
- Domain: einfache, framework-freie Use-Cases in `src/domain/usecases`, Ports in `src/domain/ports`, Entities als Plain Objects.
- Data: Repositories in `src/data/repositories/*` sprechen SQLite und implementieren die Ports (CRUD, Soft-Delete, Aggregationen).
- Infrastructure: `src/infrastructure/db/connection.js` oeffnet `workout-offline.db`, `transactions.js` kapselt Transaktionen, `migrations.js` verwaltet versionierte Schema-Aenderungen.
- Nutzer-Handling: `src/repositories/usersRepository.js` legt einen lokalen User an und haelt die User-ID in AsyncStorage (aktueller Legacy-Helfer, bis Domain-Layer erweitert wird).

## Datenmodell (Kurzfassung)
- `users`: lokaler Benutzer (Standard "Offline User"), Soft-Delete via `deletedAt`.
- `training_plans`: Kopfdatensaetze pro User.
- `exercises`: Uebungen mit Anzahl Sets, per Mapping an Trainingsplaene gekoppelt.
- `training_plan_exercises`: Mapping-Tabelle, verhindert Duplikate durch `UNIQUE(trainingPlanId, exerciseId)`.
- `workouts`: gestartete Trainings mit Zeitstempeln.
- `exercise_sets`: Saetze je Workout/Exercise (Reps, Gewicht).
- `outbox` und `sync_state`: vorbereitet fuer spaetere Sync-Logik (derzeit offline-only).
- `metadata`: haelt die aktuelle DB-Versionsnummer.
- Soft-Delete-Strategie: fast alle Tabellen besitzen `deletedAt` und `syncStatus`; Listen filtern konsequent `deletedAt IS NULL`.

## UX- und Produktprinzipien
- Schnelles Feedback: Skeleton-Listen beim Laden, Statusmeldungen statt Spinner.
- Klare Zustaende: Empty-States mit Call-to-Action, freundliche Fehlermeldungen.
- Wenig Taps: haeufige Aktionen als primaere Buttons, bestehende Uebungen wiederverwenden statt duplizieren.
- Offline-selbstbewusst: Texte betonen lokale Speicherung, keine Online-Abhaengigkeiten.
- Touch-first: grosse Targets, hohe Kontraste, reduzierte Hierarchie.

## Entwicklungstipps
- Neuen Use-Case bauen: Port definieren (`src/domain/ports`), Repository-Funktion implementieren (`src/data/repositories`), Use-Case in `src/domain/usecases` anlegen, dann im Container verdrahten und in der UI via `useServices` konsumieren.
- Datenbank aendern: Migration in `src/infrastructure/db/migrations.js` hinzufuegen (neue Versionsnummer), bestehende Daten migrieren und `metadata.db_version` setzen.
- UI erweitern: Theme aus `src/ui/theme.js` nutzen, gemeinsame Komponenten unter `src/ui/components` halten.

## Tests
- Jest/React Native Test Library: `npm test`
- Bei DB-Aenderungen: neuen Testfall fuer betroffene Repository/Use-Case-Logik ergaenzen.
