import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { createSession, getSession } from "../auth";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Mock server-only module
vi.mock("server-only", () => ({}));

// Mock jose library
vi.mock("jose", () => ({
  SignJWT: vi.fn(),
  jwtVerify: vi.fn(),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("createSession", () => {
  const mockCookieStore = {
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (cookies as Mock).mockResolvedValue(mockCookieStore);
  });

  it("should create a session with valid userId and email", async () => {
    const mockToken = "mock-jwt-token";
    const mockSign = vi.fn().mockResolvedValue(mockToken);
    const mockSetExpirationTime = vi.fn().mockReturnThis();
    const mockSetIssuedAt = vi.fn().mockReturnThis();
    const mockSetProtectedHeader = vi.fn().mockReturnThis();

    (SignJWT as unknown as Mock).mockImplementation(() => ({
      setProtectedHeader: mockSetProtectedHeader,
      setExpirationTime: mockSetExpirationTime,
      setIssuedAt: mockSetIssuedAt,
      sign: mockSign,
    }));

    const userId = "user123";
    const email = "test@example.com";

    await createSession(userId, email);

    // Verify SignJWT was called with correct payload
    expect(SignJWT).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        email,
        expiresAt: expect.any(Date),
      })
    );

    // Verify JWT configuration
    expect(mockSetProtectedHeader).toHaveBeenCalledWith({ alg: "HS256" });
    expect(mockSetExpirationTime).toHaveBeenCalledWith("7d");
    expect(mockSetIssuedAt).toHaveBeenCalled();
    expect(mockSign).toHaveBeenCalled();
  });

  it("should set cookie with correct token and options", async () => {
    const mockToken = "mock-jwt-token";
    const mockSign = vi.fn().mockResolvedValue(mockToken);
    const mockSetExpirationTime = vi.fn().mockReturnThis();
    const mockSetIssuedAt = vi.fn().mockReturnThis();
    const mockSetProtectedHeader = vi.fn().mockReturnThis();

    (SignJWT as unknown as Mock).mockImplementation(() => ({
      setProtectedHeader: mockSetProtectedHeader,
      setExpirationTime: mockSetExpirationTime,
      setIssuedAt: mockSetIssuedAt,
      sign: mockSign,
    }));

    await createSession("user123", "test@example.com");

    // Verify cookie was set with correct name and token
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "auth-token",
      mockToken,
      expect.objectContaining({
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: expect.any(Date),
        path: "/",
      })
    );
  });

  it("should set session expiry to 7 days from now", async () => {
    const mockToken = "mock-jwt-token";
    const mockSign = vi.fn().mockResolvedValue(mockToken);
    const mockSetExpirationTime = vi.fn().mockReturnThis();
    const mockSetIssuedAt = vi.fn().mockReturnThis();
    const mockSetProtectedHeader = vi.fn().mockReturnThis();

    (SignJWT as unknown as Mock).mockImplementation(() => ({
      setProtectedHeader: mockSetProtectedHeader,
      setExpirationTime: mockSetExpirationTime,
      setIssuedAt: mockSetIssuedAt,
      sign: mockSign,
    }));

    const beforeCall = Date.now();
    await createSession("user123", "test@example.com");
    const afterCall = Date.now();

    const setCallArgs = mockCookieStore.set.mock.calls[0];
    const expiresAt = setCallArgs[2].expires;

    // Check that expires is approximately 7 days from now
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const expectedExpiry = beforeCall + sevenDaysInMs;
    const actualExpiry = expiresAt.getTime();

    // Allow 1 second tolerance for test execution time
    expect(actualExpiry).toBeGreaterThanOrEqual(expectedExpiry);
    expect(actualExpiry).toBeLessThanOrEqual(afterCall + sevenDaysInMs);
  });

  it("should include userId and email in JWT payload", async () => {
    const mockToken = "mock-jwt-token";
    const mockSign = vi.fn().mockResolvedValue(mockToken);
    const mockSetExpirationTime = vi.fn().mockReturnThis();
    const mockSetIssuedAt = vi.fn().mockReturnThis();
    const mockSetProtectedHeader = vi.fn().mockReturnThis();

    (SignJWT as unknown as Mock).mockImplementation(() => ({
      setProtectedHeader: mockSetProtectedHeader,
      setExpirationTime: mockSetExpirationTime,
      setIssuedAt: mockSetIssuedAt,
      sign: mockSign,
    }));

    const userId = "test-user-id-123";
    const email = "user@test.com";

    await createSession(userId, email);

    // Verify the SignJWT constructor received the correct payload
    const jwtConstructorCall = (SignJWT as unknown as Mock).mock.calls[0][0];
    expect(jwtConstructorCall).toMatchObject({
      userId,
      email,
    });
    expect(jwtConstructorCall.expiresAt).toBeInstanceOf(Date);
  });

  it("should use HS256 algorithm for JWT signing", async () => {
    const mockToken = "mock-jwt-token";
    const mockSign = vi.fn().mockResolvedValue(mockToken);
    const mockSetExpirationTime = vi.fn().mockReturnThis();
    const mockSetIssuedAt = vi.fn().mockReturnThis();
    const mockSetProtectedHeader = vi.fn().mockReturnThis();

    (SignJWT as unknown as Mock).mockImplementation(() => ({
      setProtectedHeader: mockSetProtectedHeader,
      setExpirationTime: mockSetExpirationTime,
      setIssuedAt: mockSetIssuedAt,
      sign: mockSign,
    }));

    await createSession("user123", "test@example.com");

    expect(mockSetProtectedHeader).toHaveBeenCalledWith({ alg: "HS256" });
  });
});

describe("getSession", () => {
  const mockCookieStore = {
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (cookies as Mock).mockResolvedValue(mockCookieStore);
  });

  it("should return session payload when valid token exists", async () => {
    const mockToken = "valid-token";
    const mockPayload = {
      userId: "user123",
      email: "test@example.com",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    mockCookieStore.get.mockReturnValue({ value: mockToken });
    (jwtVerify as Mock).mockResolvedValue({ payload: mockPayload });

    const session = await getSession();

    expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
    expect(jwtVerify).toHaveBeenCalledWith(mockToken, expect.anything());
    expect(session).toEqual(mockPayload);
  });

  it("should return null when no token exists", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const session = await getSession();

    expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
    expect(jwtVerify).not.toHaveBeenCalled();
    expect(session).toBeNull();
  });

  it("should return null when token verification fails", async () => {
    const mockToken = "invalid-token";
    mockCookieStore.get.mockReturnValue({ value: mockToken });
    (jwtVerify as Mock).mockRejectedValue(new Error("Invalid token"));

    const session = await getSession();

    expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
    expect(jwtVerify).toHaveBeenCalledWith(mockToken, expect.anything());
    expect(session).toBeNull();
  });

  it("should return null when token is expired", async () => {
    const mockToken = "expired-token";
    mockCookieStore.get.mockReturnValue({ value: mockToken });
    (jwtVerify as Mock).mockRejectedValue(new Error("Token expired"));

    const session = await getSession();

    expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
    expect(jwtVerify).toHaveBeenCalledWith(mockToken, expect.anything());
    expect(session).toBeNull();
  });

  it("should return null when token is malformed", async () => {
    const mockToken = "malformed-token";
    mockCookieStore.get.mockReturnValue({ value: mockToken });
    (jwtVerify as Mock).mockRejectedValue(new Error("Malformed JWT"));

    const session = await getSession();

    expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
    expect(session).toBeNull();
  });
});
