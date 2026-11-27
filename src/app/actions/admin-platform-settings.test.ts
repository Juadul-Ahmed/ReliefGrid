
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  headers: vi.fn(),
  platformSettingsFindUnique: vi.fn(),
  platformSettingsUpsert: vi.fn(),
  auditLogCreate: vi.fn(),
  revalidatePath: vi.fn(),
  transaction: vi.fn(),
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
    platformSettings: {
      findUnique: mocks.platformSettingsFindUnique,
      upsert: mocks.platformSettingsUpsert,
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

beforeEach(() => {
  vi.clearAllMocks();
  mocks.headers.mockReturnValue(new Headers());

  mocks.transaction.mockImplementation(async (callback: (tx: {
    platformSettings: { upsert: typeof mocks.platformSettingsUpsert };
    auditLog: { create: typeof mocks.auditLogCreate };
  }) => unknown) => {
    const tx = {
      platformSettings: {
        upsert: mocks.platformSettingsUpsert,
      },
      auditLog: {
        create: mocks.auditLogCreate,
      },
    };
    return callback(tx);
  });
});

describe("getPlatformSettings", () => {
  it("requires system admin authorization", async () => {
    mockSession(ORG_ADMIN_SESSION);

    const { getPlatformSettings } = await import("./admin-platform-settings");

    await expect(getPlatformSettings()).rejects.toThrow("UNAUTHORIZED");
  });

  it("returns default settings when none exist in database", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.platformSettingsFindUnique.mockResolvedValue(null);

    const { getPlatformSettings } = await import("./admin-platform-settings");

    const result = await getPlatformSettings();

    expect(result.settings.platformName).toBeNull();
    expect(result.settings.platformDescription).toBeNull();
    expect(result.settings.supportContactEmail).toBeNull();
    expect(result.settings.defaultTimezone).toBeNull();
    expect(result.settings.defaultLocale).toBeNull();
    expect(result.settings.allowUserRegistration).toBe(true);
    expect(result.settings.requireEmailVerificationOnInvitation).toBe(false);
    expect(result.settings.allowUserToCreateOrganization).toBe(false);
    expect(result.settings.invitationExpiresInDays).toBe(7);
  });

  it("returns stored settings from database", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.platformSettingsFindUnique.mockResolvedValue({
      settings: {
        platformName: "My Platform",
        allowUserRegistration: false,
        invitationExpiresInDays: 14,
      },
      updatedAt: new Date("2026-01-01"),
    });

    const { getPlatformSettings } = await import("./admin-platform-settings");

    const result = await getPlatformSettings();

    expect(result.settings.platformName).toBe("My Platform");
    expect(result.settings.allowUserRegistration).toBe(false);
    expect(result.settings.invitationExpiresInDays).toBe(14);
    // Defaults for unset fields
    expect(result.settings.allowUserToCreateOrganization).toBe(false);
    expect(result.settings.requireEmailVerificationOnInvitation).toBe(false);
  });
});

describe("updatePlatformSettings", () => {
  it("requires system admin authorization", async () => {
    mockSession(ORG_ADMIN_SESSION);

    const { updatePlatformSettings } = await import("./admin-platform-settings");

    const result = await updatePlatformSettings({ platformName: "Test" });

    expect(result.success).toBe(false);
    expect(result.message).toBe("You are not authorized to update platform settings.");
  });

  it("creates platform settings record when none exists", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.platformSettingsFindUnique.mockResolvedValue(null);
    mocks.platformSettingsUpsert.mockResolvedValue({
      id: "platform",
      settings: {},
      updatedAt: new Date(),
      updatedBy: "admin-1",
    });
    mocks.auditLogCreate.mockResolvedValue({ id: "audit-1" });

    const { updatePlatformSettings } = await import("./admin-platform-settings");

    const result = await updatePlatformSettings({
      platformName: "ReliefGrid",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.settings.platformName).toBe("ReliefGrid");
    }
    expect(mocks.platformSettingsUpsert).toHaveBeenCalledWith({
      where: { id: "platform" },
      create: expect.objectContaining({
        settings: expect.objectContaining({
          platformName: "ReliefGrid",
        }),
      }),
      update: expect.objectContaining({
        settings: expect.objectContaining({
          platformName: "ReliefGrid",
        }),
      }),
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/settings");
  });

  it("updates existing settings without overwriting unrelated fields", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.platformSettingsFindUnique.mockResolvedValue({
      settings: {
        platformName: "Old Name",
        allowUserRegistration: true,
        supportContactEmail: "old@example.com",
      },
      updatedAt: new Date("2026-01-01"),
    });
    mocks.platformSettingsUpsert.mockResolvedValue({
      id: "platform",
      settings: {},
      updatedAt: new Date(),
      updatedBy: "admin-1",
    });
    mocks.auditLogCreate.mockResolvedValue({ id: "audit-1" });

    const { updatePlatformSettings } = await import("./admin-platform-settings");

    const result = await updatePlatformSettings({
      platformName: "New Name",
    });

    expect(result.success).toBe(true);
    // The merged settings should preserve unrelated fields
    expect(mocks.platformSettingsUpsert).toHaveBeenCalledWith({
      where: { id: "platform" },
      create: expect.objectContaining({
        settings: expect.objectContaining({
          platformName: "New Name",
          allowUserRegistration: true,
          supportContactEmail: "old@example.com",
        }),
      }),
      update: expect.objectContaining({
        settings: expect.objectContaining({
          platformName: "New Name",
          allowUserRegistration: true,
          supportContactEmail: "old@example.com",
        }),
      }),
    });
  });

  it("rejects invalid email for support contact", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);

    const { updatePlatformSettings } = await import("./admin-platform-settings");

    const result = await updatePlatformSettings({
      supportContactEmail: "not-an-email",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("email");
  });

  it("rejects invitation expiry outside valid range", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);

    const { updatePlatformSettings } = await import("./admin-platform-settings");

    const result = await updatePlatformSettings({
      invitationExpiresInDays: 0,
    });

    expect(result.success).toBe(false);

    const result2 = await updatePlatformSettings({
      invitationExpiresInDays: 366,
    });

    expect(result2.success).toBe(false);
  });

  it("creates audit log with redacted sensitive fields", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.platformSettingsFindUnique.mockResolvedValue({
      settings: { supportContactEmail: "secret@example.com" },
      updatedAt: new Date("2026-01-01"),
    });
    mocks.platformSettingsUpsert.mockResolvedValue({
      id: "platform",
      settings: {},
      updatedAt: new Date(),
      updatedBy: "admin-1",
    });
    mocks.auditLogCreate.mockResolvedValue({ id: "audit-1" });

    const { updatePlatformSettings } = await import("./admin-platform-settings");

    await updatePlatformSettings({
      supportContactEmail: "new@example.com",
    });

    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "PLATFORM_SETTINGS_UPDATED",
        entityType: "PlatformSettings",
        entityId: "platform",
        before: expect.objectContaining({
          supportContactEmail: "[REDACTED]",
        }),
        after: expect.objectContaining({
          supportContactEmail: "[REDACTED]",
        }),
      }),
    });
  });

  it("calls revalidatePath after successful update", async () => {
    mockSession(SYSTEM_ADMIN_SESSION);
    mocks.platformSettingsFindUnique.mockResolvedValue(null);
    mocks.platformSettingsUpsert.mockResolvedValue({
      id: "platform",
      settings: {},
      updatedAt: new Date(),
      updatedBy: "admin-1",
    });
    mocks.auditLogCreate.mockResolvedValue({ id: "audit-1" });

    const { updatePlatformSettings } = await import("./admin-platform-settings");

    await updatePlatformSettings({ platformName: "Test" });

    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/settings");
  });
});
