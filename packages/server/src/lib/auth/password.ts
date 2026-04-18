const PASSWORD_HASHING_ALGORITHM = "bcrypt";
const PASSWORD_HASHING_COST = 10;

export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, {
    algorithm: PASSWORD_HASHING_ALGORITHM,
    cost: PASSWORD_HASHING_COST,
  });
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return Bun.password.verify(password, passwordHash);
}
