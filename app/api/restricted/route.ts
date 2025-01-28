import { NextResponse } from "next/server";
import { restrictedService } from "@/app/lib/services/restricted-service";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    console.log("Restricted items route called");
  try {
    const restrictedItems = await restrictedService.processRestrictedItems(req);
    console.log(restrictedItems);
    return NextResponse.json(restrictedItems);
  } catch (error) {
    return NextResponse.json({ error: "Failed to process restricted items" }, { status: 500 });
  }
}