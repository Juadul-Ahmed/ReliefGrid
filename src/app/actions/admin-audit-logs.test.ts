
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  headers: vi.fn(),
  auditLogFindMany: vi.fn(),
  auditLogCount: vi.fn(),
  auditLogFindUnique: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    auditLog: {
      findMany: mocks.auditLogFindMany,
      count: mocks.auditLogCount,
      findUnique: mocks.auditLogFindUnique,
    },
  },
}));

const SYSTEM_ADMIN_SESSION = {
  user: {
    id: "admin-1",
    systemRole: "SYSTEM_ADMIN",
    name: "Admin User",
  },
};

const ORG_ADMIN_SESSION = {
  user: {
    id: "org-admin-1",
    systemRole: "USER",
    name: "Org Admin",
  },
};

function mockSession(session: { user: { systemRole: string } } | null) {
  mocks.getSession.mockResolvedValue(session);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.headers.mockReturnValue(new Headers());
});

describe("listAuditLogs", () => {
  it("requires system admin authorization", async () => {
    mockSession(ORG_ADMIN_SESSION);

    const { listAuditLogs } = await import("./admin-audit-logs");

    await expect(listAuditLogs({})).rejects.toThrow("UNAUTHORIZED");
  });

  it("returns audit logs with pagination", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.auditLogFindMany.mockResolvedValue([
      {
        id: "log-1",
        action: "USER_BLOCKED",
        entityType: "User",
        entityId: "user-1",
        actorNameSnapshot: "Admin User",
        actor: { email: "admin@example.com", systemRole: "SYSTEM_ADMIN" },
        organization: { name: "Relief Org", slug: "relief-org" },
        before: { status: "ACTIVE" },
        after: { status: "BLOCKED" },
        metadata: { userId: "user-1" },
        createdAt: new Date("2026-01-01T10:00:00Z"),
      },
    ]);
    mocks.auditLogCount.mockResolvedValue(1);

    const { listAuditLogs } = await import("./admin-audit-logs");

    const result = await listAuditLogs({});

    expect(result.auditLogs).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.auditLogs[0].action).toBe("USER_BLOCKED");
    expect(result.auditLogs[0].actorNameSnapshot).toBe("Admin User");
    expect(result.auditLogs[0].actorEmail).toBe("admin@example.com");
    expect(result.auditLogs[0].organizationName).toBe("Relief Org");
  });

  it("filters by search", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.auditLogFindMany.mockResolvedValue([]);
    mocks.auditLogCount.mockResolvedValue(0);

    const { listAuditLogs } = await import("./admin-audit-logs");

    await listAuditLogs({ search: "admin" });

    expect(mocks.auditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { actorNameSnapshot: { contains: "admin", mode: "insensitive" } },
          ],
        }),
      }),
    );
  });

  it("filters by action", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.auditLogFindMany.mockResolvedValue([]);
    mocks.auditLogCount.mockResolvedValue(0);

    const { listAuditLogs } = await import("./admin-audit-logs");

    await listAuditLogs({ action: "USER_BLOCKED" });

    expect(mocks.auditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          action: { contains: "USER_BLOCKED", mode: "insensitive" },
        }),
      }),
    );
  });

  it("filters by organization", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.auditLogFindMany.mockResolvedValue([]);
    mocks.auditLogCount.mockResolvedValue(0);

    const { listAuditLogs } = await import("./admin-audit-logs");

    await listAuditLogs({ organizationId: "org-1" });

    expect(mocks.auditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-1",
        }),
      }),
    );
  });

  it("filters by entity type", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.auditLogFindMany.mockResolvedValue([]);
    mocks.auditLogCount.mockResolvedValue(0);

    const { listAuditLogs } = await import("./admin-audit-logs");

    await listAuditLogs({ entityType: "User" });

    expect(mocks.auditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          entityType: { contains: "User", mode: "insensitive" },
        }),
      }),
    );
  });

  it("filters by date range", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.auditLogFindMany.mockResolvedValue([]);
    mocks.auditLogCount.mockResolvedValue(0);

    const { listAuditLogs } = await import("./admin-audit-logs");

    await listAuditLogs({
      startDate: "2026-01-01T00:00:00Z",
      endDate: "2026-01-31T23:59:59Z",
    });

    expect(mocks.auditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      }),
    );
  });

  it("paginates results", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.auditLogFindMany.mockResolvedValue([]);
    mocks.auditLogCount.mockResolvedValue(0);

    const { listAuditLogs } = await import("./admin-audit-logs");

    await listAuditLogs({ page: "2", pageSize: "10" });

    expect(mocks.auditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      }),
    );
  });

  it("sorts by createdAt descending by default", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.auditLogFindMany.mockResolvedValue([]);
    mocks.auditLogCount.mockResolvedValue(0);

    const { listAuditLogs } = await import("./admin-audit-logs");

    await listAuditLogs({});

    expect(mocks.auditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: "desc" },
      }),
    );
  });
});

describe("getAuditLogStats", () => {
  it("requires system admin authorization", async () => {
    mockSession(ORG_ADMIN_SESSION);

    const { getAuditLogStats } = await import("./admin-audit-logs");

    await expect(getAuditLogStats({})).rejects.toThrow("UNAUTHORIZED");
  });

  it("returns statistics", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.auditLogCount
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(7);
    mocks.auditLogFindMany.mockResolvedValue([
      { actorUserId: "user-1" },
      { actorUserId: "user-2" },
      { actorUserId: null },
    ]);

    const { getAuditLogStats } = await import("./admin-audit-logs");

    const result = await getAuditLogStats({});

    expect(result.totalEvents).toBe(10);
    expect(result.eventsToday).toBe(3);
    expect(result.eventsLast7Days).toBe(7);
    expect(result.distinctActors).toBe(2);
  });
});

describe("getAuditLogDetails", () => {
  it("requires system admin authorization", async () => {
    mockSession(ORG_ADMIN_SESSION);

    const { getAuditLogDetails } = await import("./admin-audit-logs");

    const result = await getAuditLogDetails("log-1");

    expect(result.auditLog).toBeNull();
  });

  it("returns null when audit log does not exist", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.auditLogFindUnique.mockResolvedValue(null);

    const { getAuditLogDetails } = await import("./admin-audit-logs");

    const result = await getAuditLogDetails("log-1");

    expect(result.auditLog).toBeNull();
  });

  it("returns audit log details", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.auditLogFindUnique.mockResolvedValue({
      id: "log-1",
      action: "USER_BLOCKED",
      entityType: "User",
      entityId: "user-1",
      actorNameSnapshot: "Admin User",
      actor: { email: "admin@example.com", systemRole: "SYSTEM_ADMIN" },
      organization: { name: "Relief Org", slug: "relief-org" },
      before: { status: "ACTIVE" },
      after: { status: "BLOCKED" },
      metadata: { userId: "user-1", password: "secret123" },
      createdAt: new Date("2026-01-01T10:00:00Z"),
    });

    const { getAuditLogDetails } = await import("./admin-audit-logs");

    const result = await getAuditLogDetails("log-1");

    expect(result.auditLog).not.toBeNull();
    expect(result.auditLog?.id).toBe("log-1");
    expect(result.auditLog?.action).toBe("USER_BLOCKED");
    expect(result.auditLog?.actorNameSnapshot).toBe("Admin User");
    expect(result.auditLog?.organizationName).toBe("Relief Org");
    // Sensitive metadata should be redacted
    expect(
      JSON.stringify(result.auditLog?.metadata),
    ).not.toContain("secret123");
    expect(JSON.stringify(result.auditLog?.metadata)).toContain(
      "[REDACTED]",
    );
  });

  it("returns null for empty audit log ID", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);

    const { getAuditLogDetails } = await import("./admin-audit-logs");

    const result = await getAuditLogDetails("");

    expect(result.auditLog).toBeNull();
  });
});

describe("redactSensitiveMetadata", () => {
  it("redacts sensitive fields in metadata", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.auditLogFindUnique.mockResolvedValue({
      id: "log-1",
      action: "USER_BLOCKED",
      entityType: "User",
      entityId: "user-1",
      actorNameSnapshot: "Admin User",
      actor: { email: "admin@example.com", systemRole: "SYSTEM_ADMIN" },
      organization: null,
      before: null,
      after: null,
      metadata: {
        password: "hidden",
        accessToken: "token123",
        clientSecret: "secret",
        normalField: "visible",
      },
      createdAt: new Date("2026-01-01T10:00:00Z"),
    });

    const { getAuditLogDetails } = await import("./admin-audit-logs");

    const result = await getAuditLogDetails("log-1");

    const metadata = result.auditLog?.metadata as Record<string, unknown>;
    expect(metadata.password).toBe("[REDACTED]");
    expect(metadata.accessToken).toBe("[REDACTED]");
    expect(metadata.clientSecret).toBe("[REDACTED]");
    expect(metadata.normalField).toBe("visible");
  });

  it("handles null metadata gracefully", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.auditLogFindUnique.mockResolvedValue({
      id: "log-1",
      action: "USER_BLOCKED",
      entityType: "User",
      entityId: "user-1",
      actorNameSnapshot: "Admin User",
      actor: { email: "admin@example.com", systemRole: "SYSTEM_ADMIN" },
      organization: null,
      before: null,
      after: null,
      metadata: null,
      createdAt: new Date("2026-01-01T10:00:00Z"),
    });

    const { getAuditLogDetails } = await import("./admin-audit-logs");

    const result = await getAuditLogDetails("log-1");

    expect(result.auditLog?.metadata).toBeNull();
  });
});
