import { seedState, LEAGUE } from "./data.js";
import { byPoints, uid } from "./utils.js";

const STORAGE_KEY = "imex.league.v2";
const CONFIG_KEY = "imex.supabase.v1";
const SUPABASE_TABLE = "app_state";
const DRAFT_SECONDS = 45;

function defaultDraft() {
  return {
    status: "setup",
    round: 1,
    order: [],
    pickIndex: 0,
    currentTeamId: null,
    turnStartedAt: null,
    poolPlayerIds: [],
    picks: [],
    skippedTurns: [],
    secondsPerPick: DRAFT_SECONDS
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}");
    return {
      url: saved.url || window.IMEX_CONFIG?.supabaseUrl || "",
      key: saved.key || window.IMEX_CONFIG?.supabaseAnonKey || ""
    };
  } catch {
    return { url: window.IMEX_CONFIG?.supabaseUrl || "", key: window.IMEX_CONFIG?.supabaseAnonKey || "" };
  }
}

class Store {
  constructor() {
    this.state = this.normalize(seedState());
    this.listeners = new Set();
    this.user = null;
    this.clientId = uid("client");
    this.channel = null;
    this.supabase = null;
    this.remoteReady = false;
    this.remoteError = "";
    this.saving = false;
    this.saveTimer = 0;
  }

  async init() {
    this.load();
    this.openChannel();
    await this.initSupabase();
    this.notify();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.state = this.normalize(JSON.parse(raw));
    } catch (error) {
      console.warn("No se pudo leer el estado local:", error);
    }
  }

  normalize(input) {
    const base = seedState();
    if (!input || typeof input !== "object") return base;
    const state = {
      ...base,
      ...input,
      league: { ...base.league, ...(input.league || {}) },
      fantasy: { ...base.fantasy, ...(input.fantasy || {}) }
    };
    for (const key of ["teams", "players", "matches", "transfers", "finances", "news", "cards", "dice", "accounts", "activity"]) {
      if (!Array.isArray(state[key])) state[key] = base[key];
    }
    if (!Array.isArray(state.fantasy.managers)) state.fantasy.managers = base.fantasy.managers;
    state.league.marketOverride = typeof state.league.marketOverride === "boolean" ? state.league.marketOverride : null;
    state.league.tournamentStarted = state.league.tournamentStarted === true;
    delete state.league.marketOpen;
    state.draft = { ...defaultDraft(), ...(input.draft || {}) };
    if (!Array.isArray(state.draft.picks)) state.draft.picks = [];
    if (!Array.isArray(state.draft.skippedTurns)) state.draft.skippedTurns = [];
    if (!Array.isArray(state.draft.poolPlayerIds)) state.draft.poolPlayerIds = [];
    if (!Array.isArray(state.draft.order)) state.draft.order = [];
    state.auction = { lots: Array.isArray(input.auction?.lots) ? input.auction.lots : [] };
    state.updatedAt = state.updatedAt || new Date().toISOString();
    return state;
  }

  openChannel() {
    if (typeof BroadcastChannel !== "undefined") {
      this.channel = new BroadcastChannel("imex-league");
      this.channel.addEventListener("message", (event) => {
        const message = event.data;
        if (!message || message.clientId === this.clientId || message.type !== "state") return;
        this.applyExternal(message.state);
      });
    }
    window.addEventListener("storage", (event) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        this.applyExternal(JSON.parse(event.newValue));
      } catch {
        /* ignore malformed payloads */
      }
    });
  }

  applyExternal(state) {
    if (!state || !state.updatedAt) return;
    if (new Date(state.updatedAt).getTime() <= new Date(this.state.updatedAt).getTime()) return;
    this.state = this.normalize(state);
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) listener(this.state);
  }

  setUser(user) {
    this.user = user || null;
    this.notify();
  }

  isAdmin() {
    return this.user?.role === "ADMIN";
  }

  isPresident() {
    return this.user?.role === "PRESIDENT";
  }

  isPlayer() {
    return this.user?.role === "PLAYER";
  }

  save(reason = "update") {
    this.state.updatedAt = new Date().toISOString();
    this.state.version = 1;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      this.lastError = "No hay espacio local suficiente. Elimina alguna foto o exporta el respaldo.";
      console.warn(this.lastError, error);
    }
    if (this.channel) {
      this.channel.postMessage({ type: "state", clientId: this.clientId, state: this.state, reason });
    }
    this.queueRemoteSave(reason);
    this.notify();
  }

  team(id) {
    return this.state.teams.find((team) => team.id === id) || null;
  }

  player(id) {
    return this.state.players.find((player) => player.id === id) || null;
  }

  account(id) {
    return this.state.accounts.find((account) => account.id === id) || null;
  }

  match(id) {
    return this.state.matches.find((match) => match.id === id) || null;
  }

  teamPlayers(teamId) {
    return this.state.players.filter((player) => player.teamId === teamId);
  }

  teamValue(teamId) {
    return this.teamPlayers(teamId).reduce((sum, player) => sum + (Number(player.value) || 0), 0);
  }

  standings(group = null) {
    const rows = this.state.teams
      .filter((team) => !group || team.group === group)
      .map((team) => ({
        team,
        name: team.name,
        id: team.id,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        points: 0,
        form: []
      }));
    const index = new Map(rows.map((row) => [row.id, row]));
    for (const match of this.state.matches) {
      if (match.status !== "finished" || match.homeScore === null || match.awayScore === null) continue;
      const home = index.get(match.homeTeamId);
      const away = index.get(match.awayTeamId);
      if (!home || !away) continue;
      home.played += 1;
      away.played += 1;
      home.gf += match.homeScore;
      home.ga += match.awayScore;
      away.gf += match.awayScore;
      away.ga += match.homeScore;
      if (match.homeScore > match.awayScore) {
        home.won += 1;
        away.lost += 1;
        home.points += 3;
        home.form.push("G");
        away.form.push("P");
      } else if (match.homeScore < match.awayScore) {
        away.won += 1;
        home.lost += 1;
        away.points += 3;
        away.form.push("G");
        home.form.push("P");
      } else {
        home.drawn += 1;
        away.drawn += 1;
        home.points += 1;
        away.points += 1;
        home.form.push("E");
        away.form.push("E");
      }
    }
    for (const row of rows) {
      row.gd = row.gf - row.ga;
      row.form = row.form.slice(-5);
    }
    return rows.sort(byPoints);
  }

  standingsMap() {
    const map = new Map();
    for (const row of this.standings()) map.set(row.id, row);
    return map;
  }

  scorers(limit = 10) {
    return [...this.state.players]
      .sort((a, b) => b.goals - a.goals || b.assists - a.assists || a.name.localeCompare(b.name, "es"))
      .slice(0, limit);
  }

  upcoming(limit = 6) {
    return this.state.matches
      .filter((match) => match.status !== "finished")
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
      .slice(0, limit);
  }

  results(limit = 6) {
    return this.state.matches
      .filter((match) => match.status === "finished")
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
      .slice(0, limit);
  }

  nextMatch() {
    return this.upcoming(1)[0] || null;
  }

  fantasyPoints(player) {
    if (!player) return 0;
    return (Number(player.goals) || 0) * 4 + (Number(player.assists) || 0) * 3 + (player.position === "POR" ? 3 : 0) + (player.insignia ? 3 : 0);
  }

  fantasyManagers() {
    return this.state.fantasy.managers.map((manager) => {
      const lineup = manager.lineup.map((id) => this.player(id)).filter(Boolean);
      const points = lineup.reduce((sum, player) => sum + this.fantasyPoints(player), 0);
      const spent = lineup.reduce((sum, player) => sum + (Number(player.value) || 0), 0);
      return { ...manager, points, spent };
    }).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, "es"));
  }

  myFantasy(accountId) {
    return this.state.fantasy.managers.find((manager) => manager.accountId === accountId) || null;
  }

  addActivity(type, text) {
    this.state.activity.unshift({ id: uid("act"), type, text, at: new Date().toISOString() });
    this.state.activity = this.state.activity.slice(0, 40);
  }

  addFinance(teamId, type, concept, amount, date = new Date().toISOString().slice(0, 10)) {
    if (!amount) return;
    this.state.finances.unshift({ id: uid("fin"), teamId, type, concept, amount: Math.abs(amount), date });
  }

  adjustBalance(teamId, amount, concept) {
    const team = this.team(teamId);
    if (!team || !amount) return;
    team.balance = Number(team.balance) + Number(amount);
    this.addFinance(teamId, amount >= 0 ? "income" : "expense", concept, Math.abs(amount));
    this.addActivity("finance", `${team.name}: ${amount >= 0 ? "+" : "−"}${Math.abs(amount)} M · ${concept}`);
    this.save("finance");
  }

  updateLeague(patch) {
    this.state.league = { ...this.state.league, ...patch };
    this.addActivity("league", "Se actualizó la configuración de la liga.");
    this.save("league");
  }

  updateTeam(teamId, patch) {
    const team = this.team(teamId);
    if (!team) return { ok: false, message: "Equipo no encontrado." };
    Object.assign(team, patch);
    team.squadValue = this.teamValue(teamId);
    this.addActivity("team", `Se actualizó ${team.name}.`);
    this.save("team");
    return { ok: true };
  }

  createTeam(data) {
    const id = uid("team");
    const team = {
      id,
      name: data.name || "Nuevo club",
      short: (data.short || data.name?.slice(0, 3) || "NEW").toUpperCase().slice(0, 4),
      president: data.president || "Por asignar",
      group: data.group || "A",
      primary: data.primary || "#171717",
      secondary: data.secondary || "#f3f1eb",
      mark: data.mark || "shield",
      balance: Number(data.balance) || 200,
      squadValue: 0,
      clausulazoUsed: false,
      crestUrl: ""
    };
    this.state.teams.push(team);
    this.addActivity("team", `Se creó ${team.name}.`);
    this.save("team-create");
    return team;
  }

  updatePlayer(playerId, patch) {
    const player = this.player(playerId);
    if (!player) return { ok: false, message: "Jugador no encontrado." };
    Object.assign(player, patch);
    if (patch.teamId && patch.teamId !== player.teamId) {
      const team = this.team(patch.teamId);
      if (team) player.teamId = team.id;
    }
    const team = this.team(player.teamId);
    if (team) team.squadValue = this.teamValue(team.id);
    this.addActivity("player", `Se actualizó la ficha de ${player.name}.`);
    this.save("player");
    return { ok: true };
  }

  createPlayer(data) {
    const team = this.team(data.teamId);
    if (!team) return { ok: false, message: "Selecciona un equipo válido." };
    const player = {
      id: uid("player"),
      teamId: team.id,
      name: data.name || "Nuevo jugador",
      nickname: data.nickname || "",
      position: data.position || "MED",
      number: Number(data.number) || 0,
      value: Number(data.value) || 15,
      goals: Number(data.goals) || 0,
      assists: Number(data.assists) || 0,
      yellow: Number(data.yellow) || 0,
      red: Number(data.red) || 0,
      played: Number(data.played) || 0,
      height: Number(data.height) || 0,
      weight: Number(data.weight) || 0,
      strongFoot: data.strongFoot === "left" ? "left" : data.strongFoot === "both" ? "both" : "right",
      weakFoot: Math.min(5, Math.max(1, Number(data.weakFoot) || 3)),
      insignia: Boolean(data.insignia),
      photoUrl: "",
      status: data.insignia ? "insignia" : "available"
    };
    this.state.players.push(player);
    team.squadValue = this.teamValue(team.id);
    this.addActivity("player", `${player.name} se incorporó a ${team.name}.`);
    this.save("player-create");
    return { ok: true, player };
  }

  deletePlayer(playerId) {
    const player = this.player(playerId);
    if (!player) return;
    const team = this.team(player.teamId);
    this.state.players = this.state.players.filter((item) => item.id !== playerId);
    this.state.fantasy.managers.forEach((manager) => {
      manager.lineup = manager.lineup.filter((id) => id !== playerId);
    });
    if (team) team.squadValue = this.teamValue(team.id);
    this.addActivity("player", `Se eliminó a ${player.name} del registro.`);
    this.save("player-delete");
  }

  recordResult(matchId, payload) {
    const match = this.match(matchId);
    if (!match) return { ok: false, message: "Partido no encontrado." };
    const homeScore = Number(payload.homeScore);
    const awayScore = Number(payload.awayScore);
    if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) {
      return { ok: false, message: "Introduce un marcador válido." };
    }
    const home = this.team(match.homeTeamId);
    const away = this.team(match.awayTeamId);
    if (!home || !away) return { ok: false, message: "El partido no tiene ambos equipos asignados." };

    if (match.settled && match.rewards) {
      home.balance -= Number(match.rewards.home) || 0;
      away.balance -= Number(match.rewards.away) || 0;
      this.addFinance(home.id, "expense", "Reversión de resultado anterior", match.rewards.home || 0);
      this.addFinance(away.id, "expense", "Reversión de resultado anterior", match.rewards.away || 0);
    }

    match.homeScore = homeScore;
    match.awayScore = awayScore;
    match.mvpPlayerId = payload.mvpPlayerId || null;
    match.notes = payload.notes ?? match.notes;
    match.status = "finished";
    match.settled = true;

    let homeReward = 0;
    let awayReward = 0;
    if (homeScore > awayScore) {
      homeReward = this.state.league.winReward;
    } else if (homeScore < awayScore) {
      awayReward = this.state.league.winReward;
    } else {
      homeReward = this.state.league.drawReward;
      awayReward = this.state.league.drawReward;
    }
    home.balance += homeReward;
    away.balance += awayReward;
    match.rewards = { home: homeReward, away: awayReward };
    this.addFinance(home.id, "income", `Resultado ${match.title || `Jornada ${match.matchday}`} vs ${away.name}`, homeReward);
    this.addFinance(away.id, "income", `Resultado ${match.title || `Jornada ${match.matchday}`} vs ${home.name}`, awayReward);
    this.addActivity("result", `${home.name} ${homeScore}–${awayScore} ${away.name} · ${match.title || `Jornada ${match.matchday}`}`);
    this.save("result");
    return { ok: true };
  }

  createMatch(data) {
    const match = {
      id: uid("match"),
      matchday: Number(data.matchday) || 1,
      phase: data.phase || "groups",
      group: data.group || null,
      title: data.title || "",
      homeTeamId: data.homeTeamId || null,
      awayTeamId: data.awayTeamId || null,
      homeScore: null,
      awayScore: null,
      status: "scheduled",
      date: data.date || "",
      time: data.time || "",
      pitch: data.pitch || "Cancha Principal IMEX",
      mvpPlayerId: null,
      scorers: [],
      bookings: [],
      cardsUsed: [],
      diceEvent: "Pendiente",
      notes: data.notes || "",
      settled: false,
      rewards: null
    };
    this.state.matches.push(match);
    this.addActivity("match", `Se programó ${this.team(match.homeTeamId)?.name || "TBD"} vs ${this.team(match.awayTeamId)?.name || "TBD"}.`);
    this.save("match-create");
    return match;
  }

  executeClausulazo(playerId, buyerTeamId) {
    const player = this.player(playerId);
    const buyer = this.team(buyerTeamId);
    if (!player || !buyer) return { ok: false, message: "No se encontró el jugador o el club." };
    if (!this.isMarketOpen()) return { ok: false, message: "El mercado está cerrado." };
    if (this.user?.role !== "ADMIN" && buyerTeamId !== this.user?.teamId) return { ok: false, message: "Solo el presidente del club puede ejecutar el clausulazo." };
    if (player.teamId === buyerTeamId) return { ok: false, message: "Ese jugador ya pertenece a tu club." };
    if (player.insignia) return { ok: false, message: "Los jugadores insignia están blindados." };
    if (buyer.clausulazoUsed) return { ok: false, message: "Tu club ya utilizó su clausulazo en este mercado." };
    if (Number(buyer.balance) < Number(player.value)) return { ok: false, message: "Saldo insuficiente para pagar la cláusula." };
    const seller = this.team(player.teamId);
    const price = Number(player.value) || 0;
    buyer.balance -= price;
    if (seller) seller.balance += price;
    player.teamId = buyer.id;
    player.status = "available";
    buyer.clausulazoUsed = true;
    if (seller) seller.squadValue = this.teamValue(seller.id);
    buyer.squadValue = this.teamValue(buyer.id);
    this.addFinance(buyer.id, "expense", `Clausulazo por ${player.name}`, price);
    this.addFinance(seller.id, "income", `Venta de ${player.name} (clausulazo)`, price);
    this.state.transfers.unshift({
      id: uid("tr"),
      buyerTeamId: buyer.id,
      sellerTeamId: seller?.id || null,
      playerId: player.id,
      offeredPlayerIds: [],
      price,
      type: "clausulazo",
      status: "completed",
      date: new Date().toISOString().slice(0, 16).replace("T", " "),
      notes: `Clausulazo ejecutado por ${buyer.name}.`
    });
    this.addActivity("transfer", `${buyer.name} fichó a ${player.name} por ${price} M (clausulazo).`);
    this.save("clausulazo");
    return { ok: true, message: `${player.name} ya es jugador de ${buyer.name}.` };
  }

  makeOffer({ buyerTeamId, sellerTeamId, playerId, price, offeredPlayerIds = [] }) {
    const buyer = this.team(buyerTeamId);
    const seller = this.team(sellerTeamId);
    const player = this.player(playerId);
    if (!buyer || !seller || !player) return { ok: false, message: "Revisa el club y el jugador." };
    if (buyer.id === seller.id) return { ok: false, message: "No puedes negociar contigo mismo." };
    if (player.teamId !== seller.id) return { ok: false, message: "El jugador no pertenece a ese club." };
    if (player.insignia) return { ok: false, message: "Los jugadores insignia no entran en negociaciones." };
    if (!this.isMarketOpen()) return { ok: false, message: "El mercado está cerrado." };
    const amount = Number(price) || 0;
    if (amount > Number(buyer.balance)) return { ok: false, message: "La oferta supera el saldo disponible." };
    const transfer = {
      id: uid("tr"),
      buyerTeamId,
      sellerTeamId,
      playerId,
      offeredPlayerIds: offeredPlayerIds.filter(Boolean),
      price: amount,
      type: offeredPlayerIds.length ? "swap_and_cash" : "cash",
      status: "pending",
      date: new Date().toISOString().slice(0, 16).replace("T", " "),
      notes: "Oferta enviada desde la plataforma."
    };
    this.state.transfers.unshift(transfer);
    this.addActivity("offer", `${buyer.name} envió una oferta por ${player.name}.`);
    this.save("offer");
    return { ok: true, transfer };
  }

  respondOffer(transferId, accept) {
    const transfer = this.state.transfers.find((item) => item.id === transferId);
    if (!transfer || transfer.status !== "pending") return { ok: false, message: "La oferta ya no está disponible." };
    if (this.user?.role !== "ADMIN" && this.user?.teamId !== transfer.sellerTeamId) {
      return { ok: false, message: "Solo el club vendedor puede responder." };
    }
    const buyer = this.team(transfer.buyerTeamId);
    const seller = this.team(transfer.sellerTeamId);
    const player = this.player(transfer.playerId);
    if (!buyer || !seller || !player) return { ok: false, message: "Faltan datos de la operación." };
    if (!accept) {
      transfer.status = "rejected";
      this.addActivity("offer", `${seller.name} rechazó la oferta por ${player.name}.`);
      this.save("offer-reject");
      return { ok: true, message: "Oferta rechazada." };
    }
    if (Number(buyer.balance) < Number(transfer.price)) return { ok: false, message: "El comprador ya no tiene saldo suficiente." };
    buyer.balance -= Number(transfer.price) || 0;
    seller.balance += Number(transfer.price) || 0;
    const offered = (transfer.offeredPlayerIds || []).map((id) => this.player(id)).filter(Boolean);
    for (const item of offered) {
      if (item.teamId === buyer.id) item.teamId = seller.id;
    }
    player.teamId = buyer.id;
    buyer.squadValue = this.teamValue(buyer.id);
    seller.squadValue = this.teamValue(seller.id);
    transfer.status = "accepted";
    this.addFinance(buyer.id, "expense", `Fichaje de ${player.name}`, transfer.price);
    this.addFinance(seller.id, "income", `Venta de ${player.name}`, transfer.price);
    this.addActivity("transfer", `${seller.name} aceptó la oferta de ${buyer.name} por ${player.name}.`);
    this.save("offer-accept");
    return { ok: true, message: "Oferta aceptada y plantillas actualizadas." };
  }

  // Mercado: sin ajuste manual (marketOverride null) está abierto solo los miércoles (hora de México, UTC-6).
  // El organizador puede forzarlo a abierto (true) o cerrado (false), o volver a automático (null).
  isMarketOpen(now = new Date()) {
    const override = this.state.league.marketOverride;
    if (typeof override === "boolean") return override;
    const mexicoTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    return mexicoTime.getUTCDay() === 3;
  }

  // Fecha de cierre visible: en automático, medianoche del miércoles (hora de México); si el organizador fuerza, marketClosesAt.
  marketCloseAt(now = new Date()) {
    if (typeof this.state.league.marketOverride === "boolean") return this.state.league.marketClosesAt;
    const mexicoTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const midnightMexico = new Date(Date.UTC(mexicoTime.getUTCFullYear(), mexicoTime.getUTCMonth(), mexicoTime.getUTCDate() + 1, 6, 0, 0));
    return midnightMexico.toISOString();
  }

  toggleMarket(override, closesAt) {
    this.state.league.marketOverride = typeof override === "boolean" ? override : null;
    if (closesAt) this.state.league.marketClosesAt = closesAt;
    const open = this.isMarketOpen();
    const mode = override === null ? "automático (miércoles)" : override ? "abierto manualmente" : "cerrado manualmente";
    this.addActivity("market", `Mercado ${open ? "abierto" : "cerrado"} · modo ${mode}.`);
    this.save("market");
  }

  resetClausulazos() {
    this.state.teams.forEach((team) => { team.clausulazoUsed = false; });
    this.addActivity("market", "Se reiniciaron los clausulazos de todos los clubes.");
    this.save("clausulazos");
  }

  saveFantasyLineup({ accountId, managerName, lineup }) {
    const ids = [...new Set(lineup.filter(Boolean))];
    if (ids.length !== 5) return { ok: false, message: "Selecciona exactamente cinco jugadores." };
    const players = ids.map((id) => this.player(id)).filter(Boolean);
    if (players.length !== 5) return { ok: false, message: "Algún jugador ya no está disponible." };
    const counts = players.reduce((acc, player) => {
      acc[player.position] = (acc[player.position] || 0) + 1;
      return acc;
    }, {});
    if (counts.POR !== 1 || counts.DEF !== 1 || counts.MED !== 1 || counts.DEL !== 2) {
      return { ok: false, message: "La formación requiere 1 POR, 1 DEF, 1 MED y 2 DEL." };
    }
    const spent = players.reduce((sum, player) => sum + Number(player.value || 0), 0);
    if (spent > Number(this.state.fantasy.budget)) {
      return { ok: false, message: `Te pasaste del presupuesto: ${spent} M de ${this.state.fantasy.budget} M.` };
    }
    let manager = this.state.fantasy.managers.find((item) => item.accountId === accountId);
    if (manager) {
      manager.name = managerName || manager.name;
      manager.lineup = ids;
    } else {
      manager = { id: uid("fm"), accountId, name: managerName || "Mi equipo", owner: this.user?.name || "Manager", lineup: ids };
      this.state.fantasy.managers.push(manager);
    }
    this.addActivity("fantasy", `Se guardó el quinteto de ${manager.name}.`);
    this.save("fantasy");
    return { ok: true, manager };
  }

  deleteFantasyManager(managerId) {
    this.state.fantasy.managers = this.state.fantasy.managers.filter((manager) => manager.id !== managerId);
    this.addActivity("fantasy", "Se eliminó un equipo de Fantasy.");
    this.save("fantasy-delete");
  }

  publishNews(article) {
    if (article.id) {
      const current = this.state.news.find((item) => item.id === article.id);
      if (current) Object.assign(current, article);
    } else {
      this.state.news.unshift({
        id: uid("news"),
        title: article.title,
        category: article.category || "Torneo",
        date: article.date || new Date().toISOString().slice(0, 10),
        time: article.time || "12:00",
        important: Boolean(article.important),
        author: article.author || "IMEX League",
        excerpt: article.excerpt || "",
        body: article.body || ""
      });
    }
    this.addActivity("news", `Nueva publicación: ${article.title}.`);
    this.save("news");
  }

  deleteNews(id) {
    this.state.news = this.state.news.filter((item) => item.id !== id);
    this.addActivity("news", "Se eliminó una publicación.");
    this.save("news-delete");
  }

  addAccount(account) {
    this.state.accounts.push(account);
    this.save("account");
  }

  updateAccount(id, patch) {
    const account = this.account(id);
    if (!account) return;
    Object.assign(account, patch);
    this.save("account");
  }

  deleteAccount(id) {
    this.state.accounts = this.state.accounts.filter((account) => account.id !== id);
    this.state.fantasy.managers = this.state.fantasy.managers.filter((manager) => manager.accountId !== id);
    this.save("account-delete");
  }

  // --- DRAFT EN VIVO ---
  // Los resultados se devuelven como { ok, message } para que la vista los muestre como avisos.
  requireOrganizer() {
    return this.isAdmin() ? null : { ok: false, message: "Solo el organizador puede hacer esto." };
  }

  canActForClub(teamId) {
    return this.isAdmin() || (this.isPresident() && this.user?.teamId === teamId);
  }

  prepareDraft() {
    const denied = this.requireOrganizer();
    if (denied) return denied;
    const order = this.state.teams.map((team) => team.id);
    if (order.length < 2 || !this.state.players.length) {
      return { ok: false, message: "Registra al menos dos clubes y un jugador antes de iniciar el draft." };
    }
    const budget = Number(this.state.league.budgetPerTeam) || 200;
    this.state.players.forEach((player) => {
      player.teamId = null;
      player.status = player.insignia ? "insignia" : "available";
    });
    this.state.teams.forEach((team) => {
      team.balance = budget;
      team.squadValue = 0;
      team.clausulazoUsed = false;
    });
    this.state.draft = {
      ...defaultDraft(),
      status: "live",
      order,
      currentTeamId: order[0],
      turnStartedAt: Date.now(),
      poolPlayerIds: this.state.players.map((player) => player.id)
    };
    this.addActivity("draft", "Ha comenzado el draft en vivo.");
    this.save("draft-start");
    return { ok: true, message: "Draft iniciado. Los presidentes ya pueden elegir." };
  }

  getDraftSecondsRemaining() {
    const draft = this.state.draft;
    if (draft.status !== "live" || !draft.turnStartedAt) return 0;
    const limit = Number(draft.secondsPerPick) || DRAFT_SECONDS;
    return Math.max(0, limit - Math.floor((Date.now() - draft.turnStartedAt) / 1000));
  }

  // Serpiente: al terminar una ronda se invierte el orden. Sin guardar; lo hacen los llamadores.
  advanceDraftTurn() {
    const draft = this.state.draft;
    const next = draft.pickIndex + 1;
    if (next >= draft.order.length) {
      draft.round += 1;
      draft.pickIndex = 0;
      draft.order.reverse();
    } else {
      draft.pickIndex = next;
    }
    if (!draft.poolPlayerIds.length) {
      draft.status = "completed";
      draft.currentTeamId = null;
      draft.turnStartedAt = null;
    } else {
      draft.currentTeamId = draft.order[draft.pickIndex];
      draft.turnStartedAt = Date.now();
    }
  }

  skipDraftTurn(reason = "timeout") {
    const draft = this.state.draft;
    if (draft.status !== "live") return false;
    if (reason !== "timeout" && !this.isAdmin()) return false;
    const team = this.team(draft.currentTeamId);
    draft.skippedTurns.push({ teamId: draft.currentTeamId, round: draft.round, reason, at: Date.now() });
    this.addActivity("draft", `${team?.name || "Un club"} pierde su turno (${reason === "timeout" ? "tiempo agotado" : "saltado por el organizador"}).`);
    this.advanceDraftTurn();
    this.save("draft-skip");
    return true;
  }

  // Llamado desde el cronómetro de cada cliente: devuelve true si expiró el turno.
  expireDraftTurn() {
    if (this.state.draft.status !== "live" || this.getDraftSecondsRemaining() > 0) return false;
    return this.skipDraftTurn("timeout");
  }

  pickDraftPlayer(teamId, playerId) {
    const draft = this.state.draft;
    if (draft.status !== "live") return { ok: false, message: "El draft todavía no está activo." };
    if (!this.canActForClub(teamId)) return { ok: false, message: "Solo el presidente de ese club puede elegir." };
    if (draft.currentTeamId !== teamId) return { ok: false, message: "No es el turno de este club." };
    if (!draft.poolPlayerIds.includes(playerId)) return { ok: false, message: "Ese jugador ya fue elegido." };
    const player = this.player(playerId);
    const team = this.team(teamId);
    if (!player || !team) return { ok: false, message: "Jugador o club no encontrado." };

    player.teamId = team.id;
    player.status = player.insignia ? "insignia" : "available";
    team.squadValue = this.teamValue(team.id);
    draft.poolPlayerIds = draft.poolPlayerIds.filter((id) => id !== playerId);
    draft.picks.push({ playerId, teamId, round: draft.round, pickedAt: Date.now() });
    this.addActivity("draft", `${team.name} elige a ${player.name} (ronda ${draft.round}).`);
    this.advanceDraftTurn();
    this.save("draft-pick");
    return { ok: true, message: `${player.name} ya es jugador de ${team.name}.` };
  }

  // --- SUBASTA FINAL ---
  highestBid(lot) {
    return Object.entries(lot.bids || {}).reduce(
      (best, [teamId, amount]) => (Number(amount) > best.amount ? { teamId, amount: Number(amount) } : best),
      { teamId: null, amount: 0 }
    );
  }

  createAuctionLot(playerId) {
    const denied = this.requireOrganizer();
    if (denied) return denied;
    const player = this.player(playerId);
    if (!player) return { ok: false, message: "Jugador no encontrado." };
    if (this.state.auction.lots.some((lot) => lot.playerId === playerId && lot.status === "open")) {
      return { ok: false, message: "Ese jugador ya tiene un lote abierto." };
    }
    this.state.auction.lots.unshift({
      id: uid("lot"),
      playerId,
      status: "open",
      bids: {},
      winnerTeamId: null,
      finalPrice: 0,
      openedAt: new Date().toISOString()
    });
    this.addActivity("auction", `Se abrió la puja por ${player.name}.`);
    this.save("auction-open");
    return { ok: true, message: `Lote abierto para ${player.name}.` };
  }

  placeAuctionBid(lotId, teamId, amount) {
    const lot = this.state.auction.lots.find((item) => item.id === lotId);
    if (!lot || lot.status !== "open") return { ok: false, message: "Este lote ya no acepta pujas." };
    if (!this.canActForClub(teamId)) return { ok: false, message: "Solo el presidente de ese club puede pujar." };
    const team = this.team(teamId);
    const player = this.player(lot.playerId);
    if (!team || !player) return { ok: false, message: "Jugador o club no encontrado." };
    const value = Math.round(Number(amount));
    const highest = this.highestBid(lot);
    const minimum = Math.max(Number(player.value) || 0, highest.amount + 1);
    if (!Number.isFinite(value) || value < minimum) return { ok: false, message: `La puja mínima es ${minimum} M.` };
    if (value > Number(team.balance)) return { ok: false, message: "La puja supera el saldo del club." };
    lot.bids[teamId] = value;
    this.addActivity("auction", `${team.name} puja ${value} M por ${player.name}.`);
    this.save("auction-bid");
    return { ok: true, message: `Puja de ${value} M registrada.` };
  }

  closeAuctionLot(lotId) {
    const denied = this.requireOrganizer();
    if (denied) return denied;
    const lot = this.state.auction.lots.find((item) => item.id === lotId);
    if (!lot || lot.status !== "open") return { ok: false, message: "El lote ya está cerrado." };
    const player = this.player(lot.playerId);
    const best = this.highestBid(lot);
    const winner = best.teamId ? this.team(best.teamId) : null;
    if (winner && Number(winner.balance) < best.amount) {
      return { ok: false, message: `${winner.name} ya no tiene saldo suficiente para pagar ${best.amount} M.` };
    }

    lot.status = "closed";
    lot.winnerTeamId = winner?.id || null;
    lot.finalPrice = best.amount;
    if (winner && player) {
      winner.balance = Number(winner.balance) - best.amount;
      player.teamId = winner.id;
      player.status = player.insignia ? "insignia" : "available";
      winner.squadValue = this.teamValue(winner.id);
      this.addFinance(winner.id, "expense", `Fichaje en subasta final: ${player.name}`, best.amount);
      this.addActivity("auction", `${winner.name} se lleva a ${player.name} por ${best.amount} M.`);
    } else {
      this.addActivity("auction", `${player?.name || "El jugador"} queda sin adjudicar.`);
    }
    this.save("auction-close");
    return { ok: true, message: winner ? `${player?.name} adjudicado a ${winner.name}.` : "Lote cerrado sin pujas." };
  }

  resetDemo() {
    this.state = this.normalize(seedState());
    this.save("reset");
  }

  // Borra clubes, jugadores, calendario y operaciones para cargar el torneo real.
  startNewTournament() {
    this.state.teams = [];
    this.state.players = [];
    this.state.matches = [];
    this.state.transfers = [];
    this.state.finances = [];
    this.state.draft = defaultDraft();
    this.state.auction = { lots: [] };
    this.state.league.tournamentStarted = false;
    this.state.fantasy.managers.forEach((manager) => { manager.lineup = []; });
    this.state.accounts.forEach((account) => {
      if (account.teamId) account.teamId = null;
      if (account.playerId) account.playerId = null;
    });
    this.addActivity("system", "Se inició un nuevo torneo: clubes, jugadores y calendario reiniciados.");
    this.save("tournament-reset");
  }

  // ---- Torneo: grupos, calendario e inicio oficial ----
  tournamentStarted() {
    return this.state.league.tournamentStarted === true;
  }

  hasFinishedGroupMatches() {
    return this.state.matches.some((match) => match.phase === "groups" && match.status === "finished");
  }

  // Sorteo aleatorio o asignación manual ({ teamId: "A" }). Reemplaza la fase de grupos sin resultados.
  drawGroups({ groupCount = 2, manual = null } = {}) {
    if (this.tournamentStarted()) return { ok: false, message: "El torneo ya está iniciado." };
    if (this.hasFinishedGroupMatches()) return { ok: false, message: "Ya hay resultados de grupos; no se pueden redefinir." };
    const teams = this.state.teams;
    if (teams.length < 2) return { ok: false, message: "Inscribe al menos dos clubes." };
    const count = Math.min(Math.max(Number(groupCount) || 2, 1), Math.floor(teams.length / 2));
    const letters = Array.from({ length: count }, (_, index) => String.fromCharCode(65 + index));
    const assignment = {};

    if (manual) {
      teams.forEach((team) => {
        const letter = manual[team.id];
        if (!letters.includes(letter)) return;
        assignment[team.id] = letter;
      });
      if (teams.some((team) => !assignment[team.id])) return { ok: false, message: "Asigna un grupo válido a cada club." };
    } else {
      const pool = [...teams];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      pool.forEach((team, index) => { assignment[team.id] = letters[index % count]; });
    }

    if (letters.some((letter) => Object.values(assignment).filter((value) => value === letter).length < 2)) {
      return { ok: false, message: "Cada grupo necesita al menos dos clubes." };
    }

    teams.forEach((team) => { team.group = assignment[team.id]; });
    this.state.matches = this.state.matches.filter((match) => match.phase !== "groups");
    this.addActivity("system", `Grupos definidos: ${letters.join(", ")}.`);
    this.save("groups");
    return { ok: true, letters };
  }

  // Todos contra todos (ida) dentro de cada grupo; cada jornada es una semana por defecto.
  generateSchedule({ startDate, daysBetween = 7, time = "10:30" } = {}) {
    if (this.tournamentStarted()) return { ok: false, message: "El torneo ya está iniciado." };
    if (this.hasFinishedGroupMatches()) return { ok: false, message: "Ya hay resultados registrados en grupos." };
    if (!startDate || Number.isNaN(Date.parse(`${startDate}T00:00:00Z`))) return { ok: false, message: "Indica la fecha de la primera jornada." };
    const teams = this.state.teams;
    const letters = [...new Set(teams.map((team) => team.group).filter(Boolean))].sort();
    if (!letters.length || teams.some((team) => !team.group)) return { ok: false, message: "Genera los grupos antes del calendario." };

    const rounds = new Map();
    for (const letter of letters) {
      const slots = teams.filter((team) => team.group === letter).map((team) => team.id);
      if (slots.length < 2) return { ok: false, message: `El grupo ${letter} necesita al menos dos clubes.` };
      if (slots.length % 2) slots.push(null);
      const n = slots.length;
      for (let round = 0; round < n - 1; round++) {
        const matchday = round + 1;
        for (let i = 0; i < n / 2; i++) {
          let home = slots[i];
          let away = slots[n - 1 - i];
          if (!home || !away) continue;
          if (round % 2) [home, away] = [away, home];
          if (!rounds.has(matchday)) rounds.set(matchday, []);
          rounds.get(matchday).push({ group: letter, homeTeamId: home, awayTeamId: away });
        }
        slots.splice(1, 0, slots.pop());
      }
    }

    const base = Date.parse(`${startDate}T00:00:00Z`);
    const step = Math.min(Math.max(Number(daysBetween) || 7, 1), 14);
    const [hh, mm] = String(time || "10:30").split(":").map(Number);
    const startMinutes = (Number.isFinite(hh) ? hh : 10) * 60 + (Number.isFinite(mm) ? mm : 30);
    const pitches = ["Cancha Principal IMEX", "Cancha 2 IMEX"];
    const built = [];

    [...rounds.keys()].sort((a, b) => a - b).forEach((matchday) => {
      const date = new Date(base + (matchday - 1) * step * 86400000).toISOString().slice(0, 10);
      rounds.get(matchday).forEach((fixture, index) => {
        const minutes = startMinutes + index * 45;
        built.push({
          id: uid("match"),
          matchday,
          phase: "groups",
          group: fixture.group,
          title: "",
          homeTeamId: fixture.homeTeamId,
          awayTeamId: fixture.awayTeamId,
          homeScore: null,
          awayScore: null,
          status: "scheduled",
          date,
          time: `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`,
          pitch: pitches[index % pitches.length],
          mvpPlayerId: null,
          scorers: [],
          bookings: [],
          cardsUsed: [],
          diceEvent: "Pendiente",
          notes: "",
          settled: false,
          rewards: null
        });
      });
    });

    this.state.matches = this.state.matches.filter((match) => match.phase !== "groups");
    this.state.matches.push(...built);
    this.addActivity("match", `Calendario de grupos generado: ${built.length} partidos en ${rounds.size} jornadas.`);
    this.save("schedule");
    return { ok: true, count: built.length, matchdays: rounds.size };
  }

  startTournament() {
    if (this.tournamentStarted()) return { ok: false, message: "El torneo ya está iniciado." };
    const teams = this.state.teams;
    if (teams.length < 2 || teams.some((team) => !team.group)) return { ok: false, message: "Completa la inscripción y los grupos." };
    const groupMatches = this.state.matches.filter((match) => match.phase === "groups");
    const covered = new Set(groupMatches.flatMap((match) => [match.homeTeamId, match.awayTeamId]));
    if (!groupMatches.length || teams.some((team) => !covered.has(team.id))) {
      return { ok: false, message: "Genera el calendario de grupos antes de iniciar." };
    }
    this.state.league.tournamentStarted = true;
    this.addActivity("system", "¡Torneo iniciado! Comienza la fase de grupos.");
    this.save("tournament-start");
    return { ok: true };
  }

  exportState() {
    return JSON.stringify({ ...this.state, exportedAt: new Date().toISOString() }, null, 2);
  }

  importState(raw) {
    try {
      const parsed = JSON.parse(raw);
      this.state = this.normalize(parsed);
      this.addActivity("system", "Se importó un respaldo del torneo.");
      this.save("import");
      return { ok: true };
    } catch {
      return { ok: false, message: "El archivo no contiene un JSON válido." };
    }
  }

  getSupabaseConfig() {
    return readConfig();
  }

  async initSupabase() {
    const config = readConfig();
    if (!config.url || !config.key || !window.supabase) return;
    try {
      this.supabase = window.supabase.createClient(config.url, config.key, {
        auth: { persistSession: true, autoRefreshToken: true }
      });
      const { data, error } = await this.supabase
        .from(SUPABASE_TABLE)
        .select("payload, updated_at")
        .eq("id", window.IMEX_CONFIG?.leagueId || "main")
        .maybeSingle();
      if (error) throw error;
      if (data?.payload) {
        const remote = this.normalize(data.payload);
        if (new Date(remote.updatedAt).getTime() > new Date(this.state.updatedAt).getTime()) {
          this.state = remote;
        }
      }
      this.remoteReady = true;
      this.subscribeRemote();
    } catch (error) {
      this.remoteError = error.message || "No se pudo conectar con Supabase.";
      this.remoteReady = false;
      console.warn("Supabase:", this.remoteError);
    }
  }

  subscribeRemote() {
    if (!this.supabase) return;
    this.supabase
      .channel("imex-league-state")
      .on("postgres_changes", { event: "*", schema: "public", table: SUPABASE_TABLE, filter: `id=eq.${window.IMEX_CONFIG?.leagueId || "main"}` }, (payload) => {
        const remote = payload.new?.payload;
        if (!remote || remote._clientId === this.clientId) return;
        if (new Date(remote.updatedAt).getTime() > new Date(this.state.updatedAt).getTime()) {
          this.state = this.normalize(remote);
          this.notify();
        }
      })
      .subscribe();
  }

  queueRemoteSave() {
    if (!this.supabase || !this.remoteReady) return;
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.persistRemote(), 450);
  }

  async persistRemote() {
    if (!this.supabase || !this.remoteReady) return;
    const payload = { ...this.state, accounts: [], _clientId: this.clientId };
    const { error } = await this.supabase.from(SUPABASE_TABLE).upsert({
      id: window.IMEX_CONFIG?.leagueId || "main",
      payload,
      updated_at: new Date().toISOString()
    });
    if (error) {
      this.remoteError = error.message;
      console.warn("Supabase save:", error.message);
    }
  }

  configureSupabase(url, key) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ url, key }));
    window.location.reload();
  }
}

export const store = new Store();
