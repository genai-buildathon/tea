import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_BACKEND_BASE ||
  "https://tea-server-760751063280.us-central1.run.app";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agent: string; connectionId: string }> }
) {
  try {
    const body = await request.json();
    const { agent, connectionId } = await params;

    // 言語設定をログ出力（デバッグ用）
    if (body.language) {
      console.log(`SSE mode request with language: ${body.language}`);
    }

    const response = await fetch(
      `${BACKEND_BASE}/sse/${agent}/${connectionId}/mode`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data);
  } catch (error) {
    console.error("SSE mode proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
