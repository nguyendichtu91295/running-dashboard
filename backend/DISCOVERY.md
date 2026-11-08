# Garmin Personal API discovery

**Gate: BLOCKED (2026-11-08).** The supplied key could not be exchanged for an access token. Activity history and all dashboard fields remain unverified. A user decision is required before dependent implementation: check the key and its status with Garmin, then authorize a retry, or decide how to proceed if the required fields are unavailable. No data has been fabricated.

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

Do not start persistence, sync, mapping, or frontend integration until authentication, history, and every required field are verified or the user chooses a revised contract.
