
"use client";

import { useState } from "react";

import { MultiAllocateForm } from "@/components/requests/MultiAllocateForm";

interface VerifiedRequest {
  id: string;
  requestNumber: string;
  title: string;
  organizationId: string;
  organizationName: string;
  items: Array<{ id: string; name: string; unit: string; quantity: string }>;
}

interface InventoryOption {
  id: string;
  name: string;
  available: string;
}

interface CreateAllocationProps {
  requests: VerifiedRequest[];
  inventory: InventoryOption[];
}

export function CreateAllocation({ requests, inventory }: CreateAllocationProps) {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const selectedRequest = requests.find((r) => r.id === selectedRequestId);

  function openDialog() {
    setSelectedRequestId(null);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setSelectedRequestId(null);
  }

  if (!dialogOpen) {
    return (
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
      >
        Create Allocation
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeDialog} />

      <div className="relative w-full max-w-2xl bg-surface p-6 rounded-lg shadow-xl border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Create Allocation</h2>
          <button
            type="button"
            onClick={closeDialog}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-secondary"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-muted mb-6">
          Select a verified emergency request from another organization, then
          specify which items and quantities your organization will provide.
        </p>

        {requests.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface-secondary p-6 text-center text-sm text-muted">
            No verified requests available for your organization to respond to.
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted">Select Request</p>
            <div className="space-y-2">
              {requests.map((req) => (
                <button
                  key={req.id}
                  type="button"
                  onClick={() => setSelectedRequestId(req.id)}
                  className={`flex items-center justify-between w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    selectedRequestId === req.id
                      ? "bg-primary/10 text-primary border-primary"
                      : "text-foreground hover:bg-surface-secondary border-border"
                  }`}
                >
                  <div>
                    <p className="font-medium">{req.title}</p>
                    <p className="text-xs text-muted">
                      {req.requestNumber} · {req.organizationName}
                    </p>
                  </div>
                  {selectedRequestId === req.id && <span className="text-primary">Selected</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedRequest && (
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs font-medium text-muted mb-3">
              Allocate Items for {selectedRequest.title}
            </p>
            <MultiAllocateForm
              requestId={selectedRequest.id}
              items={selectedRequest.items.map((i) => ({
                id: i.id,
                name: i.name,
                unit: i.unit,
                quantity: i.quantity,
              }))}
              inventory={inventory}
            />
          </div>
        )}
      </div>
    </div>
  );
}
