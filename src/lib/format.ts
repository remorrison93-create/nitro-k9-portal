export function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

// Most programs vary lesson length by dog weight (30 min small dogs / 60 min large dogs), but
// some services — the assessment — are a fixed length regardless of dog size. Collapse the
// display to a single number when both fields already agree, instead of showing "60/60 min".
export function formatLessonLength(minutesSmall: number, minutesLarge: number) {
  return minutesSmall === minutesLarge
    ? `${minutesSmall} min`
    : `${minutesSmall} min (≤35 lbs) / ${minutesLarge} min (>35 lbs)`;
}
