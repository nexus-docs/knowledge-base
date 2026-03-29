import type { UserACLContext, ContentACL, TierConfig, AccessCheckResult, TierVisibility } from "./types";

export type { UserACLContext, ContentACL, TierConfig, AccessCheckResult, TierVisibility };

// ─── Tier Registry ──────────────────────────────────
// Loaded from DB at startup, cached in memory.
// Fallback defaults if DB is unavailable (build time, tests).

const DEFAULT_TIERS: TierConfig[] = [
  { name: "public",            label: "Public",            rank: 0,   visibility: "public",    description: "Publicly visible to everyone" },
  { name: "client",            label: "Client",            rank: 10,  visibility: "protected", description: "Licensed extension customers" },
  { name: "partner",           label: "Partner",           rank: 20,  visibility: "protected", description: "qoliber agency partners" },
  { name: "gold_partner",      label: "Gold Partner",      rank: 30,  visibility: "protected", description: "Gold tier partners with roadmap access", color: "#f59e0b" },
  { name: "platinum_partner",  label: "Platinum Partner",  rank: 40,  visibility: "private",   description: "Platinum partners with full access", color: "#a855f7" },
  { name: "admin",             label: "Admin",             rank: 100, visibility: "private",   description: "Full system access" },
];

let tierCache: Map<string, TierConfig> | null = null;

export function setTierRegistry(tiers: TierConfig[]): void {
  tierCache = new Map(tiers.map((t) => [t.name, t]));
}

export function getTierRegistry(): Map<string, TierConfig> {
  if (!tierCache) {
    tierCache = new Map(DEFAULT_TIERS.map((t) => [t.name, t]));
  }
  return tierCache;
}

export function getTier(name: string): TierConfig | undefined {
  return getTierRegistry().get(name);
}

export function getTierRank(name: string): number {
  return getTier(name)?.rank ?? 0;
}

export function getTierVisibility(name: string): TierVisibility {
  return getTier(name)?.visibility ?? "protected";
}

export function getAllTiers(): TierConfig[] {
  return [...getTierRegistry().values()].sort((a, b) => a.rank - b.rank);
}

// ─── Access Check ───────────────────────────────────

/**
 * Check if a user can access a document.
 * Returns both the access decision and visibility mode.
 */
export function checkAccess(
  user: UserACLContext | { tier: string; extensions: string[] } | null,
  doc: ContentACL
): AccessCheckResult {
  const docTier = getTier(doc.access_tier);
  const docRank = docTier?.rank ?? 0;
  const visibility = docTier?.visibility ?? "protected";

  // Public content is accessible to everyone
  if (doc.access_tier === "public" || docRank === 0) {
    return { allowed: true, visibility: "public" };
  }

  // Anonymous users cannot access non-public content
  if (!user) {
    return { allowed: false, visibility, requiredTier: docTier };
  }

  // Resolve tierRank if not provided (backward compat for tests)
  const userRank = "tierRank" in user ? user.tierRank : getTierRank(user.tier);

  // User's tier rank meets or exceeds the doc's tier rank
  if (userRank >= docRank) {
    // For client-tier docs, only clients check extension gating.
    // Higher tiers (partner, admin) bypass extension checks.
    const clientRank = getTierRank("client");
    if (doc.access_tier === "client" && userRank === clientRank) {
      return checkExtensionAccess(user, doc, visibility, docTier);
    }
    return { allowed: true, visibility };
  }

  // User rank is below doc rank — but users at client rank or above
  // with the right extension can still access client-tier docs
  const clientRankForFallback = getTierRank("client");
  if (doc.access_tier === "client" && userRank >= clientRankForFallback) {
    return checkExtensionAccess(user, doc, visibility, docTier);
  }

  return { allowed: false, visibility, requiredTier: docTier };
}

function checkExtensionAccess(
  user: UserACLContext,
  doc: ContentACL,
  visibility: TierVisibility,
  docTier?: TierConfig
): AccessCheckResult {
  // If doc has explicit extensions list, check those
  if (doc.extensions.length > 0) {
    const hasExtension = doc.extensions.some((ext) => user.extensions.includes(ext));
    return hasExtension
      ? { allowed: true, visibility }
      : { allowed: false, visibility, requiredTier: docTier };
  }

  // If doc has a product field (not "platform"), check if user has matching permission
  if (doc.product && doc.product !== "platform") {
    const hasProduct = user.extensions.includes(doc.product);
    return hasProduct
      ? { allowed: true, visibility }
      : { allowed: false, visibility, requiredTier: docTier };
  }

  // No extensions and no specific product = any authenticated user can access
  return { allowed: true, visibility };
}

/**
 * Backward-compatible wrapper — returns boolean only.
 * Used by existing code that just needs allow/deny.
 */
export function canAccessDoc(
  user: UserACLContext | { tier: string; extensions: string[] } | null,
  doc: ContentACL
): boolean {
  return checkAccess(user, doc).allowed;
}

// ─── Search Filter ──────────────────────────────────

export function getAccessFilter(user: UserACLContext | { tier: string; extensions: string[] } | null): string {
  if (!user) {
    return 'access_tier = "public"';
  }

  const userRank = "tierRank" in user ? user.tierRank : getTierRank(user.tier);

  // Admin sees everything
  const adminTier = getTier("admin");
  if (adminTier && userRank >= adminTier.rank) {
    return "";
  }

  // Build filter: user can see all tiers with rank <= their rank
  const accessibleTiers = getAllTiers()
    .filter((t) => t.rank <= userRank)
    .map((t) => `"${t.name}"`);

  const tierFilter = `access_tier IN [${accessibleTiers.join(", ")}]`;

  // For extension-gated content, also check product/extension match
  if (user.extensions.length > 0) {
    const sanitized = user.extensions.map((e) => e.replace(/["\\]/g, ""));
    const extFilter = sanitized.map((e) => `"${e}"`).join(", ");

    return `${tierFilter} OR (access_tier = "client" AND (product IN [${extFilter}] OR extensions IN [${extFilter}]))`;
  }

  return tierFilter;
}

// ─── Helpers ────────────────────────────────────────

export function getUserACLContext(
  tierName: string,
  extensions: string[]
): UserACLContext {
  return {
    tier: tierName,
    tierRank: getTierRank(tierName),
    extensions,
  };
}
