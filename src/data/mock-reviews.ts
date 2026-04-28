/**
 * CANONICAL client-review mock data. Profile reads from this list. Density
 * helpers map dev-state dataDensity to the visible review set.
 */

export interface ProReview {
  id: string;
  clientFirstInitial: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  /** ISO date. */
  date: string;
}

export const PRO_REVIEWS: ProReview[] = [
  {
    id: "r1",
    clientFirstInitial: "T",
    rating: 5,
    text: "Amaka took her time and the parting is perfection. My braids are still tight three weeks in.",
    date: "2026-04-18",
  },
  {
    id: "r2",
    clientFirstInitial: "J",
    rating: 5,
    text: "She came to me, set up like a real salon, and we chatted the whole time. Best braider I've had in NYC.",
    date: "2026-04-12",
  },
  {
    id: "r3",
    clientFirstInitial: "M",
    rating: 4,
    text: "Beautiful work. Took a little longer than quoted but worth it.",
    date: "2026-04-03",
  },
  {
    id: "r4",
    clientFirstInitial: "S",
    rating: 5,
    text: "Knotless braids that don't pull at all. I'm booking again.",
    date: "2026-03-28",
  },
  {
    id: "r5",
    clientFirstInitial: "R",
    rating: 5,
    text: "Hands down the best. Punctual, kind, and an artist.",
    date: "2026-03-19",
  },
  {
    id: "r6",
    clientFirstInitial: "K",
    rating: 5,
    text: "She fit me in last minute before a wedding and I got compliments all weekend.",
    date: "2026-03-10",
  },
  {
    id: "r7",
    clientFirstInitial: "D",
    rating: 4,
    text: "Lovely person, careful work. Highly recommend.",
    date: "2026-02-27",
  },
  {
    id: "r8",
    clientFirstInitial: "A",
    rating: 5,
    text: "Worth every dollar. My scalp didn't hurt at all.",
    date: "2026-02-14",
  },
  {
    id: "r9",
    clientFirstInitial: "L",
    rating: 5,
    text: "Stitch braids were exactly what I asked for. Repeat client.",
    date: "2026-02-02",
  },
  {
    id: "r10",
    clientFirstInitial: "C",
    rating: 5,
    text: "I'll never go anywhere else. She's the one.",
    date: "2026-01-21",
  },
];

export type ReviewDensity = "none" | "few" | "many";

export function reviewsForDensity(d: ReviewDensity): ProReview[] {
  if (d === "none") return [];
  if (d === "few") return PRO_REVIEWS.slice(0, 3);
  return PRO_REVIEWS;
}

/** Average rating across visible reviews, rounded to one decimal. */
export function averageRating(reviews: ProReview[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((a, r) => a + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}
