import { cookies } from "next/headers";
import AccessForm from "@/app/components/access-form";
import GameNightBoard from "@/app/components/game-night-board";
import { isValidSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("friend-game-night")?.value;

  return token && isValidSession(token) ? <GameNightBoard /> : <AccessForm />;
}
