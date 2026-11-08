// Experimental candidates, never production labels. FIT lap intensity is the sole
// segmentation signal; adjacent active laps may represent one sustained block.
export const RULE_VERSION = 'experimental-1';
const positive = x => typeof x === 'number' && Number.isFinite(x) && x > 0;
export function classify(activity, laps, error) {
  const duration = activity.movingDuration, hr = activity.averageHR === 255 ? null : activity.averageHR;
  const normalized = (laps ?? []).map(l => ({ seconds: positive(l.totalTimerTime) ? l.totalTimerTime : null, distanceMetres: positive(l.totalDistance) ? l.totalDistance : null, averageHR: positive(l.avgHeartRate) && l.avgHeartRate !== 255 ? l.avgHeartRate : null, intensity: ['active','rest','recovery'].includes(l.intensity) ? l.intensity : null }));
  const reasons = [];
  const candidates = new Set();
  const missing = !!error || !normalized.length || normalized.some(l => !l.seconds || (!l.intensity && !l.distanceMetres));
  const blocks = [];
  for (const l of normalized) {
    if (!l.intensity || !l.seconds) continue;
    if (blocks.at(-1)?.intensity === l.intensity) blocks.at(-1).seconds += l.seconds;
    else blocks.push({intensity:l.intensity, seconds:l.seconds});
  }
  const active = blocks.filter(b => b.intensity === 'active');
  const rests = blocks.filter(b => b.intensity === 'rest' || b.intensity === 'recovery');
  // A recovery is a 90–180 second lap slower than both adjacent laps.
  // This experimental relative-speed rule requires two such recoveries for intervals.
  const recoveries = [];
  for (let i=1; i<normalized.length-1; i++) {
    const p=normalized[i-1], r=normalized[i], n=normalized[i+1];
    if ([p,r,n].every(x=>x.seconds && x.distanceMetres) && r.seconds>=90 && r.seconds<=180 && r.distanceMetres/r.seconds < p.distanceMetres/p.seconds && r.distanceMetres/r.seconds < n.distanceMetres/n.seconds) recoveries.push(i);
  }
  const speedIntervals = recoveries.length>=2 && recoveries.some((x,j)=>j>0 && x===recoveries[j-1]+2 && normalized[x-1].seconds < 600 && normalized[x-2].seconds < 600 && normalized[x+1].seconds < 600);
  const boundary = duration === 3600 || normalized.some(l => l.seconds === 600 || l.seconds === 1200) || active.some(b => b.seconds === 600 || b.seconds === 1200);
  if (positive(duration) && duration > 3600) { candidates.add('long'); reasons.push('Moving time exceeds 60 minutes'); }
  if (speedIntervals || (active.length >= 2 && rests.length && active.every(b => b.seconds < 600) && rests.every(b => b.seconds >= 90 && b.seconds <= 180))) { candidates.add('interval'); reasons.push('Repeated efforts under 10 minutes with 90–180 second recoveries; inferred recoveries are slower than both neighboring laps'); }
  if (rests.length && active.some(b => b.seconds > 600 && b.seconds < 1200)) { candidates.add('tempo'); reasons.push('Active block spans 10–20 minutes, combining adjacent active laps'); }
  if (!candidates.size && !missing && positive(duration) && duration < 3600 && positive(hr) && hr < 150 && !rests.length && !recoveries.length) { candidates.add('easy'); reasons.push('Moving time under 60 minutes and average HR below 150; no detected structured blocks'); }
  const race = /\brace\b|marathon|\b\d+\s*k(?:m)?\s*(?:race|run)\b/i.test(String(activity.activityName ?? ''));
  if (race) reasons.push('Possible race title requires review');
  if (missing) reasons.push('FIT lap intensity or timing unavailable');
  if (!positive(duration) || !positive(hr)) reasons.push('Missing or invalid activity metrics');
  if (boundary) reasons.push('Exact rule boundary requires review');
  if (candidates.size > 1) reasons.push('Conflicting candidate evidence');
  if (!candidates.size) reasons.push('No supported candidate');
  const unresolved = race || boundary || missing || !positive(duration) || !positive(hr) || candidates.size !== 1;
  return { candidates:[...candidates], proposed: unresolved ? null : [...candidates][0], unresolved, reasons, lapPattern: normalized, blocks };
}
export function matchActivities(activities, rows) {
  const key = (title,date) => `${String(title ?? '').trim().toLocaleLowerCase('en-US')}|${String(date ?? '').slice(0,10)}`;
  const counts = new Map();
  for (const a of activities) { const k=key(a.activityName,a.startTimeLocal); counts.set(k,(counts.get(k)??0)+1); }
  const index = new Map();
  for (const r of rows) { const k=key(r.Title,r.Date); index.set(k,[...(index.get(k)??[]),r]); }
  return activities.map(a => { const k=key(a.activityName,a.startTimeLocal), matches=index.get(k)??[]; return { status: !matches.length ? 'unmatched' : matches.length !== 1 || counts.get(k) !== 1 ? 'ambiguous' : 'matched', matches: matches.map(r=>({group:r['Workout Group'],type:r['Workout Type'],title:r.Title,date:r.Date})) }; });
}
