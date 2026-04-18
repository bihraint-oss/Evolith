import type {
  AccessTokenPayload,
  AuthTokens,
  EntityId,
  RefreshTokenPayload,
} from "@evolith/shared";
import { authTokenTypes } from "@evolith/shared";
import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";

export interface TokenIdentity {
  userId: EntityId;
  email: string;
}

export interface TokenServiceConfig {
  accessSecret: string;
  refreshSecret: string;
  accessTtl: string;
  refreshTtl: string;
}

export interface TokenService {
  issueAuthTokens: (identity: TokenIdentity) => Promise<AuthTokens>;
  signAccessToken: (identity: TokenIdentity) => Promise<string>;
  signRefreshToken: (identity: TokenIdentity) => Promise<string>;
  verifyAccessToken: (token: string) => Promise<AccessTokenPayload>;
  verifyRefreshToken: (token: string) => Promise<RefreshTokenPayload>;
}

const tokenPayloadSchema = z.object({
  sub: z.string().uuid(),
  email: z.string().email(),
  type: z.enum(authTokenTypes),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

const accessTokenPayloadSchema = tokenPayloadSchema.extend({
  type: z.literal("access"),
});

const refreshTokenPayloadSchema = tokenPayloadSchema.extend({
  type: z.literal("refresh"),
});

type ParsedAccessTokenPayload = z.output<typeof accessTokenPayloadSchema>;
type ParsedRefreshTokenPayload = z.output<typeof refreshTokenPayloadSchema>;

export class InvalidAuthTokenError extends Error {
  constructor(message = "Invalid auth token") {
    super(message);
    this.name = "InvalidAuthTokenError";
  }
}

const textEncoder = new TextEncoder();

function createSigningKey(secret: string): Uint8Array {
  return textEncoder.encode(secret);
}

async function signToken(
  identity: TokenIdentity,
  type: "access" | "refresh",
  secret: string,
  ttl: string,
): Promise<string> {
  return new SignJWT({
    email: identity.email,
    type,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(identity.userId)
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(createSigningKey(secret));
}

async function verifyToken<TPayload extends AccessTokenPayload | RefreshTokenPayload>(
  token: string,
  secret: string,
  schema: z.ZodType,
  mapPayload: (payload: z.output<z.ZodType>) => TPayload,
): Promise<TPayload> {
  try {
    const { payload } = await jwtVerify(token, createSigningKey(secret), {
      algorithms: ["HS256"],
    });
    const parsedPayload = schema.safeParse(payload);

    if (!parsedPayload.success) {
      throw new InvalidAuthTokenError("Token payload validation failed");
    }

    return mapPayload(parsedPayload.data);
  } catch (error) {
    if (error instanceof InvalidAuthTokenError) {
      throw error;
    }

    throw new InvalidAuthTokenError(
      error instanceof Error ? error.message : "Token verification failed",
    );
  }
}

function toAccessTokenPayload(
  payload: ParsedAccessTokenPayload,
): AccessTokenPayload {
  return {
    sub: payload.sub,
    email: payload.email,
    type: payload.type,
    ...(payload.iat === undefined ? {} : { iat: payload.iat }),
    ...(payload.exp === undefined ? {} : { exp: payload.exp }),
  };
}

function toRefreshTokenPayload(
  payload: ParsedRefreshTokenPayload,
): RefreshTokenPayload {
  return {
    sub: payload.sub,
    email: payload.email,
    type: payload.type,
    ...(payload.iat === undefined ? {} : { iat: payload.iat }),
    ...(payload.exp === undefined ? {} : { exp: payload.exp }),
  };
}

export function createTokenService(config: TokenServiceConfig): TokenService {
  return {
    async issueAuthTokens(identity) {
      const [accessToken, refreshToken] = await Promise.all([
        signToken(
          identity,
          "access",
          config.accessSecret,
          config.accessTtl,
        ),
        signToken(
          identity,
          "refresh",
          config.refreshSecret,
          config.refreshTtl,
        ),
      ]);

      return {
        accessToken,
        refreshToken,
        tokenType: "Bearer",
      };
    },
    async signAccessToken(identity) {
      return signToken(identity, "access", config.accessSecret, config.accessTtl);
    },
    async signRefreshToken(identity) {
      return signToken(
        identity,
        "refresh",
        config.refreshSecret,
        config.refreshTtl,
      );
    },
    async verifyAccessToken(token) {
      return verifyToken(
        token,
        config.accessSecret,
        accessTokenPayloadSchema,
        (payload) => toAccessTokenPayload(payload as ParsedAccessTokenPayload),
      );
    },
    async verifyRefreshToken(token) {
      return verifyToken(
        token,
        config.refreshSecret,
        refreshTokenPayloadSchema,
        (payload) => toRefreshTokenPayload(payload as ParsedRefreshTokenPayload),
      );
    },
  };
}
