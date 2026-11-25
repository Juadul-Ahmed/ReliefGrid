import { requireOrganization } from "@/lib/permissions/organization";
import { getStockMovements } from "@/lib/inventory/queries";
import { StockMovementFilters } from "@/components/resources/StockMovementFilters";
import { StockMovementHistory } from "@/components/resources/StockMovementHistory";

interface StockMovementsPageProps {
  searchParams: Promise<{
    type?: string;
    page?: string;
  }>;
}

export default async function StockMovementsPage({
  searchParams,
}: StockMovementsPageProps) {
  const { organizationId } = await requireOrganization();

  const params = await searchParams;

  const page = params.page ? Number(params.page) : 1;

  const result = await getStockMovements(organizationId, {
    type: params.type,
    page: Number.isFinite(page) ? page : 1,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Stock Movements
        </h1>

        <p className="mt-1 text-sm text-muted">
          Organization-wide inventory movement history.
        </p>
      </div>

      <StockMovementFilters
        type={params.type}
        actionPath="/resources/movements"
      />

      <StockMovementHistory
        page={result}
        basePath="/resources/movements"
        type={params.type}
        showResource
        hasFilters={Boolean(params.type)}
      />
    </div>
  );
}