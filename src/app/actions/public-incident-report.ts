
"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";

const PUBLIC_REPORT_RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// In-memory rate limiter for public incident reports.
// Keyed by IP address, stores timestamps of submissions.
const submissionTimestamps = new Map<string, number[]>();

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  const realIp = headerList.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  const timestamps = submissionTimestamps.get(ip) ?? [];

  // Remove timestamps outside the window.
  const recent = timestamps.filter((ts) => ts > windowStart);
  submissionTimestamps.set(ip, recent);

  return recent.length >= PUBLIC_REPORT_RATE_LIMIT;
}

function recordSubmission(ip: string): void {
  const now = Date.now();
  const timestamps = submissionTimestamps.get(ip) ?? [];
  timestamps.push(now);
  submissionTimestamps.set(ip, timestamps);
}

const publicIncidentReportSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Incident title must contain at least 5 characters")
    .max(150, "Incident title cannot exceed 150 characters"),

  description: z
    .string()
    .trim()
    .min(20, "Description must contain at least 20 characters")
    .max(5000, "Description cannot exceed 5000 characters"),

  category: z.enum([
    "FIRE",
    "FLOOD",
    "EARTHQUAKE",
    "LANDSLIDE",
    "STORM",
    "MEDICAL",
    "ACCIDENT",
    "MISSING_PERSON",
    "OTHER",
  ]),

  severity: z.enum(["LOW", "MODERATE", "HIGH", "CRITICAL"]),

  locationName: z
    .string()
    .trim()
    .max(150, "Location name cannot exceed 150 characters")
    .optional(),

  address: z
    .string()
    .trim()
    .max(500, "Address cannot exceed 500 characters")
    .optional(),

  latitude: z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined
        ? undefined
        : Number(value),
    z
      .number()
      .finite("Latitude must be a valid number")
      .min(-90, "Latitude must be at least -90")
      .max(90, "Latitude cannot exceed 90")
      .optional(),
  ),

  longitude: z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined
        ? undefined
        : Number(value),
    z
      .number()
      .finite("Longitude must be a valid number")
      .min(-180, "Longitude must be at least -180")
      .max(180, "Longitude cannot exceed 180")
      .optional(),
  ),
});

type PublicIncidentReportResult =
  | {
      success: false;
      message: string;
      errors?: Partial<
        Record<
          | "title"
          | "description"
          | "category"
          | "severity"
          | "locationName"
          | "address"
          | "latitude"
          | "longitude"
          | "occurredAt",
          string[]
        >
      >;
    }
  | {
      success: true;
      message: string;
      report: {
        id: string;
        title: string;
        status: string;
      };
    };

export async function submitPublicIncidentReport(
  formData: unknown,
): Promise<PublicIncidentReportResult> {
  // Rate limiting check.
  const ip = await getClientIp();

  if (isRateLimited(ip)) {
    return {
      success: false,
      message:
        "Too many incident reports submitted from your address. Please try again later.",
    };
  }

  // Validate input.
  const validation = publicIncidentReportSchema.safeParse(formData);

  if (!validation.success) {
    return {
      success: false,
      message: "Please check the incident information.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const data = validation.data;

  try {
    // Create the incident report with PUBLIC source and RECEIVED status.
    // Status is server-controlled: guests can never set VERIFIED, ACTIVE, etc.
    // leadOrganizationId is not set: public reports enter the review queue
    // without being assigned to any organization.
    const report = await prisma.incidentReport.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        severity: data.severity,
        source: "PUBLIC",
        status: "RECEIVED",
        submitterId: null,
        locationName: data.locationName ?? null,
        address: data.address ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
      },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });

    // Record submission for rate limiting.
    recordSubmission(ip);

    return {
      success: true,
      message: "Incident report submitted successfully. It will be reviewed by our team.",
      report: {
        id: report.id,
        title: report.title,
        status: report.status,
      },
    };
  } catch (error) {
    console.error("Public incident report submission failed:", error);

    return {
      success: false,
      message:
        "Something went wrong while submitting the incident report. Please try again.",
    };
  }
}
