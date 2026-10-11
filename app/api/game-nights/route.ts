import { NextRequest, NextResponse } from "next/server";
import { isValidSession, SESSION_COOKIE } from "@/lib/session";
import { getSupabase } from "@/lib/supabase";

function authorized(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return Boolean(token && isValidSession(token));
}

function databaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Enter the lobby to continue." }, { status: 401 });
  if (!databaseConfigured()) return NextResponse.json({ error: "The game-night database is not configured yet." }, { status: 503 });

  const { data, error } = await getSupabase()
    .from("game_nights")
    .select("id, game, starts_at, platform, host_name, max_players, notes, signups(id, player_name)")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });
  if (error) {
    console.error("Could not load game nights:", error.message);
    return NextResponse.json({ error: "Could not load game nights. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ gameNights: data });
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Enter the lobby to continue." }, { status: 401 });
  if (!databaseConfigured()) return NextResponse.json({ error: "The game-night database is not configured yet." }, { status: 503 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The game night details are invalid." }, { status: 400 });
  }
  const values = typeof body === "object" && body !== null ? body : {};
  const { game, startsAt, platform, hostName, maxPlayers, notes } = values as Record<string, unknown>;
  if (
    typeof game !== "string" || !game.trim() || game.length > 80 ||
    typeof startsAt !== "string" || !Number.isFinite(Date.parse(startsAt)) || Date.parse(startsAt) <= Date.now() ||
    typeof platform !== "string" || !platform.trim() || platform.length > 40 ||
    typeof hostName !== "string" || !hostName.trim() || hostName.length > 32 ||
    typeof maxPlayers !== "number" || !Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 32 ||
    (notes !== undefined && notes !== null && (typeof notes !== "string" || notes.length > 300))
  ) {
    return NextResponse.json({ error: "Check the game night details and try again." }, { status: 400 });
  }

  const { error } = await getSupabase().from("game_nights").insert({
    game: game.trim(),
    starts_at: new Date(startsAt).toISOString(),
    platform: platform.trim(),
    host_name: hostName.trim(),
    max_players: maxPlayers,
    notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
  });
  if (error) {
    console.error("Could not create game night:", error.message);
    return NextResponse.json({ error: "Could not create the game night. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ success: true }, { status: 201 });
}
