"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { allocateMultipleEmergencyResources } from "@/app/actions/m6-allocations";

type Item = { id: string; name: string; unit: string; quantity: string };
type Inv = { id: string; name: string; available: string };

export function MultiAllocateForm({ requestId, items, inventory }: { requestId: string; items: Item[]; inventory: Inv[] }) {
  const router = useRouter();
  const [lines, setLines] = useState([{ itemId: items[0]?.id ?? "", quantity: "", inventoryItemId: inventory[0]?.id ?? "" }]);
  const [pending, startTransition] = useTransition();

  const addLine = () => setLines((l) => [...l, { itemId: items[0]?.id ?? "", quantity: "", inventoryItemId: inventory[0]?.id ?? "" }]);
  const removeLine = (i: number) => setLines((l) => l.filter((_, idx) => idx !== i));
  const update = (i: number, key: string, v: string) => setLines((l) => l.map((x, idx) => (idx === i ? { ...x, [key]: v } : x)));

  const submit = () => {
    startTransition(async () => {
      const res = await allocateMultipleEmergencyResources({ requestId, lines });
      if (!res.success) { toast.error(res.message); return; }
      toast.success(res.message);
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      {lines.map((line, i) => (
        <div key={i} className="flex gap-2 items-center">
          <select value={line.itemId} onChange={(e) => update(i, "itemId", e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-sm">
            {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
          </select>
          <input type="number" step="0.001" value={line.quantity} onChange={(e) => update(i, "quantity", e.target.value)} placeholder="qty" className="w-24 rounded border border-border bg-background px-2 py-1 text-sm" />
          <select value={line.inventoryItemId} onChange={(e) => update(i, "inventoryItemId", e.target.value)} className="rounded border border-border bg-background px-2 py-1 text-sm">
            {inventory.map((iv) => <option key={iv.id} value={iv.id}>{iv.name} ({iv.available})</option>)}
          </select>
          <button type="button" onClick={() => removeLine(i)} className="text-xs text-red-500">remove</button>
        </div>
      ))}
      <div className="flex gap-2">
        <button type="button" onClick={addLine} className="text-xs text-primary">+ line</button>
        <button type="button" onClick={submit} disabled={pending} className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50">{pending ? "Allocating..." : "Allocate"}</button>
      </div>
    </div>
  );
}