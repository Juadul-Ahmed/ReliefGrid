
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  headers: vi.fn(),
  userFindMany: vi.fn(),
  userCount: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
  sessionDeleteMany: vi.fn(),
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
    user: {
      findMany: mocks.userFindMany,
      count: mocks.userCount,
      findUnique: mocks.userFindUnique,
      update: mocks.userUpdate,
    },
    session: {
      deleteMany: mocks.sessionDeleteMany,
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

function mockTransactionPassthrough() {
  mocks.transaction.mockImplementation(async (callback: (tx: {
    user: { update: typeof mocks.userUpdate };
    session: { deleteMany: typeof mocks.sessionDeleteMany };
    auditLog: { create: typeof mocks.auditLogCreate };
  }) => unknown) => {
    const tx = {
      user: {
        update: mocks.userUpdate,
      },
      session: {
        deleteMany: mocks.sessionDeleteMany,
      },
      auditLog: {
        create: mocks.auditLogCreate,
      },
    };
    return callback(tx);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.headers.mockReturnValue(new Headers());
  mockTransactionPassthrough();
});

describe("listUsers", () => {
  it("requires system admin authorization", async () => {
    mockSession(ORG_ADMIN_SESSION);

    const { listUsers } = await import("./admin-users");

    await expect(listUsers({})).rejects.toThrow("UNAUTHORIZED");
  });

  it("returns users, counts, and admin total", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.userFindMany.mockResolvedValue([
      {
        id: "user-1",
        name: "Alice",
        email: "alice@example.com",
        emailVerified: true,
        systemRole: "SYSTEM_ADMIN",
        status: "ACTIVE",
        createdAt: new Date("2026-01-01"),
        _count: { members: 2 },
      },
      {
        id: "user-2",
        name: "Bob",
        email: "bob@example.com",
        emailVerified: false,
        systemRole: "USER",
        status: "BLOCKED",
        createdAt: new Date("2026-02-01"),
        _count: { members: 1 },
      },
    ]);
    mocks.userCount
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);

    const { listUsers } = await import("./admin-users");

    const result = await listUsers({});

    expect(result.total).toBe(2);
    expect(result.activeCount).toBe(1);
    expect(result.blockedCount).toBe(1);
    expect(result.systemAdminCount).toBe(1);
    expect(result.users).toHaveLength(2);
    expect(result.users[0]).toMatchObject({
      id: "user-1",
      name: "Alice",
      email: "alice@example.com",
      systemRole: "SYSTEM_ADMIN",
      status: "ACTIVE",
      organizationCount: 2,
    });
  });

  it("filters by search", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.userFindMany.mockResolvedValue([]);
    mocks.userCount.mockResolvedValue(0);

    const { listUsers } = await import("./admin-users");

    await listUsers({ search: "alice" });

    expect(mocks.userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { name: { contains: "alice", mode: "insensitive" } },
            { email: { contains: "alice", mode: "insensitive" } },
          ],
        }),
      }),
    );
  });

  it("filters by status", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.userFindMany.mockResolvedValue([]);
    mocks.userCount.mockResolvedValue(0);

    const { listUsers } = await import("./admin-users");

    await listUsers({ status: "BLOCKED" });

    expect(mocks.userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "BLOCKED",
        }),
      }),
    );
  });

  it("filters by role", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.userFindMany.mockResolvedValue([]);
    mocks.userCount.mockResolvedValue(0);

    const { listUsers } = await import("./admin-users");

    await listUsers({ role: "SYSTEM_ADMIN" });

    expect(mocks.userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          systemRole: "SYSTEM_ADMIN",
        }),
      }),
    );
  });

  it("paginates results", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.userFindMany.mockResolvedValue([]);
    mocks.userCount.mockResolvedValue(0);

    const { listUsers } = await import("./admin-users");

    await listUsers({ page: "2", pageSize: "10" });

    expect(mocks.userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      }),
    );
  });
});

describe("getUserDetails", () => {
  it("requires system admin authorization", async () => {
    mockSession(ORG_ADMIN_SESSION);

    const { getUserDetails } = await import("./admin-users");

    const result = await getUserDetails("user-1");

    expect(result.user).toBeNull();
  });

  it("returns null when user does not exist", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.userFindUnique.mockResolvedValue(null);

    const { getUserDetails } = await import("./admin-users");

    const result = await getUserDetails("user-1");

    expect(result.user).toBeNull();
  });

  it("returns user details with memberships", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.userFindUnique.mockResolvedValue({
      id: "user-1",
      name: "Alice",
      email: "alice@example.com",
      emailVerified: true,
      image: null,
      systemRole: "SYSTEM_ADMIN",
      status: "ACTIVE",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-02-01"),
      members: [
        {
          id: "m-1",
          role: "owner",
          status: "ACTIVE",
          createdAt: new Date("2026-01-15"),
          organization: {
            id: "org-1",
            name: "Relief Org",
            slug: "relief-org",
            status: "ACTIVE",
          },
        },
      ],
      _count: { members: 1 },
    });

    const { getUserDetails } = await import("./admin-users");

    const result = await getUserDetails("user-1");

    expect(result.user).not.toBeNull();
    expect(result.user?.id).toBe("user-1");
    expect(result.user?.name).toBe("Alice");
    expect(result.user?.email).toBe("alice@example.com");
    expect(result.user?.systemRole).toBe("SYSTEM_ADMIN");
    expect(result.user?.status).toBe("ACTIVE");
    expect(result.user?.organizationCount).toBe(1);
    expect(result.user?.memberships).toHaveLength(1);
    expect(result.user?.memberships[0].organizationName).toBe("Relief Org");
    expect(result.user?.memberships[0].role).toBe("owner");
  });
});

describe("blockUser", () => {
  it("requires system admin authorization", async () => {
    mockSession(ORG_ADMIN_SESSION);

    const { blockUser } = await import("./admin-users");

    const result = await blockUser({ userId: "user-1" });

    expect(result.success).toBe(false);
    expect(result.message).toBe("You are not authorized to block users.");
  });

  it("blocks a user and revokes sessions", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.userFindUnique.mockResolvedValue({
      id: "user-1",
      name: "Alice",
      email: "alice@example.com",
      status: "ACTIVE",
    });
    mocks.userUpdate.mockResolvedValue({ id: "user-1" });
    mocks.sessionDeleteMany.mockResolvedValue({ count: 2 });
    mocks.auditLogCreate.mockResolvedValue({ id: "audit-1" });

    const { blockUser } = await import("./admin-users");

    const result = await blockUser({ userId: "user-1" });

    expect(result.success).toBe(true);
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { status: "BLOCKED" },
    });
    expect(mocks.sessionDeleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "USER_BLOCKED",
          entityType: "User",
          entityId: "user-1",
        }),
      }),
    );
  });

  it("returns error when user is already blocked", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.userFindUnique.mockResolvedValue({
      id: "user-1",
      name: "Alice",
      email: "alice@example.com",
      status: "BLOCKED",
    });

    const { blockUser } = await import("./admin-users");

    const result = await blockUser({ userId: "user-1" });

    expect(result.success).toBe(false);
    expect(result.message).toBe("User is already blocked.");
  });

  it("prevents blocking self", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.userFindUnique.mockResolvedValue({
      id: "admin-1",
      name: "Admin User",
      email: "admin@example.com",
      status: "ACTIVE",
    });

    const { blockUser } = await import("./admin-users");

    const result = await blockUser({ userId: "admin-1" });

    expect(result.success).toBe(false);
    expect(result.message).toBe("You cannot block your own account.");
  });

  it("prevents blocking the last active system admin", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.userCount.mockResolvedValue(1);
    mocks.userFindUnique.mockResolvedValue({
      id: "user-1",
      name: "Alice",
      email: "alice@example.com",
      status: "ACTIVE",
      systemRole: "SYSTEM_ADMIN",
    });

    const { blockUser } = await import("./admin-users");

    const result = await blockUser({ userId: "user-1" });

    expect(result.success).toBe(false);
    expect(result.message).toBe(
      "Cannot block the last active System Administrator.",
    );
  });

  it("returns error when user not found", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.userFindUnique.mockResolvedValue(null);

    const { blockUser } = await import("./admin-users");

    const result = await blockUser({ userId: "nonexistent" });

    expect(result.success).toBe(false);
    expect(result.message).toBe("User not found.");
  });
});

describe("unblockUser", () => {
  it("requires system admin authorization", async () => {
    mockSession(ORG_ADMIN_SESSION);

    const { unblockUser } = await import("./admin-users");

    const result = await unblockUser({ userId: "user-1" });

    expect(result.success).toBe(false);
    expect(result.message).toBe("You are not authorized to unblock users.");
  });

  it("unblocks a user", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.userFindUnique.mockResolvedValue({
      id: "user-1",
      name: "Alice",
      email: "alice@example.com",
      status: "BLOCKED",
    });
    mocks.userUpdate.mockResolvedValue({ id: "user-1" });
    mocks.auditLogCreate.mockResolvedValue({ id: "audit-1" });

    const { unblockUser } = await import("./admin-users");

    const result = await unblockUser({ userId: "user-1" });

    expect(result.success).toBe(true);
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { status: "ACTIVE" },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "USER_UNBLOCKED",
          entityType: "User",
          entityId: "user-1",
        }),
      }),
    );
  });

  it("returns error when user is already active", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.userFindUnique.mockResolvedValue({
      id: "user-1",
      name: "Alice",
      email: "alice@example.com",
      status: "ACTIVE",
    });

    const { unblockUser } = await import("./admin-users");

    const result = await unblockUser({ userId: "user-1" });

    expect(result.success).toBe(false);
    expect(result.message).toBe("User is already active.");
  });

  it("returns error when user not found", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.userFindUnique.mockResolvedValue(null);

    const { unblockUser } = await import("./admin-users");

    const result = await unblockUser({ userId: "nonexistent" });

    expect(result.success).toBe(false);
    expect(result.message).toBe("User not found.");
  });
});

describe("deleteUser", () => {
  it("requires system admin authorization", async () => {
    mockSession(ORG_ADMIN_SESSION);

    const { deleteUser } = await import("./admin-users");

    const result = await deleteUser({ userId: "user-1", reason: "test" });

    expect(result.success).toBe(false);
    expect(result.message).toBe("You are not authorized to delete users.");
  });

  it("deactivates a user and revokes sessions", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.userFindUnique.mockResolvedValue({
      id: "user-1",
      name: "Alice",
      email: "alice@example.com",
      status: "ACTIVE",
      systemRole: "USER",
    });
    mocks.userUpdate.mockResolvedValue({ id: "user-1" });
    mocks.sessionDeleteMany.mockResolvedValue({ count: 2 });
    mocks.auditLogCreate.mockResolvedValue({ id: "audit-1" });

    const { deleteUser } = await import("./admin-users");

    const result = await deleteUser({
      userId: "user-1",
      reason: "Account compromise",
    });

    expect(result.success).toBe(true);
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        status: "DELETED",
        name: "Deleted User",
        email: expect.stringMatching(/^deleted_user-1@reliefgrid\.local$/),
        image: null,
      },
    });
    expect(mocks.sessionDeleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "USER_DELETED",
          entityType: "User",
          entityId: "user-1",
        }),
      }),
    );
  });

  it("returns error when user is already deactivated", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.userFindUnique.mockResolvedValue({
      id: "user-1",
      name: "Deleted User",
      email: "deleted_user-1@reliefgrid.local",
      status: "DELETED",
      systemRole: "USER",
    });

    const { deleteUser } = await import("./admin-users");

    const result = await deleteUser({
      userId: "user-1",
      reason: "test",
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe("User is already deactivated.");
  });

  it("prevents deleting self", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.userFindUnique.mockResolvedValue({
      id: "admin-1",
      name: "Admin User",
      email: "admin@example.com",
      status: "ACTIVE",
      systemRole: "SYSTEM_ADMIN",
    });

    const { deleteUser } = await import("./admin-users");

    const result = await deleteUser({
      userId: "admin-1",
      reason: "test",
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe("You cannot delete your own account.");
  });

  it("prevents deleting the last active system admin", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.userCount.mockResolvedValue(1);
    mocks.userFindUnique.mockResolvedValue({
      id: "user-1",
      name: "Alice",
      email: "alice@example.com",
      status: "ACTIVE",
      systemRole: "SYSTEM_ADMIN",
    });

    const { deleteUser } = await import("./admin-users");

    const result = await deleteUser({
      userId: "user-1",
      reason: "test",
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe(
      "Cannot delete the last active System Administrator.",
    );
  });

  it("returns error when user not found", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.userFindUnique.mockResolvedValue(null);

    const { deleteUser } = await import("./admin-users");

    const result = await deleteUser({
      userId: "nonexistent",
      reason: "test",
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe("User not found.");
  });

  it("requires a reason", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);

    const { deleteUser } = await import("./admin-users");

    const result = await deleteUser({ userId: "user-1", reason: "" });

    expect(result.success).toBe(false);
    expect(result.message).toBe("A reason is required");
  });
});
