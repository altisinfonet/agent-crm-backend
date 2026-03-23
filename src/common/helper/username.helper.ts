export const USERNAME_MAX_LENGTH = 30;

const USERNAME_REGEX = /^(?!.*\.\.)(?!\.)(?!.*\.$)[a-z0-9._]{1,30}$/;

export function normalizeUsername(value: string) {
  return (value ?? '').trim().toLowerCase();
}

export function isValidUsername(value: string) {
  return USERNAME_REGEX.test(value);
}

export function sanitizeUsernameBase(
  ...parts: Array<string | null | undefined>
) {
  const rawValue = parts.filter(Boolean).join('_');

  let username = rawValue
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._]+/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/_+/g, '_')
    .replace(/^[_\.]+|[_\.]+$/g, '');

  username = trimUsername(username);

  return username || 'agent';
}

export function buildUsernameWithSuffix(base: string, suffix: string) {
  const normalizedBase = trimUsername(base) || 'agent';
  const normalizedSuffix = normalizeUsername(String(suffix)).replace(
    /[^a-z0-9]/g,
    '',
  );

  if (!normalizedSuffix) {
    return normalizedBase;
  }

  const maxBaseLength = Math.max(
    1,
    USERNAME_MAX_LENGTH - normalizedSuffix.length - 1,
  );
  const trimmedBase = trimUsername(normalizedBase.slice(0, maxBaseLength));

  return `${trimmedBase || 'agent'}_${normalizedSuffix}`;
}

async function isUsernameTaken(
  prisma: any,
  userName: string,
  excludeUserId?: bigint,
) {
  const existingUser = await prisma.user.findFirst({
    where: {
      user_name: userName,
      ...(excludeUserId !== undefined
        ? {
          id: {
            not: excludeUserId,
          },
        }
        : {}),
    },
    select: {
      id: true,
    },
  });

  return !!existingUser;
}

export async function generateUniqueUsername(
  prisma: any,
  firstName?: string | null,
  lastName?: string | null,
  excludeUserId?: bigint,
) {
  const baseUsername = sanitizeUsernameBase(firstName, lastName);

  if (!(await isUsernameTaken(prisma, baseUsername, excludeUserId))) {
    return baseUsername;
  }

  const seedSuffix =
    excludeUserId !== undefined
      ? excludeUserId.toString()
      : Date.now().toString();

  let counter = 0;
  while (counter < 100) {
    const suffix = counter === 0 ? seedSuffix : `${seedSuffix}${counter}`;
    const candidate = buildUsernameWithSuffix(baseUsername, suffix);

    if (!(await isUsernameTaken(prisma, candidate, excludeUserId))) {
      return candidate;
    }

    counter += 1;
  }

  return buildUsernameWithSuffix(baseUsername, Date.now().toString());
}

export async function assertUsernameAvailable(
  prisma: any,
  userName: string,
  excludeUserId?: bigint,
) {
  return !(await isUsernameTaken(prisma, userName, excludeUserId));
}

function trimUsername(value: string) {
  return value.slice(0, USERNAME_MAX_LENGTH).replace(/[_.]+$/g, '');
}
