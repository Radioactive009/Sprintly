import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await prisma.user.create({
    data: {
      name: "Kislay",
      email: "kislay@sprintly.dev",
    },
  });

  return NextResponse.json(user);
}
