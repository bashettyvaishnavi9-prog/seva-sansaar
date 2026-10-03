import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";
import { businesses as seedBusinesses } from "@/lib/businessData";
import { haversineKm } from "@/lib/geo/distance";
import { JAMSHEDPUR_REGION, isInJamshedpurRegion } from "@/lib/geo/jamshedpurRegion";
import {
  calculateHybridScore,
  type RankingMode,
} from "@/lib/geo/ranking";
import { listBusinessesInCity } from "@/lib/server/businessStore";
import type { BusinessRecord } from "@/lib/types/owner";
import type { NearbyProvidersResponse, ProviderSearchHit } from "@/lib/types/providerSearch";

const PLACEHOLDER_IMAGE =
  "https://images.pexels.com/photos/21812143/pexels-photo-21812143.jpeg?auto=compress&cs=tinysrgb&w=1200";

function coordsFromRecord(b: BusinessRecord): { lat: number; lng: number } | null {
  const a = b.serviceAreas?.[0];
  if (a && typeof a.lat === "number" && typeof a.lng === "number") {
    return { lat: a.lat, lng: a.lng };
  }
  return null;
}

function recordToHit(
  b: BusinessRecord,
  coords: { lat: number; lng: number },
  distanceKm: number,
  score: number
): ProviderSearchHit {
  const img = b.photoUrls?.[0] ?? PLACEHOLDER_IMAGE;
  return {
    source: "registered",
    id: b.id,
    slug: b.slug,
    name: b.name,
    category: b.category,
    locality: b.locality,
    city: b.city,
    rating: 4.5,
    reviews: 0,
    completionRate: 0.85,
    responseTimeMin: 45,
    priceRange: b.pricing || "On request",
    phone: b.phone,
    whatsapp: b.whatsapp,
    verified: b.verified,
    image: img,
    description: b.description,
    lat: coords.lat,
    lng: coords.lng,
    distanceKm,
    score,
  };
}

export async function GET(req: NextRequest) {

  const ip = getClientIp(req.headers);
  const limitResult = checkRateLimit(`providers-nearby:${ip}`, RATE_LIMITS.DEFAULT.max, RATE_LIMITS.DEFAULT.windowMs);
  if (!limitResult.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.toLowerCase();
    const city = searchParams.get("city") || "Jamshedpur";
    
    let lat = parseFloat(searchParams.get("lat") ?? "");
    let lng = parseFloat(searchParams.get("lng") ?? "");
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      lat = JAMSHEDPUR_REGION.center.lat;
      lng = JAMSHEDPUR_REGION.center.lng;
    }

    const rawRadius = parseFloat(searchParams.get("radiusKm") ?? "15");
    const radiusKm = Math.min(100, Math.max(1, Number.isFinite(rawRadius) ? rawRadius : 15));
    const category = searchParams.get("category");
    const mode = (searchParams.get("mode") ?? "recommended") as RankingMode;
    const safeMode: RankingMode = mode === "nearest" ? "nearest" : "recommended";

    let warning: string | undefined;
    if (!isInJamshedpurRegion(lat, lng)) {
      warning = `Location is outside ${city} service boundary. Results use distance from your point.`;
    }

    const registered = await listBusinessesInCity(city).catch(() => [] as BusinessRecord[]);
    const hits: ProviderSearchHit[] = [];

    // Process Seed Businesses
    for (const b of seedBusinesses) {
      if (!b.lat || !b.lng) continue;
      
      // Keyword filter
      if (q) {
        const match = b.name.toLowerCase().includes(q) || 
                      b.category.toLowerCase().includes(q) || 
                      b.description.toLowerCase().includes(q);
        if (!match) continue;
      }

      const d = haversineKm(lat, lng, b.lat, b.lng);
      if (d > radiusKm) continue;
      if (category && category !== "All" && b.category !== category) continue;

      hits.push({
        source: "seed",
        slug: b.slug,
        name: b.name,
        category: b.category,
        locality: b.locality,
        city: b.city,
        rating: b.rating,
        reviews: b.reviews,
        completionRate: b.completionRate,
        responseTimeMin: b.responseTimeMin,
        priceRange: b.priceRange,
        phone: b.phone,
        whatsapp: b.whatsapp,
        verified: b.verified,
        image: b.image,
        description: b.description,
        lat: b.lat,
        lng: b.lng,
        distanceKm: Math.round(d * 100) / 100,
        score: 0,
      });
    }

    // Process Registered Businesses
    for (const b of registered) {
      if (b.status === "rejected") continue;
      const c = coordsFromRecord(b);
      if (!c) continue;

      // Keyword filter
      if (q) {
        const match = b.name.toLowerCase().includes(q) || 
                      b.category.toLowerCase().includes(q) || 
                      b.description.toLowerCase().includes(q);
        if (!match) continue;
      }

      const d = haversineKm(lat, lng, c.lat, c.lng);
      if (d > radiusKm) continue;
      if (category && category !== "All" && b.category !== category) continue;

      hits.push(recordToHit(b, c, Math.round(d * 100) / 100, 0));
    }

    // Calculate Hybrid Scores
    for (const hit of hits) {
      hit.score = calculateHybridScore(
        hit.rating,
        hit.reviews,
        hit.distanceKm,
        safeMode
      );
    }

    // Resolve Sorting
    const results = safeMode === "nearest" 
      ? hits.sort((a, b) => a.distanceKm - b.distanceKm)
      : hits.sort((a, b) => b.score - a.score);

    const body: NearbyProvidersResponse = {
      center: { lat, lng },
      mode: safeMode,
      radiusKm,
      coldStart: false,
      region: city === "Jamshedpur" ? JAMSHEDPUR_REGION.name : city,
      results,
      warning,
    };

    return NextResponse.json(body);
  } catch (err: unknown) {
    const e = err as Error;
    console.error("[GET /api/providers/nearby] ERROR:", e?.message || e);
    return NextResponse.json(
      { error: "Failed to load nearby providers", detail: e?.message },
      { status: 500 }
    );
  }
}




