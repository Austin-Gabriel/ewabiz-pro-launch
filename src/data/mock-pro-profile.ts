/**
 * CANONICAL pro-profile mock data. Single source of truth for the Profile
 * surface (header, about, location, social, certificate, visibility).
 *
 * Portfolio, services, and reviews live in their own canonical files
 * (mock-portfolio.ts, mock-services.ts, mock-reviews.ts). Don't duplicate.
 */

export type CertificateStatus = "none" | "pending" | "verified" | "rejected";
export type VisibilityStatus = "live" | "paused";

export interface ProProfile {
  displayName: string;
  /** Two-letter monogram fallback when no avatar photo. */
  initials: string;
  /** Optional avatar photo URL. */
  avatarUrl?: string;

  /** One-liner shown under the name. */
  headline: string;

  /** Editorial about paragraph. Optional. */
  about?: string;

  /** Neighborhood label, always safe to show clients. */
  neighborhood: string;
  /** Travel radius in miles. */
  travelRadiusMi: number;
  /** Full street address — pro sees this, preview hides it. */
  baseAddress: string;

  /** Specialization chips. */
  specializations: string[];

  /** Social media handles. Empty string = not linked. */
  social: {
    instagram?: string;
    tiktok?: string;
  };

  /** Cosmetology certificate status. */
  certificate: CertificateStatus;

  /** Listing visibility. */
  visibility: VisibilityStatus;

  /** Recurring availability summary, plain English. */
  availabilitySummary: string;
}

export const PRO_PROFILE: ProProfile = {
  displayName: "Amaka Okonkwo",
  initials: "AO",
  headline: "Braider in Bed-Stuy",
  about:
    "I learned to braid in my mother's salon in Lagos before moving to Brooklyn. My focus is protective styles that look effortless and last — knotless braids, feed-ins, and stitch work for everyday wear.",
  neighborhood: "Bed-Stuy",
  travelRadiusMi: 5,
  baseAddress: "412 Marcus Garvey Blvd, Brooklyn, NY 11216",
  specializations: ["Knotless braids", "Feed-ins", "Stitch braids", "Tribal"],
  social: {
    instagram: "amaka.braids",
    tiktok: "amakabraids",
  },
  certificate: "verified",
  visibility: "live",
  availabilitySummary: "Usually available Tue–Sat, mornings and afternoons",
};
