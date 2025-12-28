/**
 * Entity Limits by User Tier
 */

export type UserTier = "free" | "creator" | "pro" | "business" | "enterprise";

export const ENTITY_LIMITS: Record<UserTier, number> = {
  free: 5,
  creator: 7,
  pro: 10,
  business: 10,
  enterprise: 10,
};

export const VISIBLE_ENTITY_LIMITS: Record<UserTier, number> = {
  free: 3,
  creator: 5,
  pro: 7,
  business: 7,
  enterprise: 10,
};

export function getEntityLimit(tier: UserTier = "free"): number {
  return ENTITY_LIMITS[tier] || ENTITY_LIMITS.free;
}

export function getVisibleLimit(tier: UserTier = "free"): number {
  return VISIBLE_ENTITY_LIMITS[tier] || VISIBLE_ENTITY_LIMITS.free;
}

/**
 * Get stagger delay for revealing entities beyond initial visible count
 */
export function getStaggerDelay(index: number, visibleLimit: number): number {
  if (index < visibleLimit) return 0;
  return (index - visibleLimit + 1) * 1500; // 1.5 seconds per additional entity
}
