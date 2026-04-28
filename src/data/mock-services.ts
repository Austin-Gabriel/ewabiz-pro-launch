/**
 * CANONICAL pro service-menu mock data. Each item is a single service
 * (no compound services with " + ") with a name, duration, and price.
 *
 * The Profile surface reads from this for the Services section. Future
 * Services tab will manage edits against the same source.
 */

export interface ProService {
  id: string;
  name: string;
  durationMin: number;
  priceUsd: number;
  description?: string;
}

export const PRO_SERVICES: ProService[] = [
  {
    id: "knotless-medium",
    name: "Knotless braids — medium",
    durationMin: 240,
    priceUsd: 220,
    description: "Mid-back length, includes parting and edges.",
  },
  {
    id: "knotless-long",
    name: "Knotless braids — long",
    durationMin: 300,
    priceUsd: 280,
  },
  {
    id: "feed-in",
    name: "Feed-in cornrows",
    durationMin: 120,
    priceUsd: 120,
  },
  {
    id: "stitch",
    name: "Stitch braids",
    durationMin: 150,
    priceUsd: 150,
  },
  {
    id: "takedown",
    name: "Take-down + wash",
    durationMin: 60,
    priceUsd: 60,
  },
];
