
"use client";

import { AlertDialog, Button } from "@heroui/react";
import type { ComponentProps } from "react";

type AlertDialogIconStatus = NonNullable<
  ComponentProps<typeof AlertDialog.Icon>["status"]
>;

interface ApplicationConfirmationDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  variant?: "primary" | "danger";
  iconStatus?: AlertDialogIconStatus;
  isDisabled?: boolean;
  onConfirm: () => void;
}

export default function ApplicationConfirmationDialog({
  title,
  description,
  confirmLabel,
  variant = "primary",
  iconStatus,
  isDisabled = false,
  onConfirm,
}: ApplicationConfirmationDialogProps) {
  return (
    <AlertDialog>
      <Button variant={variant} isDisabled={isDisabled}>
        {confirmLabel}
      </Button>

      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog className="sm:max-w-[400px]">
            <AlertDialog.CloseTrigger />

            <AlertDialog.Header>
              {iconStatus && <AlertDialog.Icon status={iconStatus} />}
              <AlertDialog.Heading>{title}</AlertDialog.Heading>
            </AlertDialog.Header>

            <AlertDialog.Body>
              <p>{description}</p>
            </AlertDialog.Body>

            <AlertDialog.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>

              <Button
                slot="close"
                variant={variant}
                isDisabled={isDisabled}
                onPress={onConfirm}
              >
                {confirmLabel}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
