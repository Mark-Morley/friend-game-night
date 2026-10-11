import { NextRequest, NextResponse } from "next/server";
import { isValidSession, SESSION_COOKIE } from "@/lib/session";
import { getSupabase } from "@/lib/supabase";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token || !isValidSession(token)) {
    return NextResponse.json({ error: "Enter the lobby to continue." }, { status: 401 });
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "The game-night database is not configured yet." }, { status: 503 });
  }

  const { id } = await context.params;
  if (!/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "That game night could not be found." }, { status: 404 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter a gamer tag to join." }, { status: 400 });
  }
  const playerName = typeof body === "object" && body !== null && "playerName" in body
    ? body.playerName
    : undefined;
  if (typeof playerName !== "string" || !playerName.trim() || playerName.length > 32) {
    return NextResponse.json({ error: "Enter a gamer tag of 1 to 32 characters." }, { status: 400 });
  }

  const { error } = await getSupabase().rpc("join_game_night", {
    p_game_night_id: id,
    p_player_name: playerName.trim(),
  });
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "That gamer tag is already signed up for this session." }, { status: 409 });
    }
    if (error.message.includes("GAME_NIGHT_FULL")) {
      return NextResponse.json({ error: "This session is full. Try another one!" }, { status: 409 });
    }
    if (error.message.includes("GAME_NIGHT_PAST")) {
      return NextResponse.json({ error: "This game night has already started." }, { status: 409 });
    }
    if (error.code === "P0002") {
      return NextResponse.json({ error: "That game night could not be found." }, { status: 404 });
    }
    console.error("Could not join game night:", error.message);
    return NextResponse.json({ error: "Could not save your spot. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ success: true }, { status: 201 });
}
