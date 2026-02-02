# Teacher Portal

Small SvelteKit app to log in a teacher, add students, view them, and edit their details.

## Stack
- SvelteKit 2 with runes
- Tailwind CSS + Flowbite components
- Drizzle ORM (better-sqlite3)
- SQLite (`local.db`)

## Setup
```sh
pnpm install
pnpm dev
```

## Usage
- **Login**: Go to `/logged-out/login` and sign in as the seeded teacher `Dvir` with ID number `000000000`.
- **Add student**: Navigate to `/logged-in/add-student`, fill name, class, phone number, and submit.
- **View students**: Visit `/logged-in/students` to see all students fetched from SQLite.
- **Edit students**: On `/logged-in/students`, edit any field in the floating forms and save to update the database row.
- **Logout**: Use the header “Log out” button.

## Database
- Schema lives in `src/lib/server/db/schema.ts`, database file is `local.db`.
- Drizzle Studio: run `pnpm db:studio` to open a UI; use it to add more teachers if needed.

## Notes
- Only one teacher is seeded by default: `Dvir` / `000000000`; add more via Drizzle Studio or migrations.
- Session cookie key: `teacher_session`, stored alongside `teacher_sessions` table entries.
