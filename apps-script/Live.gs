/**
 * live.json publisher.
 * Guests' phones poll a static live.json on GitHub Pages instead of calling Apps Script,
 * so the 30-simultaneous-executions limit is never hit during events.
 *
 * Script Properties (all optional - publishing is skipped when GITHUB_TOKEN is missing):
 *   GITHUB_TOKEN   fine-grained PAT, this repo only, "Contents: Read and write"
 *   GITHUB_REPO    owner/repo, e.g. swosti/wedding
 *   GITHUB_BRANCH  default: main
 *   GITHUB_PATH    default: live.json
 */

const LIVE_THROTTLE_SECONDS = 60;

function livePayload_() {
  const s = settings_();
  const closed = isClosed_();
  const now = (getRituals_() || []).filter(r => r.status === 'now')[0] || null;
  const lb = publicLeaderboard_(leaderboard_());
  return {
	live: !closed && s['feature.live'] === 'TRUE' ? activeLive_() : null,
	ritual: now,
	teams: lb.teams,
	top: lb.top.slice(0, 5),
	closed: closed,
	freeze: freezeState_(s, new Date()),
	updatedAt: now_()
  };
}

/** Writes live.json to GitHub. force=false is throttled to once per LIVE_THROTTLE_SECONDS. Never throws. */
function publishLive_(force) {
  try {
	const props = PropertiesService.getScriptProperties();
	const token = props.getProperty('GITHUB_TOKEN'), repo = props.getProperty('GITHUB_REPO');
	if (!token || !repo) return false;
	const cache = CacheService.getScriptCache();
	if (!force && cache.get('live_pub')) return false;
	cache.put('live_pub', '1', LIVE_THROTTLE_SECONDS);
	const branch = props.getProperty('GITHUB_BRANCH') || 'main';
	const path = props.getProperty('GITHUB_PATH') || 'live.json';
	const url = 'https://api.github.com/repos/' + repo + '/contents/' + encodeURIComponent(path).replace(/%2F/g, '/');
	const headers = { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
	const cur = UrlFetchApp.fetch(url + '?ref=' + encodeURIComponent(branch), { headers: headers, muteHttpExceptions: true });
	const sha = cur.getResponseCode() === 200 ? JSON.parse(cur.getContentText()).sha : undefined;
	const body = {
	  message: 'live.json update',
	  content: Utilities.base64Encode(JSON.stringify(livePayload_(), null, 2), Utilities.Charset.UTF_8),
	  branch: branch
	};
	if (sha) body.sha = sha;
	const res = UrlFetchApp.fetch(url, { method: 'put', headers: headers, contentType: 'application/json', payload: JSON.stringify(body), muteHttpExceptions: true });
	const ok = res.getResponseCode() < 300;
	if (!ok) log_('live.publish.error', res.getResponseCode() + ' ' + res.getContentText().slice(0, 300));
	return ok;
  } catch (e) {
	try { log_('live.publish.error', String(e && e.message || e)); } catch (x) { }
	return false;
  }
}

/** Time trigger (installed by setup when GITHUB_TOKEN is set): keeps leaderboard totals in live.json fresh. */
function publishLiveTick() { publishLive_(false); }
