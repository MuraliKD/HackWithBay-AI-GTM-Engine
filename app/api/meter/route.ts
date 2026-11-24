// Flexprice usage metering: forwards each metered event to Flexprice when a
// key is configured. The in-app credit balance enforces the gate locally.
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { meter, units, note } = (await req.json()) as { meter: string; units: number; note: string };
  const key = process.env.FLEXPRICE_API_KEY;
  if (!key) return NextResponse.json({ sent: false, reason: "FLEXPRICE_API_KEY missing" });
  const base = process.env.FLEXPRICE_API_URL ?? "https://api.cloud.flexprice.io/v1";
  try {
    const res = await fetch(`${base}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key },
      body: JSON.stringify({
        event_name: meter,
        external_customer_id: process.env.FLEXPRICE_CUSTOMER_ID ?? "demo-founder",
        properties: { units, note },
        timestamp: new Date().toISOString(),
        source: "4weekstartup-gtm",
      }),
    });
    return NextResponse.json({ sent: res.ok, status: res.status });
  } catch (e) {
    return NextResponse.json({ sent: false, reason: (e as Error).message });
  }
}
