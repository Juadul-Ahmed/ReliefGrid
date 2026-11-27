
import { getPlatformSettings } from "@/app/actions/admin-platform-settings";
import SettingsOverview from "@/features/admin/settings/settings-overview";

export default async function SettingsPage() {
  const { settings } = await getPlatformSettings();

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <SettingsOverview
        initial={
          settings as unknown as {
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
        }
      />
    </div>
  );
}
