/** Stable demo externalUserId values (UUID) for Paws & Tails seed users. */
export const DEMO_USER_WHISKERS_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
export const DEMO_USER_LISA_ID = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

/** Legacy string ids from early demos — migrated on DB open. */
export const LEGACY_DEMO_USER_IDS: Record<string, string> = {
  mews_wellington: DEMO_USER_WHISKERS_ID,
  bark_paulsen: DEMO_USER_LISA_ID,
};
