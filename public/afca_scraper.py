#!/usr/bin/env python3
"""
AFCA Published Decisions Scraper
=================================
Downloads ALL published decisions from the AFCA portal
from 15 June 2024 to today.

Usage:
    pip install requests beautifulsoup4
    python afca_scraper.py

Output:
    - afca_decisions.csv
    - afca_decisions.json
"""

import requests
import json
import csv
import time
import re
import sys
from datetime import datetime, date
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlencode

# ============================================================
# CONFIGURATION
# ============================================================
BASE_URL = "https://my.afca.org.au"
SEARCH_PAGE = "/searchpublisheddecisions/"
SEARCH_CONFIG_ID = "618b41fb-bdc0-ed11-83fe-000d3a6ad49b"
ARTICLE_BASE_URL = "https://my.afca.org.au/searchpublisheddecisions/kb/article/"

# Date range
DATE_FROM = "15/06/2024"  # DD/MM/YYYY
DATE_TO = date.today().strftime("%d/%m/%Y")

# Pagination
PAGE_SIZE = 100  # Max results per page
DELAY_BETWEEN_REQUESTS = 1.5  # Seconds between page requests (be polite)

# Output files
CSV_OUTPUT = "afca_decisions.csv"
JSON_OUTPUT = "afca_decisions.json"

# ============================================================
# HEADERS - mimic a real browser
# ============================================================
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-AU,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Referer": "https://my.afca.org.au/searchpublisheddecisions/",
}


def init_session():
    """Create a session and visit the search page to get cookies."""
    print("[1/4] Initializing session...")
    session = requests.Session()
    session.headers.update(HEADERS)

    # Visit the search page to establish session cookies
    resp = session.get(urljoin(BASE_URL, SEARCH_PAGE), timeout=30)
    resp.raise_for_status()
    print(f"      ✓ Session established. Cookies: {len(session.cookies)}")

    # Try to extract anti-forgery token
    soup = BeautifulSoup(resp.text, "html.parser")
    token_div = soup.find("div", id="antiforgerytoken")
    if token_div:
        token_url = token_div.get("data-url")
        if token_url:
            try:
                token_resp = session.get(urljoin(BASE_URL, token_url), timeout=15)
                print(f"      ✓ Anti-forgery token retrieved")
            except Exception:
                pass

    return session


def try_json_api(session, page_num=1):
    """Try the JSON API endpoint."""
    params = {
        "searchTerm": "",
        "pageNumber": str(page_num),
        "pageSize": str(PAGE_SIZE),
    }

    url = f"{BASE_URL}/_services/search/{SEARCH_CONFIG_ID}"

    # Try with Accept: application/json
    headers = {**HEADERS, "Accept": "application/json"}
    resp = session.get(url, params=params, headers=headers, timeout=30)

    if resp.status_code == 200:
        try:
            data = resp.json()
            if "results" in data or "d" in data:
                return data.get("d", data)
        except (json.JSONDecodeError, ValueError):
            pass

    return None


def try_search_with_dates(session, page_num=1):
    """Try search endpoint with date parameters."""
    params = {
        "q": "",
        "searchTerm": "",
        "pageNumber": str(page_num),
        "pageSize": str(PAGE_SIZE),
        "dateFrom": DATE_FROM,
        "dateTo": DATE_TO,
    }

    url = f"{BASE_URL}/_services/search/{SEARCH_CONFIG_ID}"
    resp = session.get(url, params=params, timeout=30)

    if resp.status_code == 200:
        # Try JSON
        try:
            data = resp.json()
            if "results" in data or "d" in data:
                return data.get("d", data)
        except (json.JSONDecodeError, ValueError):
            pass

        # Try HTML parsing
        return parse_html_results(resp.text)

    return None


def try_post_search(session, page_num=1):
    """Try POST-based search."""
    url = f"{BASE_URL}/_services/search/{SEARCH_CONFIG_ID}"

    # Get anti-forgery token if available
    token_resp = session.get(urljoin(BASE_URL, "/_layout/tokenhtml"), timeout=15)
    token = token_resp.text.strip() if token_resp.status_code == 200 else ""

    data = {
        "searchTerm": "",
        "pageNumber": str(page_num),
        "pageSize": str(PAGE_SIZE),
        "dateFrom": DATE_FROM,
        "dateTo": DATE_TO,
    }

    if token:
        data["__RequestVerificationToken"] = token

    headers = {
        **HEADERS,
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json, text/html, */*",
        "X-Requested-With": "XMLHttpRequest",
    }

    resp = session.post(url, data=data, headers=headers, timeout=30)

    if resp.status_code == 200:
        try:
            result = resp.json()
            if "results" in result or "d" in result:
                return result.get("d", result)
        except (json.JSONDecodeError, ValueError):
            pass

        return parse_html_results(resp.text)

    return None


def try_alternative_endpoints(session, page_num=1):
    """Try various alternative endpoint formats."""
    alternatives = [
        # Power Pages knowledge base search
        f"{BASE_URL}/_services/search/{SEARCH_CONFIG_ID}?searchTerm=&pageNumber={page_num}&pageSize={PAGE_SIZE}",
        # With date params in URL
        f"{BASE_URL}/_services/search/{SEARCH_CONFIG_ID}?searchTerm=&pageNumber={page_num}&pageSize={PAGE_SIZE}&dateFrom={DATE_FROM}&dateTo={DATE_TO}",
        # Alternate config format
        f"{BASE_URL}/api/search/{SEARCH_CONFIG_ID}?pageNumber={page_num}&pageSize={PAGE_SIZE}",
        # OData-style
        f"{BASE_URL}/_api/knowledgearticles?$filter=statecode eq 3&$top={PAGE_SIZE}&$skip={(page_num-1)*PAGE_SIZE}",
    ]

    for url in alternatives:
        try:
            resp = session.get(url, timeout=20)
            if resp.status_code == 200 and len(resp.text) > 100:
                try:
                    data = resp.json()
                    if isinstance(data, dict) and ("results" in data or "value" in data or "d" in data):
                        print(f"      ✓ Found working endpoint: {url[:80]}...")
                        return data.get("d", data)
                except (json.JSONDecodeError, ValueError):
                    results = parse_html_results(resp.text)
                    if results and results.get("results"):
                        print(f"      ✓ Found working endpoint (HTML): {url[:80]}...")
                        return results
        except Exception:
            continue

    return None


def parse_html_results(html_text):
    """Parse search results from HTML response."""
    soup = BeautifulSoup(html_text, "html.parser")
    results = []

    # Look for article links
    for link in soup.find_all("a", href=True):
        href = link["href"]
        if "/kb/article/" in href:
            article_id = href.split("/kb/article/")[-1].split("?")[0].split("#")[0]

            # Find the parent row/container
            parent = link.find_parent("tr") or link.find_parent("li") or link.find_parent("div")
            if not parent:
                continue

            text = parent.get_text(" ", strip=True)

            # Extract case number
            case_match = re.search(r"(\d{2}-\d{2}-\d{4,})", text)
            case_number = case_match.group(1) if case_match else ""

            # Extract date
            date_match = re.search(r"(\d{1,2}/\d{1,2}/\d{4})", text)
            resolution_date = date_match.group(1) if date_match else ""

            # Try to find firm name (usually in a specific pattern)
            firm = ""
            # Look for common firm name patterns
            firm_match = re.search(
                r"(?:^|\s)((?:[A-Z][a-zA-Z&'.\-]+\s)+(?:Pty\s+Ltd|Limited|Ltd|Bank|Insurance|Group|Mutual|Credit\s+Union|Superannuation))",
                text,
            )
            if firm_match:
                firm = firm_match.group(1).strip()

            results.append({
                "case_number": case_number,
                "financial_firm": firm,
                "resolution_date": resolution_date,
                "knowledge_article_id": article_id,
            })

    if results:
        return {"results": results, "total_count": len(results)}

    return None


def normalize_result(r):
    """Normalize a result dict to our standard format."""
    article_id = r.get("knowledge_article_id") or r.get("knowledgeArticleId") or r.get("article_id") or ""
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


def scrape_all_decisions():
    """Main scraping function."""
    print("=" * 60)
    print("AFCA Published Decisions Scraper")
    print("=" * 60)
    print(f"Date range: {DATE_FROM} → {DATE_TO}")
    print(f"Page size: {PAGE_SIZE}")
    print()

    # Step 1: Initialize session
    session = init_session()

    # Step 2: Find working endpoint and get first page
    print("\n[2/4] Searching for working API endpoint...")
    first_page = None
    total_count = 0

    # Try each method
    methods = [
        ("JSON API", lambda p: try_json_api(session, p)),
        ("Search with dates", lambda p: try_search_with_dates(session, p)),
        ("POST search", lambda p: try_post_search(session, p)),
        ("Alternative endpoints", lambda p: try_alternative_endpoints(session, p)),
    ]

    working_method = None
    for name, method in methods:
        print(f"      Trying: {name}...")
        result = method(1)
        if result and result.get("results"):
            first_page = result
            total_count = result.get("total_count", len(result["results"]))
            working_method = method
            print(f"      ✓ {name} works! Got {len(result['results'])} results (total: {total_count})")
            break
        else:
            print(f"      ✗ {name} returned no results")

    if not first_page:
        print("\n" + "=" * 60)
        print("ERROR: Could not find a working API endpoint.")
        print("=" * 60)
        print("""
The AFCA portal may require JavaScript rendering or additional
authentication. Try these alternatives:

1. USE PLAYWRIGHT (automated browser):
   pip install playwright
   playwright install chromium
   python afca_scraper_playwright.py

2. USE THE BROWSER CONSOLE METHOD:
   - Open https://my.afca.org.au/searchpublisheddecisions/
   - Open DevTools (F12) → Console
   - Paste the interceptor script from the web tool
   - Click Search and navigate all pages

3. CHECK IF THE PORTAL IS AVAILABLE:
   - Visit the URL manually to confirm it's working
   - Check if your IP is being blocked
""")
        sys.exit(1)

    # Step 3: Paginate through all results
    print(f"\n[3/4] Fetching all pages (estimated {((total_count - 1) // PAGE_SIZE) + 1} pages)...")
    all_results = []

    # Process first page
    for r in first_page["results"]:
        all_results.append(normalize_result(r))
    print(f"      Page 1: {len(first_page['results'])} results (total so far: {len(all_results)})")

    # Get remaining pages
    page_num = 2
    max_pages = (total_count // PAGE_SIZE) + 2  # Safety margin

    while len(all_results) < total_count and page_num <= max_pages:
        time.sleep(DELAY_BETWEEN_REQUESTS)

        try:
            result = working_method(page_num)
        except Exception as e:
            print(f"      ⚠ Error on page {page_num}: {e}")
            # Retry once
            time.sleep(3)
            try:
                result = working_method(page_num)
            except Exception:
                print(f"      ✗ Failed after retry. Stopping.")
                break

        if not result or not result.get("results"):
            print(f"      Page {page_num}: No more results")
            break

        page_results = result["results"]
        for r in page_results:
            all_results.append(normalize_result(r))

        print(f"      Page {page_num}: {len(page_results)} results (total so far: {len(all_results)})")

        if len(page_results) < PAGE_SIZE:
            break

        page_num += 1

    # Deduplicate by article ID
    seen = set()
    unique = []
    for d in all_results:
        key = d["knowledgeArticleId"] or d["caseNumber"]
        if key and key not in seen:
            seen.add(key)
            unique.append(d)
        elif not key:
            unique.append(d)

    print(f"\n      ✓ Total unique decisions: {len(unique)}")

    # Step 4: Save results
    print(f"\n[4/4] Saving results...")

    # JSON output
    output = {
        "meta": {
            "source": "AFCA Published Decisions",
            "dateFrom": DATE_FROM,
            "dateTo": DATE_TO,
            "scrapedAt": datetime.now().isoformat(),
            "totalCount": len(unique),
        },
        "decisions": unique,
    }

    with open(JSON_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"      ✓ Saved {JSON_OUTPUT}")

    # CSV output
    with open(CSV_OUTPUT, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["caseNumber", "financialFirm", "resolutionDate", "decisionUrl", "knowledgeArticleId"])
        writer.writeheader()
        writer.writerows(unique)
    print(f"      ✓ Saved {CSV_OUTPUT}")

    # Summary
    print("\n" + "=" * 60)
    print(f"✅ DONE! Downloaded {len(unique)} AFCA decisions")
    print("=" * 60)
    print(f"  📄 {CSV_OUTPUT}  (open in Excel)")
    print(f"  📋 {JSON_OUTPUT} (structured data)")
    print()


if __name__ == "__main__":
    try:
        scrape_all_decisions()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user.")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
