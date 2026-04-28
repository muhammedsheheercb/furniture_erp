import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import { User } from "@/lib/models/base";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await dbConnect();

    // Check if any user exists
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      // In a real single-owner app, you might want to disable registration after the first user
      // But for this demo, I'll just check if the email exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return NextResponse.json({ error: "User already exists" }, { status: 400 });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "owner",
    });

    return NextResponse.json({ message: "User created successfully" }, { status: 201 });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
