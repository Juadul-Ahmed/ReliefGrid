
interface ApplicationDetailItemProps {
  label: string;
  value?: string | null;
}

export default function ApplicationDetailItem({
  label,
  value,
}: ApplicationDetailItemProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>

      <p className="mt-2 break-words text-sm text-foreground">
        {value || "Not provided"}
      </p>
    </div>
  );
}
