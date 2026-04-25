import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // defaults to auto

export async function GET() {
  try {
    return NextResponse.json("received", { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "An error occurred while fetching reviews",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
