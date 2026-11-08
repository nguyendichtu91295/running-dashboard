# Garmin Personal API discovery

**Gate: PROVISIONALLY FEASIBLE (2026-11-08).** Authentication and one-year activity access now succeed after correcting a local credential placeholder. The one-year compatibility review below establishes promising coverage and identifies remaining validation work; earlier failed-attempt notes are historical.

## Live evidence

On 2026-11-08, a direct HTTPS POST to Garmin's documented `https://personal.connectapi.garmin.com/personalapitoken-service/personal-api/personal-api-key/token` endpoint used the supplied key in the documented `Authorization: ApiKey` header. Garmin returned HTTP 400. The response body and credentials were not recorded. No bearer token or activity response was obtained, so this is evidence of a live authentication failure, not a successful connection. The cause of the 400 is unverified.

## Sources and contract

- [Garmin Personal API FAQ](https://developer.garmin.com/gc-developer-program/personal/personal-faq): key exchange, token validity (24 hours or key expiry, whichever occurs first), and no refresh tokens; obtain a new token with the key.
- [Garmin Personal API overview](https://developer.garmin.com/gc-developer-program/): personal access includes activity JSON and FIT, pull delivery.
- [Garmin's Personal API client](https://github.com/garmin/connect-personal-api-python): official reference wrappers for activity search, details and downloads. Consult the [Personal API Swagger](https://developer.garmin.com/gc-developer-program/personal/) for definitive endpoint contracts.
- Local `dashboard/src/features/running-trends/utils/running-data.ts` rejects a row if any numeric field below is absent. It computes effort as moving minutes × (average HR / maximum HR)² × aerobic TE, and temperature as the mean of minimum and maximum Celsius.
- Local `convert-running-csv.py` groups by title substrings (10km race, Monday, Tuesday, Thursday, Saturday). Thursday uses max HR > 150 and aerobic TE > 3 to distinguish tempo from easy. It sorts by group, type, and date, then numbers progression within each group/type. Date, title, max HR, and aerobic TE are therefore needed to reproduce it.

## Capability and field matrix

Documented availability of activity JSON/FIT does not confirm a particular field, unit, historical range, or behavior for this account. All observed field statuses are unverified because authentication failed.

| Capability or field | Required contract | Evidence / status |
| --- | --- | --- |
| Authentication | Successful key exchange and authorized access | **Blocked**: token endpoint HTTP 400; no token obtained. |
| Activity history and incremental sync | Pull activities over requested dates, up to one year; identify new/changed records | Activity JSON/FIT and pull are documented; history range, update semantics and access unverified. |
| Pagination | Traverse all matching activities | Official client exposes start/limit search parameters; limits, ordering and completeness unverified. |
| Rate limits | Safe request frequency and retry behavior | Unverified; no numerical limit established. |
| Token lifecycle | Exchange key securely and renew | Documented 24 hours or key expiry, no refresh token; live exchange blocked. |
| Stable activity ID | Deduplication | Details/download addressed by activity ID in official client; stability and observed IDs unverified. |
| Aerobic training effect | Numeric for effort and Thursday classification | Unverified. |
| Distance | Kilometres | Unverified; source units and conversion unverified. |
| Average and maximum heart rate | Beats per minute | Unverified. |
| Moving time | Duration, converted to minutes | Unverified; distinction from elapsed/timer duration unverified. |
| Average pace | Minutes per kilometre | Unverified; source units or derivation from appropriate moving time and distance unverified. |
| Minimum and maximum temperature | Both degrees Celsius | Unverified; availability, source and units unverified. |
| Title and activity date/time | Title substring grouping, chronological progression and display | Unverified; timezone and title fidelity unverified. |
| Activity type | Select running activities | Search supports an activity-type filter in official client; values and behavior unverified. |
| Elapsed time | Dashboard display | Unverified; units unverified. |

The follow-up checks below supersede this initial blocked assessment. Verify field validity and units during implementation; seek a user decision for missing required data rather than fabricate values.

## Follow-up live check — 2026-11-08

This supersedes the authentication failure above: the initial local `.env` mistakenly contained a redaction placeholder. After correcting the local key, the official token exchange returned HTTP 200. An authenticated running-activity search (`start=0`, `limit=10`, `activityType=running`) returned HTTP 200 and 10 activities. One activity detail request also returned HTTP 200. No activity values, identifiers, tokens or keys are recorded here.

All 10 sampled search records contained non-null `activityId`, `activityName`, `startTimeLocal`, `distance`, `averageHR`, `maxHR`, `movingDuration`, `duration`, `averageSpeed`, `aerobicTrainingEffect`, `minTemperature`, `maxTemperature`, and `activityType`. This is encouraging evidence for the current dashboard contract, but does not prove units, field semantics, validity, availability in older activities, one-year date coverage, pagination completeness, rate limits or incremental-update behavior. A non-null value alone does not establish that the value is valid. Verify those before declaring full compatibility; missing fields require a user decision. Existing grouping/progression still needs converter parity verification.

## One-year compatibility review — 2026-11-08

A live, paginated running search over the preceding 365 days returned 156 activities in two pages. Every result had non-null, nonzero activity ID, title, local start time, distance, average and maximum heart rate, moving duration, elapsed duration, average speed, aerobic training effect, and min/max temperature. This establishes availability for this sample, not an API-wide guarantee.

Matching existing dashboard CSV records to API records by title and local calendar date yielded 129 unambiguous matches (one duplicate API title/date key exists elsewhere). With tolerance of 2% or 0.11 for numeric fields, distance converted from metres to kilometres and average heart rate matched 128/129; maximum heart rate, aerobic training effect, and both temperatures matched 129/129. With 2% or 3 seconds tolerance, moving time versus `movingDuration`, CSV `Time` versus API `duration`, and CSV average pace versus `1000 / averageSpeed` each matched 128/129. CSV `Time` matched `elapsedDuration` only 11/129; map it from `duration` for compatibility, subject to further validation. Discrepancies were not diagnosed, and title/date matches are not stable identifiers. Check duplicate/changed activities using Garmin activity IDs, not title/date.

The current converter classifies by title, not calendar weekday. Of 156 returned activities, title rules yielded 35 Monday, 38 Tuesday, 33 Thursday, 33 Saturday, 2 race, and 15 uncategorized. The dashboard charts only configured group/type combinations; uncategorized runs are not shown in those charts. Recreate converter classification and per-group/type chronological progression and recalculate on backfills. Format moving time as H:MM:SS and pace as M:SS; preserve existing CSV values/behavior until verified.

The sampled dataset supports a feasible mapping, but verification still needs investigation of mismatches, explicit API unit/rounding confirmation, history boundaries and changed-record behavior. Do not claim every future record has complete metrics or assume one year's pagination covers all later updates.
