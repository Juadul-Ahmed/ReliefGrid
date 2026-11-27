
"use client";

import SettingsGeneral from "@/features/admin/settings/settings-general";
import SettingsUserAccount from "@/features/admin/settings/settings-user-account";
import SettingsOrganization from "@/features/admin/settings/settings-organization";
import SettingsSecurity from "@/features/admin/settings/settings-security";

interface PlatformSettingsMap {
  platformName: string | null;
  platformDescription: string | null;
  supportContactEmail: string | null;
  defaultTimezone: string | null;
  defaultLocale: string | null;
  allowUserRegistration: boolean;
  requireEmailVerificationOnInvitation: boolean;
  allowUserToCreateOrganization: boolean;
  invitationExpiresInDays: number;
}

interface SettingsOverviewProps {
  initial: PlatformSettingsMap;
}

export default function SettingsOverview({
  initial,
}: SettingsOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Platform Settings
          </h1>
          <p className="mt-1 text-sm text-muted">
            Configure global ReliefGrid platform behavior.
          </p>
        </div>
      </div>

      <SettingsGeneral initial={initial} />
      <SettingsUserAccount initial={initial} />
      <SettingsOrganization initial={initial} />
      <SettingsSecurity initial={initial} />
    </div>
  );
}
