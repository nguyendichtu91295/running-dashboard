# Running Trend Dashboard

React + TypeScript dashboard for visualizing the grouped running CSV.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The app reads `public/data/running-trends.csv`.

Regenerate that file from the raw archive export:

```bash
cd ..
python3 convert-running-csv.py
```
