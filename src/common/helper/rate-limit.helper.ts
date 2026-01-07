import { redis } from "@/common/redis/redis.client";

const MAX_ATTEMPTS = 5;
const PENALTY_STEPS = [60, 180, 300, 600]; // seconds

export async function handleAuthFailure(identifier: string, ip: string) {
    const attemptsKey = `auth_attempts:${identifier}:${ip}`;
    const penaltyKey = `auth_penalty:${identifier}:${ip}`;
    const blockKey = `auth_block:${identifier}:${ip}`;

    const attempts = await redis.incr(attemptsKey);

    if (attempts % MAX_ATTEMPTS === 0) {
        const penaltyLevel = await redis.incr(penaltyKey);

        const blockSeconds =
            PENALTY_STEPS[Math.min(penaltyLevel - 1, PENALTY_STEPS.length - 1)];

        await redis.set(blockKey, 'BLOCKED', 'EX', blockSeconds);
    }
}

export async function resetAuthLimits(identifier: string, ip: string) {
    await redis.del(
        `auth_attempts:${identifier}:${ip}`,
        `auth_penalty:${identifier}:${ip}`,
        `auth_block:${identifier}:${ip}`,
    );
}

export async function getActiveBlockTtl(identifier: string, ip: string): Promise<number> {
    const blockKey = `auth_block:${identifier}:${ip}`;
    return await redis.ttl(blockKey);
}
