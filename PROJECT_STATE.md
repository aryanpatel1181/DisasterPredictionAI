# Current state — portfolio refresh

## Implemented

- Responsive mint/charcoal observatory, illustrative orbital hero, real MapLibre event map.
- Observation versus research tabs, location search, category filter, selected event evidence, JSON download, and refresh interval.
- Project notes page for architecture and honest model limitations.
- Same-origin API proxy, clearer outage behavior, improved assistant accessibility and new-chat control.
- Synthetic model provenance labels, no fabricated source-health counters, two-minute ingestion cache.
- Standalone production containers, private services, rate-limited gateway, secret exclusion, and CI configuration.
- Upgraded frontend dependencies and zero-vulnerability npm audit at verification time.

## Verification limits

Passed locally: Next.js production build, TypeScript check, three API-proxy tests, npm audit (zero reported vulnerabilities), Python syntax compilation, and production Compose configuration validation. Automated Chromium checks passed for observation/research switching, event details, Escape dismissal, search, bundled map initialization, mobile overflow, and the methodology page. Browser checks use mocked event responses, not live provider verification.

Full backend execution is blocked in the inherited Windows environment by an Application Control rejection of a NumPy DLL. Docker Desktop's Linux engine was unavailable. Container execution and Linux CI still need to be verified before a public launch.

## Research limits

The model pipeline and location scoring use synthetic or illustrative inputs. Do not present those as validated hazard forecasts. The assistant in this checkout uses OpenRouter and preparedness context; it is not the separate 14-day weather implementation from the old folder.
