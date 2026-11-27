
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  headers: vi.fn(),
  organizationFindMany: vi.fn(),
  organizationCount: vi.fn(),
  organizationFindUnique: vi.fn(),
  organizationUpdate: vi.fn(),
  organizationDeletionRequestFindFirst: vi.fn(),
  organizationDeletionRequestCreate: vi.fn(),
  memberCount: vi.fn(),
  auditLogCreate: vi.fn(),
  transaction: vi.fn(),
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
    $transaction: mocks.transaction,
    organization: {
      findMany: mocks.organizationFindMany,
      count: mocks.organizationCount,
      findUnique: mocks.organizationFindUnique,
      update: mocks.organizationUpdate,
    },
    organizationDeletionRequest: {
      findFirst: mocks.organizationDeletionRequestFindFirst,
      create: mocks.organizationDeletionRequestCreate,
    },
    member: {
      count: mocks.memberCount,
    },
    auditLog: {
      create: mocks.auditLogCreate,
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

const USER_SESSION = {
  user: {
    id: "user-1",
    systemRole: "USER",
    name: "Regular User",
  },
};

const ORG_ID = "org-1";

function mockSession(session: { user: { systemRole: string } } | null) {
  mocks.getSession.mockResolvedValue(session);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.headers.mockReturnValue(new Headers());
  mockTransactionPassthrough();
});

function mockTransactionPassthrough() {
  mocks.transaction.mockImplementation(async (callback: (tx: {
    organization: { update: typeof mocks.organizationUpdate };
    organizationDeletionRequest: { create: typeof mocks.organizationDeletionRequestCreate };
    auditLog: { create: typeof mocks.auditLogCreate };
  }) => unknown) => {
    const tx = {
      organization: {
        update: mocks.organizationUpdate,
      },
      organizationDeletionRequest: {
        create: mocks.organizationDeletionRequestCreate,
      },
      auditLog: {
        create: mocks.auditLogCreate,
      },
    };
    return callback(tx);
  });
}

describe("listOrganizations", () => {
  it("requires system admin authorization", async () => {
    mockSession(USER_SESSION);

    const { listOrganizations } = await import("./admin-organizations");

    await expect(
      listOrganizations({}),
    ).rejects.toThrow("UNAUTHORIZED");
  });

  it("returns organizations, counts, and member totals", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.organizationFindMany.mockResolvedValue([
      {
        id: ORG_ID,
        name: "Relief Org",
        slug: "relief-org",
        status: "ACTIVE",
        createdAt: new Date("2026-01-01"),
        members: [
          {
            id: "m-1",
            role: "owner",
            status: "ACTIVE",
            user: { name: "Owner One", email: "owner@example.com" },
          },
        ],
        _count: { members: 2 },
      },
    ]);
    mocks.organizationCount
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);
    mocks.memberCount.mockResolvedValue(2);

    const { listOrganizations } = await import("./admin-organizations");

    const result = await listOrganizations({});

    expect(result.total).toBe(1);
    expect(result.activeCount).toBe(1);
    expect(result.blockedCount).toBe(0);
    expect(result.memberTotal).toBe(2);
    expect(result.organizations).toHaveLength(1);
    expect(result.organizations[0].owner).toEqual({
      name: "Owner One",
      email: "owner@example.com",
    });
  });

  it("filters by search and status", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.organizationFindMany.mockResolvedValue([]);
    mocks.organizationCount.mockResolvedValue(0);
    mocks.memberCount.mockResolvedValue(0);

    const { listOrganizations } = await import("./admin-organizations");

    await listOrganizations({
      search: "relief",
      status: "BLOCKED",
      page: "2",
      pageSize: "10",
    });

    expect(mocks.organizationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          name: { contains: "relief", mode: "insensitive" },
          status: "BLOCKED",
        },
        skip: 10,
        take: 10,
      }),
    );
  });

  it("handles empty organizations list", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.organizationFindMany.mockResolvedValue([]);
    mocks.organizationCount
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    mocks.memberCount.mockResolvedValue(0);

    const { listOrganizations } = await import("./admin-organizations");

    const result = await listOrganizations({});

    expect(result.total).toBe(0);
    expect(result.organizations).toEqual([]);
  });
});

describe("blockOrganization", () => {
  it("denies non-system-admin users", async () => {
    mockSession(USER_SESSION);

    const { blockOrganization } = await import("./admin-organizations");

    const result = await blockOrganization({ organizationId: ORG_ID });

    expect(result.success).toBe(false);
    expect(result.message).toContain("not authorized");
    expect(mocks.organizationFindUnique).not.toHaveBeenCalled();
  });

  it("blocks an active organization", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.organizationFindUnique.mockResolvedValue({
      id: ORG_ID,
      name: "Relief Org",
      status: "ACTIVE",
    });
    mocks.organizationUpdate.mockResolvedValue({ id: ORG_ID });

    const { blockOrganization } = await import("./admin-organizations");

    const result = await blockOrganization({ organizationId: ORG_ID });

    expect(result.success).toBe(true);
    expect(mocks.organizationUpdate).toHaveBeenCalledWith({
      where: { id: ORG_ID },
      data: { status: "BLOCKED" },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: {
        actorUserId: "admin-1",
        actorType: "USER",
        actorNameSnapshot: "Admin User",
        organizationId: ORG_ID,
        action: "ORGANIZATION_BLOCKED",
        entityType: "Organization",
        entityId: ORG_ID,
        before: { status: "ACTIVE" },
        after: { status: "BLOCKED" },
      },
    });
  });

  it("rejects when organization is already blocked", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.organizationFindUnique.mockResolvedValue({
      id: ORG_ID,
      name: "Relief Org",
      status: "BLOCKED",
    });

    const { blockOrganization } = await import("./admin-organizations");

    const result = await blockOrganization({ organizationId: ORG_ID });

    expect(result.success).toBe(false);
    expect(result.message).toContain("already blocked");
    expect(mocks.organizationUpdate).not.toHaveBeenCalled();
  });

  it("rejects when organization not found", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.organizationFindUnique.mockResolvedValue(null);

    const { blockOrganization } = await import("./admin-organizations");

    const result = await blockOrganization({ organizationId: "missing" });

    expect(result.success).toBe(false);
    expect(result.message).toContain("not found");
  });
});

describe("unblockOrganization", () => {
  it("denies non-system-admin users", async () => {
    mockSession(USER_SESSION);

    const { unblockOrganization } = await import("./admin-organizations");

    const result = await unblockOrganization({ organizationId: ORG_ID });

    expect(result.success).toBe(false);
    expect(result.message).toContain("not authorized");
  });

  it("unblocks a blocked organization", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.organizationFindUnique.mockResolvedValue({
      id: ORG_ID,
      name: "Relief Org",
      status: "BLOCKED",
    });
    mocks.organizationUpdate.mockResolvedValue({ id: ORG_ID });

    const { unblockOrganization } = await import("./admin-organizations");

    const result = await unblockOrganization({ organizationId: ORG_ID });

    expect(result.success).toBe(true);
    expect(mocks.organizationUpdate).toHaveBeenCalledWith({
      where: { id: ORG_ID },
      data: { status: "ACTIVE" },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "ORGANIZATION_UNBLOCKED",
      }),
    });
  });

  it("rejects when organization is already active", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.organizationFindUnique.mockResolvedValue({
      id: ORG_ID,
      name: "Relief Org",
      status: "ACTIVE",
    });

    const { unblockOrganization } = await import("./admin-organizations");

    const result = await unblockOrganization({ organizationId: ORG_ID });

    expect(result.success).toBe(false);
    expect(result.message).toContain("already active");
  });
});

describe("deleteOrganization", () => {
  it("denies non-system-admin users", async () => {
    mockSession(USER_SESSION);

    const { deleteOrganization } = await import("./admin-organizations");

    const result = await deleteOrganization({
      organizationId: ORG_ID,
      reason: "Test",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("not authorized");
  });

  it("rejects when organization not found", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.organizationFindUnique.mockResolvedValue(null);

    const { deleteOrganization } = await import("./admin-organizations");

    const result = await deleteOrganization({
      organizationId: "missing",
      reason: "Test",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("not found");
  });

  it("rejects when a pending deletion request already exists", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.organizationFindUnique.mockResolvedValue({
      id: ORG_ID,
      name: "Relief Org",
      status: "ACTIVE",
    });
    mocks.organizationDeletionRequestFindFirst.mockResolvedValue({
      id: "dr-1",
      status: "PENDING",
    });

    const { deleteOrganization } = await import("./admin-organizations");

    const result = await deleteOrganization({
      organizationId: ORG_ID,
      reason: "Test",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("pending");
    expect(mocks.organizationDeletionRequestCreate).not.toHaveBeenCalled();
  });

  it("creates an approved deletion request and audit log", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.organizationFindUnique.mockResolvedValue({
      id: ORG_ID,
      name: "Relief Org",
      status: "ACTIVE",
    });
    mocks.organizationDeletionRequestFindFirst.mockResolvedValue(null);
    mocks.organizationDeletionRequestCreate.mockResolvedValue({ id: "dr-1" });

    const { deleteOrganization } = await import("./admin-organizations");

    const result = await deleteOrganization({
      organizationId: ORG_ID,
      reason: "Duplicate organization.",
    });

    expect(result.success).toBe(true);
    expect(mocks.organizationDeletionRequestCreate).toHaveBeenCalledWith({
      data: {
        id: expect.any(String),
        organizationId: ORG_ID,
        requestedById: "admin-1",
        reviewedById: "admin-1",
        status: "APPROVED",
        reason: "Duplicate organization.",
        reviewedAt: expect.any(Date),
      },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "ORGANIZATION_DELETED",
        entityType: "Organization",
        entityId: ORG_ID,
      }),
    });
  });

  it("rejects missing reason", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);

    const { deleteOrganization } = await import("./admin-organizations");

    const result = await deleteOrganization({
      organizationId: ORG_ID,
      reason: "",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("reason");
  });
});

describe("getOrganizationDetails", () => {
  const DETAILS_ORG_ID = "org-details-1";

  beforeEach(() => {
    mocks.organizationFindUnique.mockResolvedValue({
      id: DETAILS_ORG_ID,
      name: "Details Org",
      slug: "details-org",
      status: "ACTIVE",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-02"),
      logo: null,
      metadata: null,
      members: [
        {
          id: "m-1",
          role: "owner",
          status: "ACTIVE",
          user: { id: "u-1", name: "Owner One", email: "owner@example.com" },
        },
        {
          id: "m-2",
          role: "member",
          status: "ACTIVE",
          user: { id: "u-2", name: "Member Two", email: "member@example.com" },
        },
      ],
      _count: { members: 2 },
    });
  });

  it("denies non-system-admin users", async () => {
    mockSession(USER_SESSION);

    const { getOrganizationDetails } = await import("./admin-organizations");

    const result = await getOrganizationDetails(DETAILS_ORG_ID);

    expect(result.organization).toBeNull();
    expect(mocks.organizationFindUnique).not.toHaveBeenCalled();
  });

  it("returns organization details for SYSTEM_ADMIN", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);

    const { getOrganizationDetails } = await import("./admin-organizations");

    const result = await getOrganizationDetails(DETAILS_ORG_ID);

    expect(result.organization).not.toBeNull();
    expect(result.organization?.id).toBe(DETAILS_ORG_ID);
    expect(result.organization?.name).toBe("Details Org");
    expect(result.organization?.status).toBe("ACTIVE");
    expect(result.organization?.owner).toEqual({
      name: "Owner One",
      email: "owner@example.com",
    });
    expect(result.organization?.memberCount).toBe(2);
    expect(result.organization?.members).toHaveLength(2);
    expect(mocks.organizationFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: DETAILS_ORG_ID },
        select: expect.objectContaining({
          id: true,
          name: true,
          slug: true,
          status: true,
          members: expect.any(Object),
          _count: expect.any(Object),
        }),
      }),
    );
  });

  it("returns null when organization does not exist", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.organizationFindUnique.mockResolvedValue(null);

    const { getOrganizationDetails } = await import("./admin-organizations");

    const result = await getOrganizationDetails("nonexistent");

    expect(result.organization).toBeNull();
  });

  it("returns blocked organization details for SYSTEM_ADMIN", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.organizationFindUnique.mockResolvedValue({
      id: DETAILS_ORG_ID,
      name: "Blocked Org",
      slug: "blocked-org",
      status: "BLOCKED",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-02"),
      logo: null,
      metadata: null,
      members: [],
      _count: { members: 0 },
    });

    const { getOrganizationDetails } = await import("./admin-organizations");

    const result = await getOrganizationDetails(DETAILS_ORG_ID);

    expect(result.organization).not.toBeNull();
    expect(result.organization?.status).toBe("BLOCKED");
    expect(result.organization?.memberCount).toBe(0);
  });

  it("validates organizationId is required", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);

    const { getOrganizationDetails } = await import("./admin-organizations");

    const result = await getOrganizationDetails("");

    expect(result.organization).toBeNull();
  });
});
