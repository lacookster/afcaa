#!/usr/bin/env python3
"""
AFCA Published Decisions Scraper — Playwright Version
======================================================
Uses a real browser (Chromium) to scrape the AFCA portal.
This is the MOST RELIABLE method because it handles JavaScript
rendering, cookies, and anti-bot measures automatically.

Setup:
    pip install playwright
    playwright install chromium

Usage:
    python afca_scraper_playwright.py

Output:
    - afca_decisions.csv
    - afca_decisions.json
"""

import json
import csv
import re
import sys
import time
from datetime import date, datetime

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
except ImportError:
    print("❌ Playwright not installed. Run:")
    print("   pip install playwright")
    print("   playwright install chromium")
    sys.exit(1)

# ============================================================
# CONFIGURATION
# ============================================================
PORTAL_URL = "https://my.afca.org.au/searchpublisheddecisions/"
ARTICLE_BASE_URL = "https://my.afca.org.au/searchpublisheddecisions/kb/article/"

DATE_FROM = "15/06/2024"
DATE_TO = date.today().strftime("%d/%m/%Y")

CSV_OUTPUT = "afca_decisions.csv"
JSON_OUTPUT = "afca_decisions.json"

# How long to wait for search results (seconds)
SEARCH_TIMEOUT = 60_000  # 60 seconds


def scrape_with_playwright():
    """Scrape AFCA decisions using a real browser."""
    print("=" * 60)
    print("AFCA Scraper — Playwright (Browser) Version")
    print("=" * 60)
    print(f"Date range: {DATE_FROM} → {DATE_TO}")
    print()

    all_decisions = []
    captured_api_responses = []

    with sync_playwright() as p:
        print("[1/5] Launching browser...")
        browser = p.chromium.launch(headless=False)  # Set True to run silently
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            viewport={"width": 1920, "height": 1080},
        )
        page = context.new_page()

        # Intercept network responses to capture API data
        def handle_response(response):
            url = response.url
            if "/_services/search/" in url:
                try:
                    body = response.text()
                    # Try JSON
                    try:
                        data = json.loads(body)
                        if "results" in data or "d" in data:
                            api_data = data.get("d", data)
                            captured_api_responses.append(api_data)
                            count = len(api_data.get("results", []))
                            print(f"      📦 API captured: {count} results")
                    except json.JSONDecodeError:
                        pass
                except Exception:
                    pass

        page.on("response", handle_response)

        # Step 2: Navigate to portal
        print("[2/5] Opening AFCA portal...")
        page.goto(PORTAL_URL, wait_until="networkidle", timeout=60_000)
        print("      ✓ Portal loaded")

        # Step 3: Fill in search form
        print("[3/5] Setting search parameters...")

        # Try to find and fill date fields
        try:
            # The portal might use various date input IDs
            date_from_selectors = [
                'input[name="dateFrom"]',
                'input[id="date_from"]',
                'input[id="dateFrom"]',
                'input[placeholder*="from" i]',
                'input[type="date"]',
            ]
            date_to_selectors = [
                'input[name="dateTo"]',
                'input[id="date_to"]',
                'input[id="dateTo"]',
                'input[placeholder*="to" i]',
            ]

            date_from_filled = False
            for sel in date_from_selectors:
                try:
                    el = page.locator(sel).first
                    if el.is_visible(timeout=2000):
                        el.fill(DATE_FROM)
                        date_from_filled = True
                        print(f"      ✓ Filled date from using: {sel}")
                        break
                except Exception:
                    continue

            if not date_from_filled:
                print("      ⚠ Could not find date-from field. Trying keyword search instead.")

            for sel in date_to_selectors:
                try:
                    el = page.locator(sel).first
                    if el.is_visible(timeout=2000):
                        el.fill(DATE_TO)
                        print(f"      ✓ Filled date to using: {sel}")
                        break
                except Exception:
                    continue

        except Exception as e:
            print(f"      ⚠ Error filling dates: {e}")

        # Step 4: Click search
        print("[4/5] Clicking Search...")
        search_selectors = [
            'button:has-text("Search")',
            'input[type="submit"][value="Search"]',
            'button#submitsearch',
            'button[id*="search" i]',
            'a:has-text("Search")',
        ]

        search_clicked = False
        for sel in search_selectors:
            try:
                el = page.locator(sel).first
                if el.is_visible(timeout=2000):
                    el.click()
                    search_clicked = True
                    print(f"      ✓ Clicked search using: {sel}")
                    break
            except Exception:
                continue

        if not search_clicked:
            print("      ⚠ Could not find search button. Waiting for page...")

        # Wait for results
        print("      Waiting for results to load...")
        time.sleep(5)

        # Wait for either results table or "no results" message
        try:
            page.wait_for_selector(
                'table, .kb-article, [class*="result"], [id*="result"]',
                timeout=SEARCH_TIMEOUT,
            )
            print("      ✓ Results loaded")
        except PlaywrightTimeout:
            print("      ⚠ Timeout waiting for results. Trying to extract anyway...")

        # Step 5: Extract data
        print("[5/5] Extracting decisions...")

        # First, check if we captured API responses
        if captured_api_responses:
            print(f"      Found {len(captured_api_responses)} API responses captured")
            for resp in captured_api_responses:
                results = resp.get("results", [])
                for r in results:
                    all_decisions.append(normalize_result(r))

        # Also extract from DOM as backup
        dom_decisions = extract_from_dom(page)
        if dom_decisions and not all_decisions:
            all_decisions = dom_decisions
            print(f"      Extracted {len(dom_decisions)} decisions from DOM")

        # Try to paginate through all results
        print("      Looking for pagination...")
        page_num = 1
        max_pages = 200  # Safety limit

        while page_num < max_pages:
            # Look for "Next" button
            next_selectors = [
                'button:has-text("Next")',
                'a:has-text("Next")',
                'button[aria-label="Next"]',
                'a[aria-label="Next page"]',
                '.pagination-next',
                '[class*="next"]',
            ]

            next_clicked = False
            for sel in next_selectors:
                try:
                    el = page.locator(sel).first
                    if el.is_visible(timeout=2000) and el.is_enabled(timeout=1000):
                        # Clear previous captures for this page
                        prev_count = len(captured_api_responses)
                        el.click()
                        next_clicked = True
                        page_num += 1
                        print(f"      📄 Page {page_num}...")
                        time.sleep(3)

                        # Wait for new data
                        page.wait_for_load_state("networkidle", timeout=15_000)

                        # Check for new API captures
                        if len(captured_api_responses) > prev_count:
                            new_resp = captured_api_responses[-1]
                            for r in new_resp.get("results", []):
                                all_decisions.append(normalize_result(r))
                        else:
                            # Extract from DOM
                            new_dom = extract_from_dom(page)
                            for d in new_dom:
                                if d not in all_decisions:
                                    all_decisions.append(d)
                        break
                except Exception:
                    continue

            if not next_clicked:
                print(f"      No more pages found. Stopped at page {page_num}.")
                break

        # Close browser
        browser.close()

    # Deduplicate
    seen = set()
    unique = []
    for d in all_decisions:
        key = d["knowledgeArticleId"] or d["caseNumber"]
        if key and key not in seen:
            seen.add(key)
            unique.append(d)
        elif not key:
            unique.append(d)

    print(f"\n      ✓ Total unique decisions: {len(unique)}")

    # Save
    save_results(unique)


def extract_from_dom(page):
    """Extract decisions from the current page DOM."""
    decisions = []

    # Try multiple extraction strategies
    strategies = [
        # Strategy 1: Table rows
        lambda: page.evaluate("""
            () => {
                const results = [];
                const rows = document.querySelectorAll('tr');
                rows.forEach(row => {
                    const link = row.querySelector('a[href*="/kb/article/"]');
                    if (link) {
                        const cells = Array.from(row.querySelectorAll('td')).map(c => c.innerText.trim());
                        const text = row.innerText;
                        const caseMatch = text.match(/\\d{2}-\\d{2}-\\d{4,}/);
                        const dateMatch = text.match(/(\\d{1,2}\\/\\d{1,2}\\/\\d{4})/);
                        results.push({
                            case_number: caseMatch ? caseMatch[0] : '',
                            financial_firm: cells[1] || cells[0] || '',
                            resolution_date: dateMatch ? dateMatch[1] : '',
                            knowledge_article_id: link.href.split('/kb/article/')[1].split('?')[0]
                        });
                    }
                });
                return results;
            }
        """),
        # Strategy 2: Article links in any container
        lambda: page.evaluate("""
            () => {
                const results = [];
                const links = document.querySelectorAll('a[href*="/kb/article/"]');
                links.forEach(link => {
                    const parent = link.closest('tr') || link.closest('li') || link.closest('div');
                    if (parent) {
                        const text = parent.innerText;
                        const caseMatch = text.match(/\\d{2}-\\d{2}-\\d{4,}/);
                        const dateMatch = text.match(/(\\d{1,2}\\/\\d{1,2}\\/\\d{4})/);
                        results.push({
                            case_number: caseMatch ? caseMatch[0] : '',
                            financial_firm: '',
                            resolution_date: dateMatch ? dateMatch[1] : '',
                            knowledge_article_id: link.href.split('/kb/article/')[1].split('?')[0]
                        });
                    }
                });
                return results;
            }
        """),
        # Strategy 3: Look for data in window variables
        lambda: page.evaluate("""
            () => {
                // Check for common data storage patterns
                if (window.__AFCA_DATA__) return window.__AFCA_DATA__;
                if (window.searchResults) return window.searchResults.results || [];
                if (window.kbResults) return window.kbResults;
                return [];
            }
        """),
    ]

    for strategy in strategies:
        try:
            results = strategy()
            if results and len(results) > 0:
                return [normalize_result(r) for r in results]
        except Exception:
            continue

    return []


def normalize_result(r):
    """Normalize a result dict to our standard format."""
    article_id = (
        r.get("knowledge_article_id")
        or r.get("knowledgeArticleId")
        or r.get("article_id")
        or ""
    )
    case_num = r.get("case_number") or r.get("caseNumber") or r.get("case_no") or ""
    firm = r.get("financial_firm") or r.get("financialFirm") or r.get("firm_name") or ""
    res_date = r.get("resolution_date") or r.get("resolutionDate") or r.get("date") or ""

    return {
        "caseNumber": case_num,
        "financialFirm": firm,
        "resolutionDate": res_date,
        "knowledgeArticleId": article_id,
        "decisionUrl": f"{ARTICLE_BASE_URL}{article_id}" if article_id else "",
    }


def save_results(decisions):
    """Save results to CSV and JSON."""
    print("\n[6/6] Saving results...")

    # JSON
    output = {
        "meta": {
            "source": "AFCA Published Decisions",
            "dateFrom": DATE_FROM,
            "dateTo": DATE_TO,
            "scrapedAt": datetime.now().isoformat(),
            "totalCount": len(decisions),
        },
        "decisions": decisions,
    }

    with open(JSON_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"      ✓ Saved {JSON_OUTPUT}")

    # CSV
    with open(CSV_OUTPUT, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "caseNumber",
                "financialFirm",
                "resolutionDate",
                "decisionUrl",
                "knowledgeArticleId",
            ],
        )
        writer.writeheader()
        writer.writerows(decisions)
    print(f"      ✓ Saved {CSV_OUTPUT}")

    print("\n" + "=" * 60)
    print(f"✅ DONE! Downloaded {len(decisions)} AFCA decisions")
    print("=" * 60)
    print(f"  📄 {CSV_OUTPUT}  (open in Excel)")
    print(f"  📋 {JSON_OUTPUT} (structured data)")


if __name__ == "__main__":
    try:
        scrape_with_playwright()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user.")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
