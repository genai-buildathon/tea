import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_BACKEND_BASE ||
  "https://tea-server-760751063280.us-central1.run.app";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agent: string }> }
) {
  try {
    const body = await request.json();
    const { agent } = await params;

    const response = await fetch(`${BACKEND_BASE}/connections/${agent}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Connection creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
