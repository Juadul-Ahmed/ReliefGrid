
"use client";

import { useEffect, useRef } from "react";
import { AlertDialog, Button } from "@heroui/react";

interface AuditLogDetailDialogProps {
  auditLog: {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    actorNameSnapshot: string | null;
    actorEmail: string | null;
    actorSystemRole: string | null;
    organizationName: string | null;
    organizationSlug: string | null;
    before: unknown;
    after: unknown;
    metadata: unknown;
    createdAt: Date;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatMetadata(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function AuditLogDetailDialog({
  auditLog,
  open,
  onOpenChange,
}: AuditLogDetailDialogProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open && triggerRef.current) {
      triggerRef.current.click();
    }
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        style={{ display: "none" }}
        aria-hidden="true"
      />

      <AlertDialog>
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-[600px]">
              <AlertDialog.CloseTrigger />

              <AlertDialog.Header>
                <AlertDialog.Heading>
                  {auditLog.action.replace(/_/g, " ")}
                </AlertDialog.Heading>
              </AlertDialog.Header>

              <AlertDialog.Body className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                      Event ID
                    </p>
                    <p className="text-sm text-muted truncate max-w-xs">
                      {auditLog.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                      Timestamp
                    </p>
                    <p className="text-sm text-foreground">
                      {auditLog.createdAt.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                      Actor
                    </p>
                    <p className="text-sm text-foreground">
                      {auditLog.actorNameSnapshot ??
                        auditLog.actorEmail ??
                        "Unknown actor"}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {auditLog.actorEmail ?? "N/A"}
                      {auditLog.actorSystemRole
                        ? ` (${auditLog.actorSystemRole})`
                        : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                      Organization
                    </p>
                    <p className="text-sm text-foreground">
                      {auditLog.organizationName ?? "—"}
                    </p>
                    {auditLog.organizationSlug && (
                      <p className="mt-1 text-xs text-muted">
                        /{auditLog.organizationSlug}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                      Entity Type
                    </p>
                    <p className="text-sm text-foreground truncate max-w-xs">
                      {auditLog.entityType}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                      Entity ID
                    </p>
                    <p className="text-sm text-foreground truncate max-w-xs">
                      {auditLog.entityId}
                    </p>
                  </div>
                </div>

                {auditLog.before !== null &&
                  auditLog.before !== undefined && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                        Before
                      </p>
                      <pre className="mt-1 text-xs text-muted overflow-x-auto bg-surface-secondary rounded-lg p-3 break-all">
                        {formatMetadata(auditLog.before)}
                      </pre>
                    </div>
                  )}

                {auditLog.after !== null &&
                  auditLog.after !== undefined && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                        After
                      </p>
                      <pre className="mt-1 text-xs text-muted overflow-x-auto bg-surface-secondary rounded-lg p-3 break-all">
                        {formatMetadata(auditLog.after)}
                      </pre>
                    </div>
                  )}

                {auditLog.metadata !== null &&
                  auditLog.metadata !== undefined && (
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                          Metadata
                        </p>
                      </div>
                      <pre className="text-xs text-muted overflow-x-auto bg-surface-secondary rounded-lg p-3 break-all">
                        {formatMetadata(auditLog.metadata)}
                      </pre>
                    </div>
                  )}
              </AlertDialog.Body>

              <AlertDialog.Footer>
                <Button
                  slot="close"
                  variant="tertiary"
                  onPress={() => onOpenChange(false)}
                >
                  Close
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </>
  );
}
