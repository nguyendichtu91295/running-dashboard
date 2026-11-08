#!/usr/bin/env python3
"""Convert a raw Garmin running CSV into the grouped dashboard CSV format."""

from __future__ import annotations

import argparse
import csv
import json
from collections import defaultdict
from datetime import datetime
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_INPUT = BASE_DIR / "archive" / "2025-2026.csv"
DEFAULT_ARCHIVE_OUTPUT = BASE_DIR / "archive" / "2025-2026-grouped.csv"
DEFAULT_FE_OUTPUT = BASE_DIR / "dashboard" / "public" / "data" / "running-trends.csv"
DEFAULT_SOURCES_MANIFEST = BASE_DIR / "dashboard" / "public" / "data" / "sources.json"

GROUP_ORDER = {
    "Monday": 1,
    "Tuesday": 2,
    "Thursday": 3,
    "Saturday": 4,
    "10km Race": 5,
    "Uncategorized": 99,
}

ADDED_HEADERS = ["Workout Group", "Workout Type", "Progression #"]


def slugify(value: str) -> str:
    slug = []
    previous_dash = False

    for char in value.lower():
        if char.isalnum():
            slug.append(char)
            previous_dash = False
        elif not previous_dash:
            slug.append("-")
            previous_dash = True

    return "".join(slug).strip("-") or "running-trends"


def parse_number(value: str | None) -> float:
    if value is None:
        return 0

    normalized = value.replace(",", "").strip()
    if not normalized or normalized == "--":
        return 0

    try:
        return float(normalized)
    except ValueError:
        return 0


def parse_date(value: str) -> datetime:
    return datetime.strptime(value, "%Y-%m-%d %H:%M:%S")


def classify(row: dict[str, str]) -> tuple[str, str]:
    title = row.get("Title", "").lower()
    max_hr = parse_number(row.get("Max HR"))
    aerobic_te = parse_number(row.get("Aerobic TE"))

    if "10km" in title and "race" in title:
        return "10km Race", "race"

    if "monday" in title:
        return "Monday", "easy run"

    if "tuesday" in title:
        return "Tuesday", "interval / tempo"

    if "thursday" in title:
        workout_type = "tempo" if max_hr > 150 and aerobic_te > 3 else "easy"
        return "Thursday", workout_type

    if "saturday" in title:
        return "Saturday", "long run"

    return "Uncategorized", "unclassified"


def build_grouped_rows(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    enriched = []
    for row in rows:
        group, workout_type = classify(row)
        enriched.append(
            {
                "date": parse_date(row["Date"]),
                "group": group,
                "row": row,
                "type": workout_type,
            }
        )

    enriched.sort(
        key=lambda item: (
            GROUP_ORDER.get(item["group"], 99),
            item["type"],
            item["date"],
        )
    )

    counters: dict[tuple[str, str], int] = defaultdict(int)
    grouped_rows = []
    for item in enriched:
        group = item["group"]
        workout_type = item["type"]
        counters[(group, workout_type)] += 1

        grouped_rows.append(
            {
                "Workout Group": group,
                "Workout Type": workout_type,
                "Progression #": str(counters[(group, workout_type)]),
                **item["row"],
            }
        )

    return grouped_rows


def read_raw_csv(input_path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with input_path.open(newline="", encoding="utf-8-sig") as file:
        reader = csv.DictReader(file)
        rows = list(reader)

    if reader.fieldnames is None:
        raise ValueError(f"No CSV header found in {input_path}")

    return reader.fieldnames, rows


def write_grouped_csv(
    output_path: Path,
    raw_headers: list[str],
    grouped_rows: list[dict[str, str]],
) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    headers = ADDED_HEADERS + raw_headers

    with output_path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=headers)
        writer.writeheader()
        writer.writerows(grouped_rows)


def read_manifest(manifest_path: Path) -> dict[str, object]:
    if not manifest_path.exists():
        return {"defaultSourceId": "", "sources": []}

    with manifest_path.open(encoding="utf-8") as file:
        manifest = json.load(file)

    if not isinstance(manifest, dict):
        return {"defaultSourceId": "", "sources": []}

    sources = manifest.get("sources")
    if not isinstance(sources, list):
        manifest["sources"] = []

    return manifest


def update_manifest(
    manifest_path: Path,
    source_id: str,
    label: str,
    csv_path: str,
    row_count: int,
    make_default: bool,
) -> None:
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest = read_manifest(manifest_path)
    sources = [
        source
        for source in manifest.get("sources", [])
        if isinstance(source, dict) and source.get("id") != source_id
    ]

    sources.append(
        {
            "id": source_id,
            "label": label,
            "path": csv_path,
            "rowCount": row_count,
        }
    )
    sources.sort(key=lambda source: str(source["label"]).lower())

    if make_default or not manifest.get("defaultSourceId"):
        manifest["defaultSourceId"] = source_id

    manifest["sources"] = sources

    with manifest_path.open("w", encoding="utf-8") as file:
        json.dump(manifest, file, indent=2)
        file.write("\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert raw running CSV into grouped dashboard CSV format."
    )
    parser.add_argument("--input", default=DEFAULT_INPUT, type=Path)
    parser.add_argument("--archive-output", default=DEFAULT_ARCHIVE_OUTPUT, type=Path)
    parser.add_argument(
        "--fe-output",
        default=None,
        type=Path,
        help="Grouped CSV path under dashboard/public/data. Defaults to data-source id.",
    )
    parser.add_argument(
        "--manifest",
        default=DEFAULT_SOURCES_MANIFEST,
        type=Path,
        help="Dashboard data-source manifest to update.",
    )
    parser.add_argument(
        "--source-id",
        default=None,
        help="Stable FE data-source id. Defaults to input filename.",
    )
    parser.add_argument(
        "--label",
        default=None,
        help="Display label for the FE source selector. Defaults to input filename.",
    )
    parser.add_argument(
        "--make-default",
        action="store_true",
        help="Set this source as the default selected FE source.",
    )
    parser.add_argument(
        "--skip-fe-output",
        action="store_true",
        help="Only write the archive grouped CSV.",
    )

    return parser.parse_args()


def main() -> None:
    args = parse_args()
    source_id = args.source_id or slugify(args.input.stem)
    label = args.label or args.input.stem
    fe_output = args.fe_output or DEFAULT_FE_OUTPUT

    raw_headers, raw_rows = read_raw_csv(args.input)
    grouped_rows = build_grouped_rows(raw_rows)

    write_grouped_csv(args.archive_output, raw_headers, grouped_rows)
    outputs = [args.archive_output]

    if not args.skip_fe_output:
        write_grouped_csv(fe_output, raw_headers, grouped_rows)
        outputs.append(fe_output)

        csv_path = f"/data/{fe_output.name}"
        update_manifest(
            args.manifest,
            source_id=source_id,
            label=label,
            csv_path=csv_path,
            row_count=len(grouped_rows),
            make_default=args.make_default,
        )
        outputs.append(args.manifest)

    print(f"Read {len(raw_rows)} rows from {args.input}")
    for output in outputs:
        if output.suffix == ".json":
            print(f"Updated manifest {output}")
        else:
            print(f"Wrote {len(grouped_rows)} rows to {output}")

    counts: dict[tuple[str, str], int] = defaultdict(int)
    for row in grouped_rows:
        counts[(row["Workout Group"], row["Workout Type"])] += 1

    for (group, workout_type), count in sorted(
        counts.items(), key=lambda item: (GROUP_ORDER.get(item[0][0], 99), item[0][1])
    ):
        print(f"{group} / {workout_type}: {count}")


if __name__ == "__main__":
    main()
