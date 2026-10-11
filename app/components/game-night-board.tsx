"use client";

import { FormEvent, useEffect, useState } from "react";

type Signup = { id: string; player_name: string };
type GameNight = {
  id: string;
  game: string;
  starts_at: string;
  platform: string;
  host_name: string;
  max_players: number;
  notes: string | null;
  signups: Signup[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function GameNightBoard() {
  const [nights, setNights] = useState<GameNight[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [game, setGame] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [platform, setPlatform] = useState("");
  const [hostName, setHostName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("4");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);

  async function loadNights() {
    setError("");
    try {
      const response = await fetch("/api/game-nights");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not load game nights.");
      setNights(result.gameNights);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load game nights.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPlayerName(window.localStorage.getItem("game-night-player") ?? "");
    void loadNights();
  }, []);

  async function createNight(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/game-nights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game,
          startsAt: new Date(startsAt).toISOString(),
          platform,
          hostName,
          maxPlayers: Number(maxPlayers),
          notes,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not create the game night.");
      setGame("");
      setStartsAt("");
      setPlatform("");
      setHostName("");
      setMaxPlayers("4");
      setNotes("");
      setMessage("Game night added. Send the crew an invite!");
      await loadNights();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the game night.");
    } finally {
      setCreating(false);
    }
  }

  async function joinNight(night: GameNight) {
    const name = playerName.trim();
    if (!name) {
      setError("Add your gamer tag above before grabbing a spot.");
      return;
    }
    setBusyId(night.id);
    setError("");
    setMessage("");
    window.localStorage.setItem("game-night-player", name);
    try {
      const response = await fetch(`/api/game-nights/${night.id}/signups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: name }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not save your spot.");
      setMessage(`You're in for ${night.game}. See you there!`);
      await loadNights();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save your spot.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="Co-op Lobby home"><span>✳</span> co-op lobby</a>
        <div className="crew-tag"><span className="status-dot" /> PRIVATE CREW</div>
      </header>

      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow"><span className="eyebrow-line" /> YOUR CREW&apos;S NEXT ADVENTURE</p>
          <h1>Make room<br />for <span>one more.</span></h1>
          <p className="hero-copy">Pick a game, lock in a time, and save your spot. The lobby is better when everyone&apos;s here.</p>
          <a className="button button-dark" href="#upcoming">Find your next game <span aria-hidden="true">↓</span></a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-ring ring-back" />
          <div className="art-ring ring-front" />
          <div className="art-spark spark-a">✦</div>
          <div className="art-spark spark-b">✳</div>
          <div className="controller">
            <div className="dpad"><i /><b /></div>
            <div className="controller-center">+</div>
            <div className="buttons"><i /><b /></div>
          </div>
          <div className="art-caption">GOOD GAMES.<br />GOOD PEOPLE.</div>
        </div>
        <div className="hero-counter"><strong>01</strong><span>LOBBY<br />STATUS</span><i /></div>
      </section>

      <section className="content-grid" id="upcoming">
        <div className="sessions-column">
          <div className="section-heading">
            <div><p className="eyebrow">THE LINEUP</p><h2>Upcoming sessions<span className="heading-period">.</span></h2></div>
            <span className="session-count">{nights.length.toString().padStart(2, "0")} SESSIONS</span>
          </div>
          {message && <p className="form-success" role="status">{message}</p>}
          {error && <p className="form-error form-error-banner" role="alert">{error}</p>}
          <div className="player-bar">
            <label htmlFor="player-name">YOUR GAMER TAG</label>
            <input id="player-name" value={playerName} onChange={(event) => setPlayerName(event.target.value)} maxLength={32} placeholder="e.g. pixelpilot" />
          </div>
          {loading ? (
            <div className="empty-state">Loading the lobby<span className="loading-dots">...</span></div>
          ) : nights.length === 0 ? (
            <div className="empty-state"><span className="empty-icon">✳</span><strong>It&apos;s quiet in here.</strong><span>Start a game night and get the crew together.</span></div>
          ) : (
            <div className="session-list">
              {nights.map((night, index) => {
                const full = night.signups.length >= night.max_players;
                return (
                  <article className="session-card" key={night.id}>
                    <div className="date-tile"><span>{formatDate(night.starts_at).split(",")[0]}</span><strong>{new Intl.DateTimeFormat(undefined, { day: "2-digit" }).format(new Date(night.starts_at))}</strong><small>{new Intl.DateTimeFormat(undefined, { month: "short" }).format(new Date(night.starts_at)).toUpperCase()}</small></div>
                    <div className="session-details">
                      <div className="session-meta"><span className="session-number">SESSION {String(index + 1).padStart(2, "0")}</span><span>·</span><span>{formatTime(night.starts_at)}</span></div>
                      <h3>{night.game}</h3>
                      <p className="session-subtitle">{night.platform} <span>·</span> hosted by {night.host_name}</p>
                      {night.notes && <p className="session-notes">{night.notes}</p>}
                      <div className="attendee-row">
                        <div className="avatar-stack" aria-label={`${night.signups.length} players signed up`}>
                          {night.signups.slice(0, 4).map((signup) => <span className="avatar" title={signup.player_name} key={signup.id}>{signup.player_name.charAt(0).toUpperCase()}</span>)}
                          {night.signups.length === 0 && <span className="no-players">No players yet</span>}
                        </div>
                        <span className="spots">{night.signups.length}/{night.max_players} PLAYERS</span>
                      </div>
                    </div>
                    <button className={`button signup-button${full ? " button-disabled" : " button-light"}`} onClick={() => void joinNight(night)} disabled={full || busyId === night.id}>
                      {busyId === night.id ? "Saving..." : full ? "Full" : "Join in"} {!full && <span aria-hidden="true">↗</span>}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
          <p className="list-footnote"><span>✳</span> Good times are better shared. Bring your best one-liners.</p>
        </div>

        <aside className="create-panel">
          <div className="panel-icon" aria-hidden="true">＋</div>
          <p className="eyebrow">HOST THE NEXT ONE</p>
          <h2>Start a<br /><span>game night.</span></h2>
          <p className="panel-copy">Got a game in mind? Put it on the board and let your friends claim a spot.</p>
          <form className="create-form" onSubmit={createNight}>
            <label htmlFor="game">GAME</label>
            <input id="game" value={game} onChange={(event) => setGame(event.target.value)} placeholder="What are we playing?" maxLength={80} required />
            <label htmlFor="starts-at">DATE &amp; TIME</label>
            <input id="starts-at" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} required />
            <div className="form-row">
              <div><label htmlFor="platform">PLATFORM</label><input id="platform" value={platform} onChange={(event) => setPlatform(event.target.value)} placeholder="PC, PS5..." maxLength={40} required /></div>
              <div><label htmlFor="max-players">PLAYER SPOTS</label><input id="max-players" type="number" value={maxPlayers} onChange={(event) => setMaxPlayers(event.target.value)} min="2" max="32" required /></div>
            </div>
            <label htmlFor="host-name">HOST GAMER TAG</label>
            <input id="host-name" value={hostName} onChange={(event) => setHostName(event.target.value)} placeholder="Who's hosting?" maxLength={32} required />
            <label htmlFor="notes">EXTRA DETAILS <span className="optional">(OPTIONAL)</span></label>
            <textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Voice chat, what to bring, house rules..." maxLength={300} rows={3} />
            <button className="button button-primary button-wide" type="submit" disabled={creating}>{creating ? "Adding..." : "Post game night"} <span aria-hidden="true">↗</span></button>
          </form>
        </aside>
      </section>
      <footer className="footer"><span>✳ co-op lobby</span><span>MADE FOR YOUR CREW, AND YOUR CREW ONLY.</span><span>GG <b>♡</b></span></footer>
    </main>
  );
}
