# Running Dashboard

React and TypeScript dashboard for exploring running workout trends, with a Python utility for converting Garmin CSV exports into grouped chart data.

## Run locally

Requires Node.js 20.19+ or 22.12+ and npm.

```sh
cd dashboard
npm ci
npm run dev
```

## Production build

```sh
cd dashboard
npm run build
npm run preview
```

Production files are written to `dashboard/dist`. Serve the app at the domain root; data URLs currently use `/data/` paths.

## Repository layout

- `dashboard/src/`: React components, chart logic, and styles.
- `dashboard/public/data/`: bundled workout CSVs and the data-source manifest.
- `convert-running-csv.py`: CSV converter (Python 3.10+, standard library only).
- `archive/2025-2026.csv`: source export used by the converter's default command.

## Refresh workout data

From the repository root:

```sh
python convert-running-csv.py
```

This reads `archive/2025-2026.csv`, writes a local grouped archive and `dashboard/public/data/running-trends.csv`, and updates `sources.json`.

To add a separate dataset:

```sh
python convert-running-csv.py --input path/to/export.csv --source-id new-workouts --label "New workouts" --fe-output dashboard/public/data/new-workouts.csv --make-default
```

Use `python convert-running-csv.py --help` for all options. CSVs under `dashboard/public` are served to dashboard visitors.

Local fitness notes, training plans, historical visualizations, screenshots, dependencies, build output, and caches are excluded.
