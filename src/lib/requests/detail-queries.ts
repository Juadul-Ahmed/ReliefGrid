
import { prisma } from "@/lib/db/prisma";
import { getEmergencyRequestScope } from "@/lib/requests/queries";

/**
 * Returns one emergency request the organization is allowed to see.
 *
 * Allocation privacy:
 * - The requesting organization sees every allocation.
 * - Other authorized organizations see only their own allocations.
 */
export async function getEmergencyRequestById(
  requestId: string,
  organizationId: string,
) {
  const request = await prisma.emergencyRequest.findFirst({
    where: {
      AND: [
        { id: requestId },
        getEmergencyRequestScope(organizationId),
      ],
    },
    select: {
      id: true,
      requestNumber: true,
      title: true,
      description: true,
      category: true,
      priority: true,
      status: true,

      organizationId: true,
      organization: {
        select: {
          id: true,
          name: true,
        },
      },

      submittedBy: {
        select: {
          id: true,
          name: true,
        },
      },

      reviewedBy: {
        select: {
          id: true,
          name: true,
        },
      },

      incident: {
        select: {
          id: true,
          incidentNumber: true,
          title: true,
        },
      },

      locationName: true,
      address: true,
      latitude: true,
      longitude: true,
      requiredBy: true,

      reviewedAt: true,
      rejectionReason: true,

      createdAt: true,
      updatedAt: true,

      items: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          name: true,
          description: true,
          quantity: true,
          unit: true,
          createdAt: true,

          allocations: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              quantity: true,
              status: true,
              dispatchedAt: true,
              deliveredAt: true,
              trackingReference: true,
              notes: true,
              createdAt: true,

              providerOrganizationId: true,
              providerOrganization: {
                select: {
                  id: true,
                  name: true,
                },
              },

              items: {
                orderBy: { createdAt: "asc" },
                select: {
                  id: true,
                  quantity: true,
                  dispatchedQuantity: true,
                  deliveredQuantity: true,
                  status: true,
                  inventoryItemId: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!request) {
    return null;
  }

  // The requesting organization sees all provider allocations.
  if (request.organizationId === organizationId) {
    return request;
  }

  // Other authorized organizations see only their own allocations.
  return {
    ...request,
    items: request.items.map((item) => ({
      ...item,
      allocations: item.allocations.filter(
        (allocation) =>
          allocation.providerOrganizationId === organizationId,
      ),
    })),
  };
}
