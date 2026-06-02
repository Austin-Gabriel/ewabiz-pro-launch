import { useDevState } from "@/dev-state/dev-state-context";
import { activityForDensity, type ActivityEvent } from "./notifications-data";

export type PromoKind = "welcome" | "loyalty" | "bonus-earned" | "none";

export interface NotificationsView {
  promo: PromoKind;
  loyaltyCount: number;
  loyaltyTarget: number;
  bonusAmount: number;
  activity: ActivityEvent[];
  bellUnread: boolean;
  markRead: () => void;
}

const LOYALTY_TARGET = 20;
const BONUS_AMOUNT = 100;

/**
 * Single source of truth for the Notifications screen, the bell-icon unread
 * indicator, and the Earnings "Bonus earned" line item. All three surfaces
 * read from the same dev-state axes so a single toggle flip drives them in
 * sync.
 */
export function useNotifications(): NotificationsView {
  const { state, setBellUnread } = useDevState();

  // Resolve promo from explicit dev state or fall back to loyaltyCount logic.
  let promo: PromoKind;
  if (state.promoState === "none") promo = "none";
  else if (state.promoState === "welcome") promo = "welcome";
  else if (state.promoState === "bonus-earned") promo = "bonus-earned";
  else if (state.promoState === "loyalty") promo = "loyalty";
  else {
    // auto
    if (state.loyaltyCount >= LOYALTY_TARGET) promo = "bonus-earned";
    else promo = "loyalty";
  }

  const densityResolved = state.recentActivity === "auto" ? "few" : state.recentActivity;
  const activity = activityForDensity(densityResolved);

  // Bell unread: explicit override wins. Auto = unread when there is any
  // activity OR a bonus-earned promo card.
  let bellUnread: boolean;
  if (state.bellUnread === "unread") bellUnread = true;
  else if (state.bellUnread === "read") bellUnread = false;
  else bellUnread = activity.length > 0 || promo === "bonus-earned";

  const markRead = () => setBellUnread("read");

  return {
    promo,
    loyaltyCount: state.loyaltyCount,
    loyaltyTarget: LOYALTY_TARGET,
    bonusAmount: BONUS_AMOUNT,
    activity,
    bellUnread,
    markRead,
  };
}

export const LOYALTY_BONUS_AMOUNT = BONUS_AMOUNT;