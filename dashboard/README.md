# Running Trend Dashboard

React + TypeScript dashboard for visualizing workouts from the backend API.

## Run

Start the backend separately, then:

```bash
npm install
npm run dev
```

The development server forwards `/api/workouts` to `http://127.0.0.1:3000/workouts`. Future production hosting must provide same-origin `/api` forwarding to the backend, stripping the `/api` prefix.

## Build

```bash
npm run build
```
