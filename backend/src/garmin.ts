import type { Activity, Client, Range } from './sync.js';
const base = 'https://personal.connectapi.garmin.com';
export class GarminClient implements Client {
  private token?: string;
  constructor(private key: string) {}
  async page(range: Range, offset: number, limit: number): Promise<Activity[]> {
    if (!this.key) throw new Error('GARMIN_PERSONAL_API_KEY is required');
    if (!this.token) {
      const response = await fetch(`${base}/personalapitoken-service/personal-api/personal-api-key/token`, { method: 'POST', headers: { Authorization: `ApiKey ${this.key}` }, signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`Garmin authentication failed (HTTP ${response.status})`);
      this.token = (await response.text()).trim();
      if (!this.token) throw new Error('Garmin returned an empty token');
    }
    const query = new URLSearchParams({ start: String(offset), limit: String(limit), startDate: range.start, endDate: range.end, activityType: 'running' });
    const response = await fetch(`${base}/activitylist-service/activities/search/activities?${query}`, { headers: { Authorization: `Bearer ${this.token}` }, signal: AbortSignal.timeout(30000) });
    if (!response.ok) { if (response.status === 401) this.token = undefined; throw new Error(`Garmin activity request failed (HTTP ${response.status})`); }
    return await response.json() as Activity[];
  }
}
