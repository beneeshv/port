/**
 * ============================================================
 *  Portfolio Visitor Tracker
 * ============================================================
 *  A lightweight, non-blocking script that collects anonymous
 *  visitor analytics and logs them to a Google Sheet via
 *  Google Apps Script.
 *
 *  Features:
 *   • Collects browser, OS, screen, referrer, language & page
 *   • Fetches approximate location (city / country / IP)
 *   • Respects Do Not Track (DNT) — skips if enabled
 *   • Tracks only once per browser session (sessionStorage)
 *   • Non-blocking — all work is async, errors are silent
 *   • sendBeacon fallback for reliability on page unload
 *
 *  Usage:
 *   1. Replace TRACKING_ENDPOINT below with your deployed
 *      Google Apps Script Web App URL.
 *   2. Add <script src="visitor-tracker.js" defer></script>
 *      to every page you want to track.
 *
 *  See GOOGLE_SHEETS_SETUP.md for full backend setup guide.
 * ============================================================
 */

;(async function visitorTracker() {
  'use strict';

  // ── Configuration ────────────────────────────────────────
  // Replace the URL below with your deployed Google Apps Script Web App URL.
  // See GOOGLE_SHEETS_SETUP.md for instructions on how to get this URL.
  const TRACKING_ENDPOINT = 'YOUR_GOOGLE_APPS_SCRIPT_URL';

  const GEO_API            = 'https://ipapi.co/json/';
  const GEO_TIMEOUT_MS     = 3000;   // 3-second timeout for geolocation API
  const SESSION_KEY         = '_vt_tracked';

  // ── Guard: Do Not Track ──────────────────────────────────
  // Respect the visitor's privacy preference.
  if (
    navigator.doNotTrack === '1' ||
    window.doNotTrack   === '1' ||
    navigator.msDoNotTrack === '1'
  ) {
    return;
  }

  // ── Guard: Already tracked this session ──────────────────
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return;
  } catch {
    // sessionStorage may be unavailable (e.g. private browsing);
    // continue tracking — the worst case is a duplicate row.
  }

  // ── Guard: Endpoint not configured ───────────────────────
  if (
    !TRACKING_ENDPOINT ||
    TRACKING_ENDPOINT === 'YOUR_GOOGLE_APPS_SCRIPT_URL'
  ) {
    return; // silently bail — the user hasn't set it up yet
  }

  // ────────────────────────────────────────────────────────
  //  Helper: parse browser name & version from userAgent
  // ────────────────────────────────────────────────────────
  function parseBrowser(ua) {
    // Order matters — check more specific browsers first.
    const browsers = [
      { name: 'Edge',      pattern: /Edg(?:e|A|iOS)?\/(\S+)/            },
      { name: 'Opera',     pattern: /(?:OPR|Opera)\/(\S+)/              },
      { name: 'Samsung',   pattern: /SamsungBrowser\/(\S+)/             },
      { name: 'UCBrowser', pattern: /UCBrowser\/(\S+)/                  },
      { name: 'Brave',     pattern: /Brave\/(\S+)/                      },
      { name: 'Vivaldi',   pattern: /Vivaldi\/(\S+)/                    },
      { name: 'Firefox',   pattern: /Firefox\/(\S+)/                    },
      { name: 'Chrome',    pattern: /(?:Chrome|CriOS)\/(\S+)/           },
      { name: 'Safari',    pattern: /Version\/(\S+).*Safari/            },
      { name: 'IE',        pattern: /(?:MSIE |rv:)(\d+\.\d+)/          },
    ];

    for (const { name, pattern } of browsers) {
      const match = ua.match(pattern);
      if (match) return `${name} ${match[1]}`;
    }
    return 'Unknown';
  }

  // ────────────────────────────────────────────────────────
  //  Helper: parse operating system from userAgent
  // ────────────────────────────────────────────────────────
  function parseOS(ua) {
    const systems = [
      { name: 'Windows 11',  pattern: /Windows NT 10\.0.*Build\/(\d{5,})/ , minBuild: 22000 },
      { name: 'Windows 10',  pattern: /Windows NT 10\.0/                 },
      { name: 'Windows 8.1', pattern: /Windows NT 6\.3/                  },
      { name: 'Windows 8',   pattern: /Windows NT 6\.2/                  },
      { name: 'Windows 7',   pattern: /Windows NT 6\.1/                  },
      { name: 'macOS',       pattern: /Mac OS X ([\d_.]+)/               },
      { name: 'iOS',         pattern: /iPhone OS ([\d_]+)/               },
      { name: 'iPadOS',      pattern: /iPad.*OS ([\d_]+)/                },
      { name: 'Android',     pattern: /Android ([\d.]+)/                 },
      { name: 'Chrome OS',   pattern: /CrOS/                            },
      { name: 'Linux',       pattern: /Linux/                            },
    ];

    for (const { name, pattern, minBuild } of systems) {
      const match = ua.match(pattern);
      if (match) {
        // Distinguish Windows 11 by build number
        if (minBuild) {
          const build = parseInt(match[1], 10);
          if (build >= minBuild) return 'Windows 11';
          continue; // not Windows 11 — keep checking
        }
        // Append version if captured (e.g. "macOS 10_15_7")
        const version = match[1] ? ` ${match[1].replace(/_/g, '.')}` : '';
        return `${name}${version}`;
      }
    }
    return 'Unknown';
  }

  // ────────────────────────────────────────────────────────
  //  Helper: fetch geolocation with timeout
  // ────────────────────────────────────────────────────────
  async function fetchGeoData() {
    const fallback = { ip: 'Unknown', city: 'Unknown', country_name: 'Unknown' };

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), GEO_TIMEOUT_MS);

      const response = await fetch(GEO_API, {
        signal: controller.signal,
        // Avoid sending cookies or credentials
        credentials: 'omit',
      });

      clearTimeout(timer);

      if (!response.ok) return fallback;

      const data = await response.json();
      return {
        ip:           data.ip           || 'Unknown',
        city:         data.city         || 'Unknown',
        country_name: data.country_name || 'Unknown',
      };
    } catch {
      // Network error, timeout, or JSON parse failure
      return fallback;
    }
  }

  // ────────────────────────────────────────────────────────
  //  Helper: send data via fetch POST, with sendBeacon
  //  fallback if the page is being unloaded.
  // ────────────────────────────────────────────────────────
  function sendData(payload) {
    const json = JSON.stringify(payload);

    // Primary: fetch POST
    try {
      fetch(TRACKING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        // text/plain avoids a CORS preflight for cross-origin requests
        body: json,
        keepalive: true,          // allow the request to outlive the page
        credentials: 'omit',
      }).catch(() => {});         // swallow errors silently
    } catch {
      // If fetch itself throws (very unlikely), ignore it.
    }

    // Fallback: register sendBeacon for page unload
    if (navigator.sendBeacon) {
      const beaconHandler = () => {
        try {
          navigator.sendBeacon(
            TRACKING_ENDPOINT,
            new Blob([json], { type: 'text/plain' }),
          );
        } catch { /* silent */ }
      };

      // 'visibilitychange' is more reliable than 'beforeunload' on mobile
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') beaconHandler();
      }, { once: true });
    }
  }

  // ════════════════════════════════════════════════════════
  //  Main: collect data & send
  // ════════════════════════════════════════════════════════
  try {
    const ua = navigator.userAgent || '';

    // Kick off the geo fetch immediately (non-blocking)
    const geoPromise = fetchGeoData();

    // Collect browser-side data synchronously
    const visitorData = {
      timestamp:        new Date().toISOString(),
      browser:          parseBrowser(ua),
      os:               parseOS(ua),
      screenResolution: `${screen.width}x${screen.height}`,
      referrer:         document.referrer || 'Direct',
      pageUrl:          window.location.href,
      language:         navigator.language || 'Unknown',
    };

    // Await geo data (≤ 3 s, then falls back to 'Unknown')
    const geo = await geoPromise;

    visitorData.ip      = geo.ip;
    visitorData.city    = geo.city;
    visitorData.country = geo.country_name;

    // Send the payload
    sendData(visitorData);

    // Mark session as tracked
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch { /* storage might be full or blocked */ }

  } catch {
    // Final safety net — never let the tracker break the host page.
  }
})();
