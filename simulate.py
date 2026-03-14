import sys, time, requests

BACKEND_URL = "https://discerning-emotion-production-57fd.up.railway.app"

SIGNALS = [
    "Investigated non-deterministic behaviour in SHA-256 block hash chain under concurrent write conditions causing integrity failures.",
    "Refactored NDJSON append logic to resolve race condition where simultaneous Slack signals were corrupting the prev_hash linkage.",
    "Explored cryptographic anchoring approach for audit trail immutability evaluating Merkle tree versus linear hash chain for HMRC defensibility.",
    "Debugged webhook signature verification failure under high-latency network conditions causing legitimate GitHub commits to be rejected.",
    "Researched jurisdiction-specific R&D eligibility thresholds for HMRC SME relief versus RDEC to determine correct recovery percentage logic.",
    "Prototyped AI-assisted signal classification using Claude Haiku to distinguish qualifying technological uncertainty from routine maintenance.",
    "Resolved memory leak in async block append function where unresolved promises were accumulating during high-frequency Slack signal ingestion.",
    "Evaluated S3 rehydration strategy for ephemeral Railway deployments to ensure forensic chain continuity across container restarts.",
    "Investigated velocity fraud detection thresholds to balance integrity with legitimate development activity on high-frequency engineering teams.",
    "Designed non-custodial paper key architecture using BIP39 wordlist to eliminate PII storage while maintaining deterministic vault identity.",
    "Resolved TypeScript strict mode errors in jurisdiction config typing causing runtime failures when unknown jurisdiction codes were passed.",
    "Prototyped PDF export pipeline using ReportLab to generate cryptographically anchored forensic bundles meeting HMRC submission standards.",
    "Investigated Stripe webhook signature verification edge case where raw body parsing was being corrupted by FastAPI middleware.",
    "Debugged S3 push failure under Railway ephemeral filesystem causing vault data loss on container redeploy without rehydration.",
    "Researched HMRC four-part technological uncertainty test criteria to ensure AI audit prompt generates defensible eligibility rationale.",
    "Resolved base58 encoding collision in trace ID generation under high concurrency causing duplicate IDs in the forensic ledger.",
    "Explored rate limiting strategy using in-memory store versus Redis for MVP single-instance Railway deployment constraints.",
    "Investigated IRS Section 41 qualified research expenditure calculation methodology to ensure accuracy of USD recovery value estimates.",
    "Prototyped GitHub friction scan entropy scoring algorithm weighted across five signals including revert rate and branch complexity.",
    "Debugged PDF layout overflow where integrity score paragraph was rendering outside page bounds on A4 format with long summaries.",
    "Resolved CORS preflight failure for PATCH jurisdiction endpoint caused by missing OPTIONS method in FastAPI middleware configuration.",
    "Investigated blockchain hash chain verification algorithm performance on vaults with over one thousand blocks using linear scan.",
    "Designed competent professional sign-off workflow to satisfy HMRC requirement for qualified technical reviewer before claim submission.",
    "Prototyped accrual engine safe-bet rate dictionary calibrated at GBP 400 per signal to under-promise and protect client expectations.",
    "Resolved Unicode encoding error in GitHub commit message processing causing friction scan to fail on non-ASCII author names.",
    "Investigated Stripe checkout session metadata handshake to ensure client_hash survives payment flow for automatic vault activation.",
    "Debugged admin authentication fallback vulnerability where hardcoded API key string was bypassing environment variable security requirement.",
    "Researched ZATCA corporate tax R&D relief criteria for Saudi Arabia jurisdiction to validate recovery percentage calculations.",
    "Explored ReportLab table overflow handling for AI audit breakdown with more than twenty eligible signals exceeding single page capacity.",
    "Resolved Next.js dynamic route parameter conflict between jurisdiction slug and dashboard page causing 404 on direct URL navigation.",
]

def simulate(client_hash):
    print(f"\nSovereign Vault — Demo Simulator")
    print(f"Target vault: {client_hash}")
    print(f"Sending {len(SIGNALS)} signals (rate limit: 20/min)")
    print("-" * 60)
    success = 0
    for i, signal in enumerate(SIGNALS, 1):
        # Pause for 61 seconds after every 19 signals to respect rate limit
        if i > 1 and (i - 1) % 19 == 0:
            print(f"\n⏳ Rate limit pause — waiting 61 seconds...\n")
            time.sleep(61)
        try:
            res = requests.post(
                f"{BACKEND_URL}/slack/friction/{client_hash}",
                data={"text": signal, "user_name": "Demo_CTO"},
                timeout=10
            )
            if res.status_code ==                success += 1
                print(f"[{i:02d}/{len(SIGNALS)}] ✓ Locked")
            else:
                print(f"[{i:02d}/{len(SIGNALS)}] ✗ {res.status_code}: {res.text[:60]}")
        except Exception as e:
            print(f"[{i:02d}/{len(SIGNALS)}] ✗ Error: {str(e)[:60]}")
        time.sleep(0.5)
    print("-" * 60)
    print(f"Done: {success}/{len(SIGNALS)} signals locked.")
    print(f"\nNext: run the AI audit from the admin panel.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 simulate.py <client_hash>")
        sys.exit(1)
    simulate(sys.argv[1])
