/**
 * CANONICAL portfolio mock data. Profile reads from this list.
 *
 * Photos are picsum URLs in mock; in production these would be Storage paths.
 * Order is the display order (lowest first). Density helpers below let the
 * Profile surface render Empty / Minimum / Robust based on dev-state.
 */

export interface PortfolioPhoto {
  id: string;
  url: string;
  alt: string;
  order: number;
}

const SEEDS = [
  "knotless-1", "feed-in-1", "stitch-1", "tribal-1", "boho-1",
  "color-1", "knotless-2", "feed-in-2", "stitch-2", "boho-2",
  "knotless-3", "tribal-2",
];

const ALT_TEXT: Record<string, string> = {
  "knotless-1": "Long knotless braids with caramel ends",
  "feed-in-1": "Feed-in cornrows in a halo pattern",
  "stitch-1": "Stitch braids with a low ponytail",
  "tribal-1": "Tribal braids with cuffs",
  "boho-1": "Boho braids with curly tendrils",
  "color-1": "Honey-blonde knotless braids",
  "knotless-2": "Mid-back knotless braids",
  "feed-in-2": "Side-swept feed-in braids",
  "stitch-2": "Geometric stitch design",
  "boho-2": "Boho braids in a half-up style",
  "knotless-3": "Bohemian knotless with curls",
  "tribal-2": "Tribal braids with beads",
};

export const PORTFOLIO_PHOTOS: PortfolioPhoto[] = SEEDS.map((seed, i) => ({
  id: seed,
  url: `https://picsum.photos/seed/${seed}/600/600`,
  alt: ALT_TEXT[seed] ?? "Braiding work",
  order: i,
}));

/** How many photos to show for a given dev data density. */
export type PortfolioDensity = "empty" | "minimum" | "robust";

export function portfolioForDensity(d: PortfolioDensity): PortfolioPhoto[] {
  if (d === "empty") return [];
  if (d === "minimum") return PORTFOLIO_PHOTOS.slice(0, 3);
  return PORTFOLIO_PHOTOS;
}
