import { NextResponse } from "next/server";
import { restrictedService } from "@/app/lib/services/restricted-service";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const restrictedItems = await restrictedService.processRestrictedItems(req);
    return NextResponse.json(restrictedItems);
  } catch (error) {
    return NextResponse.json({ error: "Failed to process restricted items" }, { status: 500 });
  }
}