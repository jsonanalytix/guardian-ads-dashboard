#!/usr/bin/env python3
"""
Google Ads → Supabase daily ETL.

Pulls performance data from the Google Ads API across 11 report types
and upserts into Supabase PostgreSQL tables. Designed to run as a daily
GitHub Actions cron job or manually with a custom date range.

Usage:
    python3 scripts/sync_google_ads.py                     # sync yesterday
    python3 scripts/sync_google_ads.py --date 2026-02-17   # sync specific date
    python3 scripts/sync_google_ads.py --date-from 2026-02-01 --date-to 2026-02-17

Required env vars:
    GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET,
    GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_CUSTOMER_ID,
    SUPABASE_URL, SUPABASE_SERVICE_KEY
"""

import os
import sys
import hashlib
import logging
import argparse
from datetime import datetime, timedelta, timezone
from statistics import median as _median
from typing import Any

from google.ads.googleads.client import GoogleAdsClient
from supabase import create_client, Client

try:
    from dotenv import load_dotenv

    load_dotenv()
    load_dotenv(".env.local", override=True)
except ImportError:
    pass

log = logging.getLogger("guardian_etl")
# Fix note (2026-02-19):
# Geographic sync now uses regional geo target IDs and resolves them
# to human-readable state names/codes, replacing country-level IDs.

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

CUSTOMER_ID = os.environ.get("GOOGLE_ADS_CUSTOMER_ID", "").replace("-", "")
SUPABASE_URL = (
    os.environ.get("SUPABASE_URL", "")
    or os.environ.get("VITE_SUPABASE_URL", "")
    or os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
)
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
BATCH_SIZE = 500

# ---------------------------------------------------------------------------
# Client factories
# ---------------------------------------------------------------------------


def _ga_client() -> GoogleAdsClient:
    return GoogleAdsClient.load_from_dict(
        {
            "developer_token": os.environ["GOOGLE_ADS_DEVELOPER_TOKEN"],
            "client_id": os.environ["GOOGLE_ADS_CLIENT_ID"],
            "client_secret": os.environ["GOOGLE_ADS_CLIENT_SECRET"],
            "refresh_token": os.environ["GOOGLE_ADS_REFRESH_TOKEN"],
            "use_proto_plus": True,
        }
    )


def _supa_client() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _micros(val: Any) -> float:
    """Google Ads cost fields are in micros (1/1,000,000 of currency unit)."""
    return int(val or 0) / 1_000_000


def _div(numerator: float, denominator: float) -> float:
    return numerator / denominator if denominator else 0.0


def _make_id(*parts: Any) -> str:
    """Deterministic 16-char hex hash from composite key parts."""
    raw = "|".join(str(p) for p in parts)
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def _ename(val: Any) -> str:
    """Proto-plus enum → uppercase string name."""
    return val.name if hasattr(val, "name") else str(val)


def _med(vals: list[float]) -> float:
    return _median(vals) if vals else 0.0


# ---------------------------------------------------------------------------
# Campaign name → Product / Intent Bucket
# (mirrors TypeScript inferProduct / inferIntentBucket in google-ads-csv.ts)
# ---------------------------------------------------------------------------


def infer_product(text: str) -> str:
    t = (text or "").lower()
    if any(k in t for k in ("termlife", "term life", "term-life", "life insurance")):
        return "Term Life"
    if "dental" in t:
        return "Dental Network"
    if any(k in t for k in ("disability", "idi")):
        return "Disability"
    if any(k in t for k in ("annuity", "annuities", "rila", "retirement")):
        return "Annuities"
    if any(k in t for k in ("recruit", "credential", "join", "provider")):
        return "Join Our Network"
    return "Other"


def infer_intent_bucket(text: str) -> str:
    t = (text or "").lower()
    has_nonbrand = any(
        k in t
        for k in (
            "nonbrand",
            "non-brand",
            "nonbranded",
            "non-branded",
        )
    )
    if "google_brand" in t or t.startswith("google_brand"):
        return "Brand"
    if not has_nonbrand and ("-brand-" in t or "-branded" in t or t.endswith("-branded")):
        return "Brand"
    if any(k in t for k in ("group", "employer", "worksite", "abm-")):
        return "Group"
    if any(k in t for k in ("leadgen", "conversion", "quote", "quotes")):
        return "Nonbrand Lead Gen"
    if any(k in t for k in ("midfunnel", "education", "alwayson", "traffic", "awareness")):
        return "Education/Midfunnel"
    return "Education/Midfunnel"


# ---------------------------------------------------------------------------
# Search-term classification
# (mirrors TypeScript classifySearchTerm in google-ads-csv.ts)
# ---------------------------------------------------------------------------


def _classify_search_term(
    spend: float, conversions: float, cpa: float, median_cpa: float
) -> tuple[str, str]:
    if conversions >= 1:
        if median_cpa == 0 or (cpa > 0 and cpa <= median_cpa * 0.8):
            return "winner", f"Converted ({conversions:.1f}) with efficient CPA (${cpa:,.2f})."
        return "neutral", f"Converted ({conversions:.1f}) but CPA above efficient threshold."
    if spend >= 100 and conversions == 0:
        return "loser", f"Spent ${spend:,.2f} with 0 conversions."
    return "neutral", f"Mixed signal (spend ${spend:,.2f}, conv {conversions:.1f})."


# ---------------------------------------------------------------------------
# Enum look-up tables
# ---------------------------------------------------------------------------

_STATUS_MAP = {"ENABLED": "enabled", "PAUSED": "paused", "REMOVED": "ended"}
_MATCH_MAP = {"EXACT": "Exact", "PHRASE": "Phrase", "BROAD": "Broad"}
_QS_RATING = {
    "ABOVE_AVERAGE": "Above Average",
    "AVERAGE": "Average",
    "BELOW_AVERAGE": "Below Average",
}
_DEVICE_MAP = {
    "MOBILE": "Mobile",
    "DESKTOP": "Desktop",
    "TABLET": "Tablet",
    "CONNECTED_TV": "Connected TV",
}
_DOW_MAP = {
    "MONDAY": "Monday",
    "TUESDAY": "Tuesday",
    "WEDNESDAY": "Wednesday",
    "THURSDAY": "Thursday",
    "FRIDAY": "Friday",
    "SATURDAY": "Saturday",
    "SUNDAY": "Sunday",
}

_US_STATE_CODE_BY_NAME = {
    "Alabama": "AL",
    "Alaska": "AK",
    "Arizona": "AZ",
    "Arkansas": "AR",
    "California": "CA",
    "Colorado": "CO",
    "Connecticut": "CT",
    "Delaware": "DE",
    "District of Columbia": "DC",
    "Florida": "FL",
    "Georgia": "GA",
    "Hawaii": "HI",
    "Idaho": "ID",
    "Illinois": "IL",
    "Indiana": "IN",
    "Iowa": "IA",
    "Kansas": "KS",
    "Kentucky": "KY",
    "Louisiana": "LA",
    "Maine": "ME",
    "Maryland": "MD",
    "Massachusetts": "MA",
    "Michigan": "MI",
    "Minnesota": "MN",
    "Mississippi": "MS",
    "Missouri": "MO",
    "Montana": "MT",
    "Nebraska": "NE",
    "Nevada": "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    "Ohio": "OH",
    "Oklahoma": "OK",
    "Oregon": "OR",
    "Pennsylvania": "PA",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    "Tennessee": "TN",
    "Texas": "TX",
    "Utah": "UT",
    "Vermont": "VT",
    "Virginia": "VA",
    "Washington": "WA",
    "West Virginia": "WV",
    "Wisconsin": "WI",
    "Wyoming": "WY",
}


def _lookup(table: dict, val: Any, fallback: str = "") -> str:
    return table.get(_ename(val), fallback)


# ---------------------------------------------------------------------------
# GAQL queries  ({date_condition} is injected at runtime)
# ---------------------------------------------------------------------------

GAQL: dict[str, str] = {}

GAQL["campaigns"] = """
    SELECT
        campaign.id, campaign.name, campaign.status,
        metrics.cost_micros, metrics.impressions, metrics.clicks,
        metrics.conversions, metrics.conversions_value,
        metrics.ctr, metrics.average_cpc,
        metrics.search_impression_share,
        metrics.search_budget_lost_impression_share,
        metrics.search_rank_lost_impression_share,
        segments.date
    FROM campaign
    WHERE {date_condition}
        AND campaign.advertising_channel_type = 'SEARCH'
"""

GAQL["keywords"] = """
    SELECT
        ad_group_criterion.criterion_id,
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        campaign.id, campaign.name,
        ad_group.id, ad_group.name,
        ad_group_criterion.quality_info.quality_score,
        ad_group_criterion.quality_info.search_predicted_ctr,
        ad_group_criterion.quality_info.creative_quality_score,
        ad_group_criterion.quality_info.post_click_quality_score,
        metrics.cost_micros, metrics.impressions, metrics.clicks,
        metrics.conversions, metrics.conversions_value,
        metrics.ctr, metrics.average_cpc,
        segments.date
    FROM keyword_view
    WHERE {date_condition}
        AND campaign.advertising_channel_type = 'SEARCH'
"""

GAQL["search_terms"] = """
    SELECT
        search_term_view.search_term,
        campaign.id, campaign.name,
        ad_group.id, ad_group.name,
        segments.keyword.info.match_type,
        metrics.cost_micros, metrics.impressions, metrics.clicks,
        metrics.conversions, metrics.conversions_value, metrics.ctr,
        segments.date
    FROM search_term_view
    WHERE {date_condition}
        AND campaign.advertising_channel_type = 'SEARCH'
        AND metrics.cost_micros > 0
"""

GAQL["ads"] = """
    SELECT
        ad_group_ad.ad.id,
        campaign.id, campaign.name,
        ad_group.id, ad_group.name,
        ad_group_ad.ad.responsive_search_ad.headlines,
        ad_group_ad.ad.responsive_search_ad.descriptions,
        ad_group_ad.ad_strength,
        metrics.cost_micros, metrics.impressions, metrics.clicks,
        metrics.conversions, metrics.conversions_value,
        metrics.ctr, metrics.average_cpc,
        segments.date
    FROM ad_group_ad
    WHERE {date_condition}
        AND campaign.advertising_channel_type = 'SEARCH'
        AND ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
"""

GAQL["geo_performance"] = """
    SELECT
        campaign.id,
        campaign.advertising_channel_type,
        segments.geo_target_region,
        geographic_view.country_criterion_id,
        geographic_view.location_type,
        metrics.cost_micros, metrics.impressions, metrics.clicks,
        metrics.conversions, metrics.conversions_value,
        metrics.ctr, metrics.average_cpc,
        segments.date
    FROM geographic_view
    WHERE {date_condition}
        AND campaign.advertising_channel_type = 'SEARCH'
        AND metrics.cost_micros > 0
"""

GAQL["device_performance"] = """
    SELECT
        campaign.id, segments.device,
        metrics.cost_micros, metrics.impressions, metrics.clicks,
        metrics.conversions, metrics.conversions_value,
        metrics.ctr, metrics.average_cpc,
        segments.date
    FROM campaign
    WHERE {date_condition}
        AND campaign.advertising_channel_type = 'SEARCH'
"""

GAQL["hourly_performance"] = """
    SELECT
        campaign.id,
        segments.hour, segments.day_of_week,
        metrics.cost_micros, metrics.impressions, metrics.clicks,
        metrics.conversions, metrics.conversions_value,
        segments.date
    FROM campaign
    WHERE {date_condition}
        AND campaign.advertising_channel_type = 'SEARCH'
        AND metrics.cost_micros > 0
"""

# Auction insights: competitor-level data is not directly available via
# standard GAQL. This query captures campaign-level search share metrics.
# For full competitor breakdowns, extend with the AuctionInsightService.
GAQL["auction_insights"] = """
    SELECT
        campaign.id, campaign.name,
        metrics.search_impression_share,
        metrics.search_top_impression_share,
        metrics.search_absolute_top_impression_share,
        segments.date
    FROM campaign
    WHERE {date_condition}
        AND campaign.advertising_channel_type = 'SEARCH'
        AND metrics.impressions > 0
"""

GAQL["quality_score_snapshots"] = """
    SELECT
        ad_group_criterion.criterion_id,
        ad_group_criterion.keyword.text,
        campaign.id, campaign.name,
        ad_group_criterion.quality_info.quality_score,
        ad_group_criterion.quality_info.search_predicted_ctr,
        ad_group_criterion.quality_info.creative_quality_score,
        ad_group_criterion.quality_info.post_click_quality_score,
        metrics.cost_micros,
        segments.date
    FROM keyword_view
    WHERE {date_condition}
        AND campaign.advertising_channel_type = 'SEARCH'
        AND ad_group_criterion.quality_info.quality_score IS NOT NULL
"""

GAQL["conversion_actions"] = """
    SELECT
        campaign.id, campaign.name,
        segments.conversion_action_name,
        segments.conversion_action_category,
        metrics.conversions, metrics.conversions_value,
        segments.date
    FROM campaign
    WHERE {date_condition}
        AND campaign.advertising_channel_type = 'SEARCH'
        AND metrics.conversions > 0
"""

GAQL["landing_pages"] = """
    SELECT
        campaign.advertising_channel_type,
        landing_page_view.unexpanded_final_url,
        metrics.clicks, metrics.impressions,
        metrics.conversions, metrics.conversions_value,
        metrics.cost_micros,
        segments.date
    FROM landing_page_view
    WHERE {date_condition}
        AND campaign.advertising_channel_type = 'SEARCH'
        AND metrics.cost_micros > 0
"""

# ---------------------------------------------------------------------------
# Transform functions  (Google Ads API rows → Supabase-ready dicts)
# ---------------------------------------------------------------------------


def _xf_campaigns(rows: list) -> list[dict]:
    out: list[dict] = []
    for r in rows:
        spend = _micros(r.metrics.cost_micros)
        convs = float(r.metrics.conversions)
        conv_val = float(r.metrics.conversions_value)
        clicks = int(r.metrics.clicks)
        out.append(
            {
                "id": str(r.campaign.id),
                "date": str(r.segments.date),
                "campaign_name": str(r.campaign.name),
                "product": infer_product(r.campaign.name),
                "intent_bucket": infer_intent_bucket(r.campaign.name),
                "status": _STATUS_MAP.get(_ename(r.campaign.status), "paused"),
                "spend": spend,
                "impressions": int(r.metrics.impressions),
                "clicks": clicks,
                "conversions": convs,
                "conversion_value": conv_val,
                "ctr": float(r.metrics.ctr),
                "cpc": _micros(r.metrics.average_cpc),
                "cpa": _div(spend, convs),
                "roas": _div(conv_val, spend),
                "conv_rate": _div(convs, clicks),
                "search_impression_share": float(r.metrics.search_impression_share or 0),
                "lost_is_budget": float(r.metrics.search_budget_lost_impression_share or 0),
                "lost_is_rank": float(r.metrics.search_rank_lost_impression_share or 0),
            }
        )
    return out


def _xf_keywords(rows: list) -> list[dict]:
    out: list[dict] = []
    for r in rows:
        spend = _micros(r.metrics.cost_micros)
        convs = float(r.metrics.conversions)
        clicks = int(r.metrics.clicks)
        out.append(
            {
                "id": str(r.ad_group_criterion.criterion_id),
                "date": str(r.segments.date),
                "keyword": str(r.ad_group_criterion.keyword.text),
                "match_type": _lookup(_MATCH_MAP, r.ad_group_criterion.keyword.match_type, "Broad"),
                "campaign_id": str(r.campaign.id),
                "campaign_name": str(r.campaign.name),
                "ad_group_id": str(r.ad_group.id),
                "ad_group_name": str(r.ad_group.name),
                "quality_score": int(r.ad_group_criterion.quality_info.quality_score or 0) or None,
                "expected_ctr": _lookup(
                    _QS_RATING, r.ad_group_criterion.quality_info.search_predicted_ctr
                ),
                "ad_relevance": _lookup(
                    _QS_RATING, r.ad_group_criterion.quality_info.creative_quality_score
                ),
                "landing_page_experience": _lookup(
                    _QS_RATING, r.ad_group_criterion.quality_info.post_click_quality_score
                ),
                "spend": spend,
                "impressions": int(r.metrics.impressions),
                "clicks": clicks,
                "conversions": convs,
                "conversion_value": float(r.metrics.conversions_value),
                "ctr": float(r.metrics.ctr),
                "cpc": _micros(r.metrics.average_cpc),
                "cpa": _div(spend, convs),
                "roas": _div(float(r.metrics.conversions_value), spend),
                "conv_rate": _div(convs, clicks),
            }
        )
    return out


def _xf_search_terms(rows: list) -> list[dict]:
    # Two-pass: collect base data, compute median CPA, then classify.
    base: list[tuple[float, float, float, Any]] = []
    for r in rows:
        spend = _micros(r.metrics.cost_micros)
        convs = float(r.metrics.conversions)
        cpa = _div(spend, convs)
        base.append((spend, convs, cpa, r))

    cpas = [cpa for _, convs, cpa, _ in base if convs > 0 and cpa > 0]
    median_cpa = _med(cpas)

    out: list[dict] = []
    for spend, convs, cpa, r in base:
        term = str(r.search_term_view.search_term)
        if not term:
            continue
        label, reason = _classify_search_term(spend, convs, cpa, median_cpa)
        out.append(
            {
                "id": _make_id(r.campaign.id, r.ad_group.id, term, _ename(r.segments.keyword.info.match_type)),
                "date": str(r.segments.date),
                "search_term": term,
                "campaign_id": str(r.campaign.id),
                "campaign_name": str(r.campaign.name),
                "ad_group_id": str(r.ad_group.id),
                "ad_group_name": str(r.ad_group.name),
                "match_type": _lookup(_MATCH_MAP, r.segments.keyword.info.match_type, "Broad"),
                "label": label,
                "reason": reason,
                "spend": spend,
                "impressions": int(r.metrics.impressions),
                "clicks": int(r.metrics.clicks),
                "conversions": convs,
                "conversion_value": float(r.metrics.conversions_value),
                "cpa": cpa,
                "ctr": float(r.metrics.ctr),
            }
        )
    return out


def _xf_ads(rows: list) -> list[dict]:
    out: list[dict] = []
    for r in rows:
        spend = _micros(r.metrics.cost_micros)
        headlines = [str(a.text) for a in (r.ad_group_ad.ad.responsive_search_ad.headlines or [])]
        descriptions = [
            str(a.text) for a in (r.ad_group_ad.ad.responsive_search_ad.descriptions or [])
        ]
        out.append(
            {
                "id": str(r.ad_group_ad.ad.id),
                "date": str(r.segments.date),
                "campaign_id": str(r.campaign.id),
                "campaign_name": str(r.campaign.name),
                "ad_group_id": str(r.ad_group.id),
                "ad_group_name": str(r.ad_group.name),
                "headlines": headlines,
                "descriptions": descriptions,
                "ad_strength": _ename(r.ad_group_ad.ad_strength),
                "spend": spend,
                "impressions": int(r.metrics.impressions),
                "clicks": int(r.metrics.clicks),
                "conversions": float(r.metrics.conversions),
                "conversion_value": float(r.metrics.conversions_value),
                "ctr": float(r.metrics.ctr),
                "cpc": _micros(r.metrics.average_cpc),
                "cpa": _div(spend, float(r.metrics.conversions)),
            }
        )
    return out


def _xf_geo_performance(rows: list) -> list[dict]:
    out: list[dict] = []
    for r in rows:
        spend = _micros(r.metrics.cost_micros)
        convs = float(r.metrics.conversions)
        clicks = int(r.metrics.clicks)
        region_resource = str(r.segments.geo_target_region or "")
        criterion_id = (
            region_resource.split("/")[-1]
            if region_resource
            else str(r.geographic_view.country_criterion_id or "")
        )
        out.append(
            {
                "id": _make_id(r.campaign.id, criterion_id or "unknown"),
                "date": str(r.segments.date),
                "campaign_id": str(r.campaign.id),
                "state": criterion_id,
                "state_code": criterion_id,
                "dma": _ename(r.geographic_view.location_type),
                "spend": spend,
                "impressions": int(r.metrics.impressions),
                "clicks": clicks,
                "conversions": convs,
                "conversion_value": float(r.metrics.conversions_value),
                "ctr": float(r.metrics.ctr),
                "cpc": _micros(r.metrics.average_cpc),
                "cpa": _div(spend, convs),
                "roas": _div(float(r.metrics.conversions_value), spend),
                "conv_rate": _div(convs, clicks),
            }
        )
    return out


def _geo_target_details(ga: GoogleAdsClient, criterion_ids: list[str]) -> dict[str, dict[str, str]]:
    """Resolve geo target criterion IDs to names and metadata."""
    if not criterion_ids:
        return {}

    resolved: dict[str, dict[str, str]] = {}
    # Keep query size bounded and avoid giant IN clauses.
    chunk_size = 200
    for i in range(0, len(criterion_ids), chunk_size):
        chunk = criterion_ids[i : i + chunk_size]
        id_list = ", ".join(chunk)
        query = f"""
            SELECT
                geo_target_constant.id,
                geo_target_constant.name,
                geo_target_constant.canonical_name,
                geo_target_constant.target_type,
                geo_target_constant.country_code
            FROM geo_target_constant
            WHERE geo_target_constant.id IN ({id_list})
        """
        rows = _run_gaql(ga, query)
        for row in rows:
            geo = row.geo_target_constant
            cid = str(geo.id)
            resolved[cid] = {
                "name": str(geo.name),
                "canonical_name": str(geo.canonical_name),
                "target_type": _ename(geo.target_type),
                "country_code": str(geo.country_code),
            }
    return resolved


def _enrich_geo_records(ga: GoogleAdsClient, records: list[dict]) -> list[dict]:
    """Attach human-readable state names/codes to geo performance rows."""
    criterion_ids = sorted(
        {
            str(r.get("state_code", "")).strip()
            for r in records
            if str(r.get("state_code", "")).strip().isdigit()
        }
    )
    details = _geo_target_details(ga, criterion_ids)

    for rec in records:
        raw_id = str(rec.get("state_code", "")).strip()
        info = details.get(raw_id)
        if not info:
            continue

        name = info["name"]
        country_code = info["country_code"]
        target_type = info["target_type"]
        canonical_name = info["canonical_name"]
        if country_code == "US" and target_type in {"State", "Province"}:
            rec["state"] = name
            rec["state_code"] = _US_STATE_CODE_BY_NAME.get(name, raw_id)
        else:
            rec["state"] = canonical_name or name
            rec["state_code"] = raw_id

        rec["dma"] = target_type

    return records


def _xf_device_performance(rows: list) -> list[dict]:
    out: list[dict] = []
    for r in rows:
        spend = _micros(r.metrics.cost_micros)
        convs = float(r.metrics.conversions)
        clicks = int(r.metrics.clicks)
        device = _lookup(_DEVICE_MAP, r.segments.device, "Other")
        out.append(
            {
                "id": _make_id(r.campaign.id, device),
                "date": str(r.segments.date),
                "campaign_id": str(r.campaign.id),
                "device": device,
                "spend": spend,
                "impressions": int(r.metrics.impressions),
                "clicks": clicks,
                "conversions": convs,
                "conversion_value": float(r.metrics.conversions_value),
                "ctr": float(r.metrics.ctr),
                "cpc": _micros(r.metrics.average_cpc),
                "cpa": _div(spend, convs),
                "roas": _div(float(r.metrics.conversions_value), spend),
                "conv_rate": _div(convs, clicks),
            }
        )
    return out


def _xf_hourly_performance(rows: list) -> list[dict]:
    out: list[dict] = []
    for r in rows:
        hour = int(r.segments.hour)
        dow = _lookup(_DOW_MAP, r.segments.day_of_week, _ename(r.segments.day_of_week))
        out.append(
            {
                "id": _make_id(r.campaign.id, hour, dow),
                "date": str(r.segments.date),
                "campaign_id": str(r.campaign.id),
                "hour": hour,
                "day_of_week": dow,
                "spend": _micros(r.metrics.cost_micros),
                "impressions": int(r.metrics.impressions),
                "clicks": int(r.metrics.clicks),
                "conversions": float(r.metrics.conversions),
                "conversion_value": float(r.metrics.conversions_value),
            }
        )
    return out


def _xf_auction_insights(rows: list) -> list[dict]:
    out: list[dict] = []
    for r in rows:
        out.append(
            {
                "id": _make_id(r.campaign.id, "self"),
                "date": str(r.segments.date),
                "campaign_id": str(r.campaign.id),
                "competitor": "You",
                "impression_share": float(r.metrics.search_impression_share or 0),
                "overlap_rate": None,
                "position_above_rate": None,
                "top_of_page_rate": float(r.metrics.search_top_impression_share or 0),
                "outranking_share": float(r.metrics.search_absolute_top_impression_share or 0),
            }
        )
    return out


def _xf_quality_score_snapshots(rows: list) -> list[dict]:
    out: list[dict] = []
    for r in rows:
        out.append(
            {
                "id": str(r.ad_group_criterion.criterion_id),
                "date": str(r.segments.date),
                "keyword_id": str(r.ad_group_criterion.criterion_id),
                "keyword": str(r.ad_group_criterion.keyword.text),
                "campaign_id": str(r.campaign.id),
                "product": infer_product(r.campaign.name),
                "quality_score": int(r.ad_group_criterion.quality_info.quality_score or 0),
                "expected_ctr": _lookup(_QS_RATING, r.ad_group_criterion.quality_info.search_predicted_ctr),
                "ad_relevance": _lookup(_QS_RATING, r.ad_group_criterion.quality_info.creative_quality_score),
                "landing_page_experience": _lookup(
                    _QS_RATING, r.ad_group_criterion.quality_info.post_click_quality_score
                ),
                "spend": _micros(r.metrics.cost_micros),
            }
        )
    return out


def _xf_conversion_actions(rows: list) -> list[dict]:
    out: list[dict] = []
    for r in rows:
        conv_type = str(r.segments.conversion_action_name or "")
        category = ""
        try:
            category = _ename(r.segments.conversion_action_category)
        except Exception:
            pass
        out.append(
            {
                "id": _make_id(r.campaign.id, conv_type),
                "date": str(r.segments.date),
                "campaign_id": str(r.campaign.id),
                "product": infer_product(r.campaign.name),
                "conversion_type": conv_type,
                "conversions": float(r.metrics.conversions),
                "conversion_value": float(r.metrics.conversions_value),
                "attribution": category,
            }
        )
    return out


def _xf_landing_pages(rows: list) -> list[dict]:
    out: list[dict] = []
    for r in rows:
        url = str(r.landing_page_view.unexpanded_final_url or "")
        if not url:
            continue
        clicks = int(r.metrics.clicks)
        convs = float(r.metrics.conversions)
        out.append(
            {
                "id": _make_id(url),
                "date": str(r.segments.date),
                "url": url,
                "sessions": clicks,  # approximation: sessions ≈ clicks
                "bounce_rate": None,  # not available from Google Ads; pull from GA4
                "conversion_rate": _div(convs, clicks),
                "conversions": convs,
                "conversion_value": float(r.metrics.conversions_value),
                "mobile_conv_rate": None,  # requires device-segmented landing page query
                "desktop_conv_rate": None,
            }
        )
    return out


# ---------------------------------------------------------------------------
# Entity registry
# ---------------------------------------------------------------------------

ENTITIES: dict[str, dict] = {
    "campaigns": {"query": GAQL["campaigns"], "transform": _xf_campaigns},
    "keywords": {"query": GAQL["keywords"], "transform": _xf_keywords},
    "search_terms": {"query": GAQL["search_terms"], "transform": _xf_search_terms},
    "ads": {"query": GAQL["ads"], "transform": _xf_ads},
    "geo_performance": {"query": GAQL["geo_performance"], "transform": _xf_geo_performance},
    "device_performance": {"query": GAQL["device_performance"], "transform": _xf_device_performance},
    "hourly_performance": {"query": GAQL["hourly_performance"], "transform": _xf_hourly_performance},
    "auction_insights": {"query": GAQL["auction_insights"], "transform": _xf_auction_insights},
    "quality_score_snapshots": {
        "query": GAQL["quality_score_snapshots"],
        "transform": _xf_quality_score_snapshots,
    },
    "conversion_actions": {"query": GAQL["conversion_actions"], "transform": _xf_conversion_actions},
    "landing_pages": {"query": GAQL["landing_pages"], "transform": _xf_landing_pages},
}

# ---------------------------------------------------------------------------
# Google Ads query execution
# ---------------------------------------------------------------------------


def _run_gaql(ga: GoogleAdsClient, query: str) -> list:
    service = ga.get_service("GoogleAdsService")
    rows: list = []
    stream = service.search_stream(customer_id=CUSTOMER_ID, query=query)
    for batch in stream:
        rows.extend(batch.results)
    return rows


# ---------------------------------------------------------------------------
# Supabase upsert (batched)
# ---------------------------------------------------------------------------


def _dedupe(records: list[dict]) -> list[dict]:
    """Keep last record per (id, date) to avoid Postgres upsert conflict."""
    seen: dict[tuple[str, str], int] = {}
    for idx, rec in enumerate(records):
        seen[(rec["id"], rec["date"])] = idx
    return [records[i] for i in sorted(seen.values())]


def _upsert(supa: Client, table: str, records: list[dict]) -> int:
    if not records:
        return 0
    records = _dedupe(records)
    total = 0
    for i in range(0, len(records), BATCH_SIZE):
        chunk = records[i : i + BATCH_SIZE]
        supa.table(table).upsert(chunk, on_conflict="id,date").execute()
        total += len(chunk)
    return total


# ---------------------------------------------------------------------------
# Sync orchestration
# ---------------------------------------------------------------------------


def _date_condition(date_from: str, date_to: str) -> str:
    """Build a GAQL WHERE clause for date filtering."""
    if date_from == date_to:
        return f"segments.date = '{date_from}'"
    return f"segments.date BETWEEN '{date_from}' AND '{date_to}'"


def sync(date_from: str | None = None, date_to: str | None = None) -> None:
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
    d_from = date_from or yesterday
    d_to = date_to or d_from
    date_cond = _date_condition(d_from, d_to)

    log.info("Guardian ETL: syncing %s → %s", d_from, d_to)

    ga = _ga_client()
    supa = _supa_client()

    sync_entry = {
        "started_at": datetime.now(timezone.utc).isoformat(),
        "status": "running",
        "records_synced": 0,
        "error_message": None,
    }
    sync_res = supa.table("sync_log").insert(sync_entry).execute()
    sync_id = sync_res.data[0]["id"] if sync_res.data else None

    total_records = 0
    errors: list[str] = []

    for name, cfg in ENTITIES.items():
        try:
            query = cfg["query"].format(date_condition=date_cond)
            log.info("  [%s] querying Google Ads …", name)
            rows = _run_gaql(ga, query)
            log.info("  [%s] %d API rows", name, len(rows))

            records = cfg["transform"](rows)
            if name == "geo_performance":
                records = _enrich_geo_records(ga, records)
            log.info("  [%s] %d records → Supabase", name, len(records))

            n = _upsert(supa, name, records)
            total_records += n
            log.info("  [%s] upserted %d rows", name, n)
        except Exception as exc:
            msg = f"{name}: {exc}"
            log.error("  [%s] FAILED — %s", name, exc, exc_info=True)
            errors.append(msg)

    # Finalise sync_log entry
    if sync_id:
        supa.table("sync_log").update(
            {
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "status": "error" if errors else "success",
                "records_synced": total_records,
                "error_message": "; ".join(errors) if errors else None,
            }
        ).eq("id", sync_id).execute()

    if errors:
        log.error("Completed with %d error(s): %s", len(errors), "; ".join(errors))
        sys.exit(1)

    log.info("Sync complete — %d total records across %d entities.", total_records, len(ENTITIES))


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(levelname)-7s  %(name)s  %(message)s",
    )

    parser = argparse.ArgumentParser(
        description="Sync Google Ads performance data into Supabase.",
    )
    parser.add_argument(
        "--date",
        help="Single date to sync (YYYY-MM-DD). Defaults to yesterday.",
    )
    parser.add_argument(
        "--date-from",
        help="Start of date range (YYYY-MM-DD).",
    )
    parser.add_argument(
        "--date-to",
        help="End of date range (YYYY-MM-DD). Requires --date-from.",
    )
    args = parser.parse_args()

    if args.date:
        sync(date_from=args.date, date_to=args.date)
    elif args.date_from:
        sync(date_from=args.date_from, date_to=args.date_to)
    else:
        sync()


if __name__ == "__main__":
    main()
