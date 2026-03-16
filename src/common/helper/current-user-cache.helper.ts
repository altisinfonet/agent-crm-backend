import { redis } from '@/common/redis/redis.client';

const DEFAULT_USER_ME_CACHE_TTL_SECONDS = 300;
const MAX_USER_ME_CACHE_TTL_SECONDS = 3300;

function resolveUserMeCacheTtlSeconds() {
  const configuredTtl = Number.parseInt(
    process.env.USER_ME_CACHE_TTL_SECONDS ?? '',
    10,
  );

  if (!Number.isFinite(configuredTtl) || configuredTtl <= 0) {
    return DEFAULT_USER_ME_CACHE_TTL_SECONDS;
  }

  // Keep cache shorter than the 1-hour signed URL lifetime.
  return Math.min(configuredTtl, MAX_USER_ME_CACHE_TTL_SECONDS);
}

export const USER_ME_CACHE_TTL_SECONDS = resolveUserMeCacheTtlSeconds();

export const getCurrentUserCacheKey = (
  userId: bigint | number | string,
) => `user:me:${userId.toString()}`;

export async function getCachedCurrentUserResponse(
  userId: bigint | number | string,
) {
  try {
    return await redis.get(getCurrentUserCacheKey(userId));
  } catch (error) {
    console.error('[USER_ME_CACHE_GET_FAILED]', error);
    return null;
  }
}

export async function setCachedCurrentUserResponse(
  userId: bigint | number | string,
  response: string,
) {
  try {
    await redis.set(
      getCurrentUserCacheKey(userId),
      response,
      'EX',
      USER_ME_CACHE_TTL_SECONDS,
    );
  } catch (error) {
    console.error('[USER_ME_CACHE_SET_FAILED]', error);
  }
}

export async function clearCurrentUserCache(
  userId: bigint | number | string,
) {
  try {
    await redis.del(getCurrentUserCacheKey(userId));
  } catch (error) {
    console.error('[USER_ME_CACHE_CLEAR_FAILED]', error);
  }
}