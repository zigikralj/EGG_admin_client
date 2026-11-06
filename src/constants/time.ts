/**
 * Centralized time and React Query cache duration constants (in milliseconds).
 */

export const TIME_MS = {
  /** 1 second (1,000 ms) */
  ONE_SECOND: 1 * 1000,
  /** 5 seconds (5,000 ms) */
  FIVE_SECONDS: 5 * 1000,
  /** 15 seconds (15,000 ms) */
  FIFTEEN_SECONDS: 15 * 1000,
  /** 30 seconds (30,000 ms) */
  THIRTY_SECONDS: 30 * 1000,
  /** 1 minute (60,000 ms) */
  ONE_MINUTE: 1 * 60 * 1000,
  /** 2 minutes (120,000 ms) */
  TWO_MINUTES: 2 * 60 * 1000,
  /** 3 minutes (180,000 ms) */
  THREE_MINUTES: 3 * 60 * 1000,
  /** 5 minutes (300,000 ms) */
  FIVE_MINUTES: 5 * 60 * 1000,
  /** 10 minutes (600,000 ms) */
  TEN_MINUTES: 10 * 60 * 1000,
  /** 15 minutes (900,000 ms) */
  FIFTEEN_MINUTES: 15 * 60 * 1000,
  /** 30 minutes (1,800,000 ms) */
  THIRTY_MINUTES: 30 * 60 * 1000,
  /** 1 hour (3,600,000 ms) */
  ONE_HOUR: 60 * 60 * 1000,
  /** 9 hours (32,400,000 ms) */
  NINE_HOURS: 9 * 60 * 60 * 1000,
  /** 1 day / 24 hours (86,400,000 ms) */
  ONE_DAY: 24 * 60 * 60 * 1000,
  /** 7 days (604,800,000 ms) */
  SEVEN_DAYS: 7 * 24 * 60 * 60 * 1000,
  /** 30 days (2,592,000,000 ms) */
  THIRTY_DAYS: 30 * 24 * 60 * 60 * 1000,
  /** 90 days (7,776,000,000 ms) */
  NINETY_DAYS: 90 * 24 * 60 * 60 * 1000,
} as const;

export const QUERY_CONFIG = {
  /** Default query stale time: 5 minutes (300,000 ms) */
  DEFAULT_STALE_TIME: 5 * 60 * 1000,
  /** Default number of retry attempts on query failure */
  DEFAULT_RETRY: 1,
} as const;

