export const DEMO_PASSWORD = "IMEX2026!";

export const LEAGUE = {
  name: "IMEX League",
  officialName: "Kings League IMEX",
  season: "Temporada 2026",
  tagline: "Ocho clubes. Una corona.",
  format: "Fútbol 7 · Fase de grupos + eliminatorias",
  venue: "Estadio IMEX · Cancha 1",
  logoUrl: "",
  budget: 200,
  winReward: 50,
  drawReward: 10,
  qualificationReward: 50,
  marketOverride: null,
  marketClosesAt: "2026-10-21T20:00:00-06:00",
  fantasyBudget: 150
};

export const TEAMS = [
  { id: "team-1", name: "Los Cuervos FC", short: "CUE", president: "Mateo Ramos", group: "A", primary: "#171717", secondary: "#e8b44a", mark: "wing", balance: 85, squadValue: 200, clausulazoUsed: false, crestUrl: "" },
  { id: "team-2", name: "Titanes del IMEX", short: "TIT", president: "Diego Álvarez", group: "A", primary: "#123b5e", secondary: "#63d2e8", mark: "bolt", balance: 60, squadValue: 200, clausulazoUsed: false, crestUrl: "" },
  { id: "team-3", name: "Rayo Imperial", short: "RAY", president: "Sofía Morales", group: "A", primary: "#e4c400", secondary: "#171717", mark: "ray", balance: 110, squadValue: 200, clausulazoUsed: false, crestUrl: "" },
  { id: "team-4", name: "Furia Azteca", short: "FUR", president: "Lucas Hernández", group: "A", primary: "#a6202e", secondary: "#f2e9da", mark: "flame", balance: 50, squadValue: 215, clausulazoUsed: true, crestUrl: "" },
  { id: "team-5", name: "Galácticos IMEX", short: "GAL", president: "Sebastián Cruz", group: "B", primary: "#3b2a6b", secondary: "#c9b8ff", mark: "star", balance: 90, squadValue: 200, clausulazoUsed: false, crestUrl: "" },
  { id: "team-6", name: "Vikingos FC", short: "VIK", president: "Camila Navarro", group: "B", primary: "#0e4c6b", secondary: "#e8f1f5", mark: "shield", balance: 75, squadValue: 200, clausulazoUsed: false, crestUrl: "" },
  { id: "team-7", name: "Dragones Negros", short: "DRA", president: "Emilio Romero", group: "B", primary: "#154a36", secondary: "#8fe3b0", mark: "diamond", balance: 40, squadValue: 200, clausulazoUsed: false, crestUrl: "" },
  { id: "team-8", name: "Halcones Dorados", short: "HAL", president: "Valeria Ortiz", group: "B", primary: "#7a4a12", secondary: "#e8c46a", mark: "talon", balance: 95, squadValue: 200, clausulazoUsed: false, crestUrl: "" }
];

const ROSTERS = {
  "team-1": [
    ["Juan Carlos Mendoza", "El Cuervo", "DEL", 10, 55, 6, 3, 1, 0, 2, true],
    ["Rodrigo Salazar", "", "POR", 1, 35, 0, 1, 0, 0, 2, false],
    ["Alejandro Peña", "", "DEF", 4, 30, 1, 0, 2, 0, 2, false],
    ["Iker Domínguez", "", "DEF", 3, 25, 0, 1, 0, 0, 2, false],
    ["Mauricio Luna", "", "MED", 8, 25, 2, 2, 0, 0, 2, false],
    ["Javier Vargas", "", "MED", 6, 15, 0, 1, 1, 0, 2, false],
    ["Daniel Rivas", "", "DEL", 9, 15, 1, 0, 0, 0, 2, false]
  ],
  "team-2": [
    ["Joaquín Silva", "Trueno", "DEL", 7, 60, 5, 2, 0, 0, 2, true],
    ["Santiago Garza", "", "POR", 13, 35, 0, 0, 1, 0, 2, false],
    ["Fernando Torres", "", "DEF", 5, 30, 1, 1, 0, 0, 2, false],
    ["Guillermo Lozano", "", "DEF", 2, 25, 0, 0, 2, 0, 2, false],
    ["Gael Pineda", "", "MED", 8, 20, 1, 3, 0, 0, 2, false],
    ["Pablo Carmona", "", "MED", 14, 15, 0, 1, 0, 0, 2, false],
    ["Emilio Cárdenas", "", "MED", 17, 15, 0, 0, 0, 0, 2, false]
  ],
  "team-3": [
    ["Ignacio Benítez", "Rey", "MED", 10, 55, 4, 4, 1, 0, 2, true],
    ["Bruno Valdés", "", "POR", 1, 35, 0, 0, 0, 0, 2, false],
    ["Leonardo Castro", "", "DEF", 4, 30, 0, 1, 1, 0, 2, false],
    ["Mario Escalante", "", "DEF", 22, 25, 0, 0, 0, 0, 2, false],
    ["Axel Villalobos", "", "MED", 8, 25, 2, 1, 0, 0, 2, false],
    ["Hugo Santana", "", "DEL", 17, 15, 1, 0, 0, 0, 2, false],
    ["Enrique Marín", "", "DEL", 9, 15, 2, 0, 0, 0, 2, false]
  ],
  "team-4": [
    ["Maximiliano Lara", "Jaguar", "DEL", 9, 60, 4, 1, 2, 0, 2, true],
    ["Damián Fuentes", "", "POR", 1, 30, 0, 0, 0, 0, 2, false],
    ["Emiliano Soto", "", "DEF", 3, 30, 0, 1, 3, 1, 2, false],
    ["Ángel Méndez", "", "DEF", 4, 25, 0, 0, 1, 0, 2, false],
    ["Tadeo Corona", "", "MED", 6, 25, 1, 2, 0, 0, 2, false],
    ["Samuel Galindo", "", "MED", 11, 15, 1, 1, 0, 0, 2, false],
    ["Rodrigo Cárdenas", "", "DEL", 21, 15, 0, 0, 0, 0, 2, false],
    ["Andrés Figueroa", "", "DEL", 11, 15, 1, 0, 0, 0, 2, false]
  ],
  "team-5": [
    ["Lucas Beltrán", "Cometa", "MED", 10, 55, 5, 3, 0, 0, 2, true],
    ["Adrián Cordero", "", "POR", 12, 35, 0, 0, 0, 0, 2, false],
    ["Martín Quiroz", "", "DEF", 2, 30, 1, 0, 1, 0, 2, false],
    ["Nicolás Barrera", "", "DEF", 15, 25, 0, 0, 0, 0, 2, false],
    ["Matías Esparza", "", "MED", 8, 25, 1, 2, 1, 0, 2, false],
    ["Cristóbal Solís", "", "DEL", 18, 15, 1, 1, 0, 0, 2, false],
    ["Benjamín Parra", "", "DEL", 7, 15, 0, 1, 0, 0, 2, false]
  ],
  "team-6": [
    ["Torben Lind", "Berserker", "DEL", 9, 50, 3, 2, 1, 0, 2, true],
    ["Óscar Valenzuela", "", "POR", 1, 40, 0, 0, 0, 0, 2, false],
    ["Erik Morales", "", "DEF", 5, 30, 0, 1, 2, 0, 2, false],
    ["Iván Cervantes", "", "DEF", 3, 25, 0, 0, 0, 0, 2, false],
    ["Raúl Castañeda", "", "MED", 10, 25, 2, 1, 0, 0, 2, false],
    ["Manuel Aranda", "", "MED", 16, 15, 0, 0, 0, 0, 2, false],
    ["Felipe Rosas", "", "DEL", 19, 15, 1, 0, 0, 0, 2, false]
  ],
  "team-7": [
    ["Kevin Orozco", "Fénix", "DEL", 11, 55, 2, 1, 0, 0, 2, true],
    ["Esteban Zepeda", "", "POR", 1, 35, 0, 0, 1, 0, 2, false],
    ["Alan Del Valle", "", "DEF", 4, 30, 0, 0, 1, 0, 2, false],
    ["Rubén Pacheco", "", "DEF", 2, 25, 0, 0, 0, 0, 2, false],
    ["César Villaseñor", "", "MED", 8, 25, 1, 0, 2, 0, 2, false],
    ["David Alcocer", "", "MED", 6, 15, 0, 1, 0, 0, 2, false],
    ["Tomás Guadarrama", "", "DEL", 20, 15, 0, 0, 0, 0, 2, false]
  ],
  "team-8": [
    ["Gabriel Navarro", "Halcón", "DEL", 10, 55, 5, 2, 0, 0, 2, true],
    ["Lorenzo Barajas", "", "POR", 1, 35, 0, 0, 0, 0, 2, false],
    ["Álvaro Ceballos", "", "DEF", 3, 30, 1, 0, 1, 0, 2, false],
    ["Héctor Palacios", "", "DEF", 4, 25, 0, 1, 0, 0, 2, false],
    ["Ignacio Rendón", "", "MED", 8, 25, 2, 1, 0, 0, 2, false],
    ["Bernardo Fonseca", "", "MED", 15, 15, 0, 2, 1, 0, 2, false],
    ["Joaquín Leal", "", "DEL", 17, 15, 1, 0, 0, 0, 2, false]
  ]
};

let playerSeq = 0;
export const PLAYERS = Object.entries(ROSTERS).flatMap(([teamId, rows]) =>
  rows.map((row, index) => {
    playerSeq += 1;
    const [name, nickname, position, number, value, goals, assists, yellow, red, played, insignia] = row;
    return {
      id: `p-${teamId.replace("team-", "")}${String(index + 1).padStart(2, "0")}`,
      teamId,
      name,
      nickname,
      position,
      number,
      value,
      goals,
      assists,
      yellow,
      red,
      played,
      insignia,
      photoUrl: "",
      status: insignia ? "insignia" : "available"
    };
  })
);

const score = (playerId, teamId, minute, type = "regular") => ({ playerId, teamId, minute, type });

export const MATCHES = [
  {
    id: "match-101", matchday: 1, phase: "groups", group: "A", homeTeamId: "team-1", awayTeamId: "team-2",
    homeScore: 4, awayScore: 2, status: "finished", date: "2026-10-03", time: "10:30", pitch: "Cancha Principal IMEX",
    mvpPlayerId: "p-101", settled: true, rewards: { home: 50, away: 0 },
    scorers: [score("p-101", "team-1", 4), score("p-101", "team-1", 14, "doble"), score("p-105", "team-1", 28), score("p-107", "team-1", 33), score("p-201", "team-2", 11), score("p-205", "team-2", 22, "penalti_presi")],
    bookings: [{ playerId: "p-103", teamId: "team-1", card: "yellow", minute: 16 }, { playerId: "p-202", teamId: "team-2", card: "yellow", minute: 25 }],
    notes: "Clásico inaugural de alto voltaje. Los Cuervos aprovecharon la carta de gol doble.",
    cardsUsed: [{ teamId: "team-1", cardName: "Gol Doble", result: "Anotó 2 goles con valor x2" }, { teamId: "team-2", cardName: "Penalti Presidente", result: "Gol convertido por Diego Álvarez" }],
    diceEvent: "Minuto 18 · 3 vs 3 durante 3 minutos"
  },
  {
    id: "match-102", matchday: 1, phase: "groups", group: "A", homeTeamId: "team-3", awayTeamId: "team-4",
    homeScore: 3, awayScore: 3, status: "finished", date: "2026-10-03", time: "11:15", pitch: "Cancha 2 IMEX",
    mvpPlayerId: "p-301", settled: true, rewards: { home: 10, away: 10 },
    scorers: [score("p-301", "team-3", 7), score("p-305", "team-3", 19), score("p-307", "team-3", 29), score("p-401", "team-4", 12), score("p-401", "team-4", 27, "doble")],
    bookings: [{ playerId: "p-403", teamId: "team-4", card: "yellow", minute: 15 }, { playerId: "p-403", teamId: "team-4", card: "red", minute: 30 }],
    notes: "Empate dramático en el último minuto con gol de Furia Azteca usando carta Comodín.",
    cardsUsed: [{ teamId: "team-3", cardName: "Sanción 2 min", result: "Lucas Lara expulsado temporalmente" }, { teamId: "team-4", cardName: "Comodín", result: "Eligió Gol Doble en el minuto 26" }],
    diceEvent: "Minuto 18 · 2 vs 2 sin portero"
  },
  {
    id: "match-103", matchday: 1, phase: "groups", group: "B", homeTeamId: "team-5", awayTeamId: "team-6",
    homeScore: 5, awayScore: 2, status: "finished", date: "2026-10-04", time: "10:30", pitch: "Cancha Principal IMEX",
    mvpPlayerId: "p-501", settled: true, rewards: { home: 50, away: 0 },
    scorers: [score("p-501", "team-5", 5), score("p-501", "team-5", 15), score("p-501", "team-5", 23, "doble"), score("p-503", "team-5", 29), score("p-601", "team-6", 10), score("p-605", "team-6", 18, "1vs1")],
    bookings: [{ playerId: "p-603", teamId: "team-6", card: "yellow", minute: 24 }],
    notes: "Exhibición galáctica de Beltrán con hat-trick y control del ritmo.",
    cardsUsed: [{ teamId: "team-5", cardName: "Gol Doble", result: "Gol doble al minuto 22" }, { teamId: "team-6", cardName: "Robar Carta", result: "Robó la carta de penalti rival" }],
    diceEvent: "Minuto 18 · 1 vs 1 con portero"
  },
  {
    id: "match-104", matchday: 1, phase: "groups", group: "B", homeTeamId: "team-7", awayTeamId: "team-8",
    homeScore: 1, awayScore: 4, status: "finished", date: "2026-10-04", time: "11:15", pitch: "Cancha 2 IMEX",
    mvpPlayerId: "p-801", settled: true, rewards: { home: 0, away: 50 },
    scorers: [score("p-701", "team-7", 8), score("p-801", "team-8", 12), score("p-801", "team-8", 16, "doble"), score("p-805", "team-8", 24)],
    bookings: [{ playerId: "p-702", teamId: "team-7", card: "yellow", minute: 20 }, { playerId: "p-803", teamId: "team-8", card: "yellow", minute: 27 }],
    notes: "Halcones desplegó gran verticalidad y castigó los errores de Dragones.",
    cardsUsed: [{ teamId: "team-8", cardName: "Gol Doble", result: "Gol doble al minuto 15" }],
    diceEvent: "Minuto 18 · 4 vs 4"
  },
  { id: "match-201", matchday: 2, phase: "groups", group: "A", homeTeamId: "team-1", awayTeamId: "team-3", homeScore: null, awayScore: null, status: "scheduled", date: "2026-10-24", time: "10:30", pitch: "Cancha Principal IMEX", mvpPlayerId: null, scorers: [], bookings: [], notes: "Duelo de invictos en el Grupo A. Choque por el liderato.", cardsUsed: [], diceEvent: "Pendiente" },
  { id: "match-202", matchday: 2, phase: "groups", group: "A", homeTeamId: "team-2", awayTeamId: "team-4", homeScore: null, awayScore: null, status: "scheduled", date: "2026-10-24", time: "11:15", pitch: "Cancha 2 IMEX", mvpPlayerId: null, scorers: [], bookings: [], notes: "Urgencia total de puntos para evitar la zona de eliminación.", cardsUsed: [], diceEvent: "Pendiente" },
  { id: "match-203", matchday: 2, phase: "groups", group: "B", homeTeamId: "team-5", awayTeamId: "team-8", homeScore: null, awayScore: null, status: "scheduled", date: "2026-10-25", time: "10:30", pitch: "Cancha Principal IMEX", mvpPlayerId: null, scorers: [], bookings: [], notes: "Los dos ataques más prolíficos frente a frente.", cardsUsed: [], diceEvent: "Pendiente" },
  { id: "match-204", matchday: 2, phase: "groups", group: "B", homeTeamId: "team-6", awayTeamId: "team-7", homeScore: null, awayScore: null, status: "scheduled", date: "2026-10-25", time: "11:15", pitch: "Cancha 2 IMEX", mvpPlayerId: null, scorers: [], bookings: [], notes: "Duelo directo en el fondo de la tabla del Grupo B.", cardsUsed: [], diceEvent: "Pendiente" },
  { id: "match-semi-1", matchday: 3, phase: "semifinals", group: null, title: "Semifinal 1", homeTeamId: "team-1", awayTeamId: "team-8", homeScore: null, awayScore: null, status: "scheduled", date: "2026-11-01", time: "10:30", pitch: "Estadio IMEX · Cancha 1", mvpPlayerId: null, scorers: [], bookings: [], notes: "1.º Grupo A vs 2.º Grupo B", cardsUsed: [], diceEvent: "Pendiente" },
  { id: "match-semi-2", matchday: 3, phase: "semifinals", group: null, title: "Semifinal 2", homeTeamId: "team-5", awayTeamId: "team-3", homeScore: null, awayScore: null, status: "scheduled", date: "2026-11-01", time: "11:15", pitch: "Estadio IMEX · Cancha 1", mvpPlayerId: null, scorers: [], bookings: [], notes: "1.º Grupo B vs 2.º Grupo A", cardsUsed: [], diceEvent: "Pendiente" },
  { id: "match-final", matchday: 4, phase: "final", group: null, title: "Gran Final", homeTeamId: null, awayTeamId: null, homeScore: null, awayScore: null, status: "scheduled", date: "2026-11-08", time: "10:45", pitch: "Estadio IMEX · Cancha 1", mvpPlayerId: null, scorers: [], bookings: [], notes: "Previa con subasta final de refuerzos.", cardsUsed: [], diceEvent: "Pendiente" }
];

export const TRANSFERS = [
  { id: "tr-001", buyerTeamId: "team-4", sellerTeamId: "team-2", playerId: "p-408", offeredPlayerIds: [], price: 15, type: "clausulazo", status: "completed", date: "2026-10-09 14:30", notes: "Clausulazo ejecutado por Furia Azteca. Cláusula pagada íntegra." },
  { id: "tr-002", buyerTeamId: "team-1", sellerTeamId: "team-6", playerId: "p-607", offeredPlayerIds: ["p-107"], price: 5, type: "swap_and_cash", status: "pending", date: "2026-10-15 09:15", notes: "Propuesta: Daniel Rivas + 5 M por Felipe Rosas." }
];

export const FINANCES = [
  ["fin-1", "team-1", "income", "Saldo de apertura", 50, "2026-10-01"],
  ["fin-2", "team-1", "income", "Victoria Jornada 1 vs Titanes", 50, "2026-10-03"],
  ["fin-3", "team-1", "expense", "Registro de plantilla", 15, "2026-10-02"],
  ["fin-4", "team-2", "income", "Saldo de apertura", 45, "2026-10-01"],
  ["fin-5", "team-2", "income", "Venta de Andrés Figueroa (clausulazo)", 15, "2026-10-09"],
  ["fin-6", "team-3", "income", "Saldo de apertura", 100, "2026-10-01"],
  ["fin-7", "team-3", "income", "Empate Jornada 1 vs Furia Azteca", 10, "2026-10-03"],
  ["fin-8", "team-4", "income", "Saldo de apertura", 55, "2026-10-01"],
  ["fin-9", "team-4", "income", "Empate Jornada 1 vs Rayo Imperial", 10, "2026-10-03"],
  ["fin-10", "team-4", "expense", "Clausulazo por Andrés Figueroa", 15, "2026-10-09"],
  ["fin-11", "team-5", "income", "Saldo de apertura", 40, "2026-10-01"],
  ["fin-12", "team-5", "income", "Victoria Jornada 1 vs Vikingos", 50, "2026-10-04"],
  ["fin-13", "team-6", "income", "Saldo de apertura", 75, "2026-10-01"],
  ["fin-14", "team-7", "income", "Saldo de apertura", 40, "2026-10-01"],
  ["fin-15", "team-8", "income", "Saldo de apertura", 45, "2026-10-01"],
  ["fin-16", "team-8", "income", "Victoria Jornada 1 vs Dragones", 50, "2026-10-04"]
].map(([id, teamId, type, concept, amount, date]) => ({ id, teamId, type, concept, amount, date }));

export const NEWS = [
  {
    id: "news-1", title: "El mercado de invierno abre el miércoles", category: "Mercado", date: "2026-10-18", time: "09:00", important: true, author: "Comité de Competición",
    excerpt: "Ocho clubes, una ventana y un solo clausulazo por equipo. Todo lo que necesitas saber antes de mover ficha.",
    body: "La ventana de transferencias de la Temporada 2026 abre cada miércoles (hora de México) y cierra a medianoche de ese mismo día. El organizador puede abrirla o cerrarla fuera de ese horario.\n\nCada club dispone de un clausulazo por mercado. El pago es inmediato y no requiere la autorización del club vendedor. Los jugadores insignia permanecen blindados mientras su equipo siga con vida en el torneo.\n\nLas ofertas y los acuerdos se registran en la plataforma. Cualquier movimiento actualiza al instante la plantilla, el saldo del club y la puntuación de Fantasy."
  },
  {
    id: "news-2", title: "Cuervos y Rayo se juegan el liderato", category: "Torneo", date: "2026-10-17", time: "18:30", important: false, author: "Dirección de Torneo",
    excerpt: "El sábado 24 se enfrentan los dos invictos del Grupo A en el partido más esperado de la jornada.",
    body: "Los Cuervos llegan con tres puntos y una diferencia de +2 tras su victoria ante Titanes. Rayo Imperial suma un punto y buscará su primera victoria para escalar posiciones.\n\nEl partido arranca a las 10:30 en la Cancha Principal. La jornada se completa con Titanes vs Furia, Galácticos vs Halcones y Vikingos vs Dragones."
  },
  {
    id: "news-3", title: "Furia Azteca ejecuta el primer clausulazo", category: "Fichajes", date: "2026-10-09", time: "14:45", important: false, author: "Mesa de Fichajes",
    excerpt: "Andrés Figueroa deja Titanes y se incorpora a Furia Azteca por 15 millones.",
    body: "Furia Azteca activó su clausulazo y se hizo con los servicios de Andrés Figueroa. La operación se cerró por 15 millones, el valor de cláusula del delantero.\n\nEl club ya no dispone de su clausulazo para esta ventana. Titanes recibe el importe íntegro y podrá reinvertirlo antes del cierre del mercado."
  },
  {
    id: "news-4", title: "Fantasy IMEX: arma tu quinteto", category: "Fantasy", date: "2026-10-06", time: "12:00", important: false, author: "IMEX League",
    excerpt: "Elige cinco futbolistas, respeta el presupuesto y suma puntos con cada gol y asistencia de la temporada.",
    body: "El Fantasy de la IMEX League ya está abierto. Cada manager dispone de 150 millones para construir un quinteto con un portero, un defensa, un mediocampista y dos delanteros.\n\nLos puntos se calculan con los goles y asistencias acumulados: 4 puntos por gol, 3 por asistencia, 3 extra para porteros y 3 para jugadores insignia. Los cambios de plantilla se reflejan al instante."
  },
  {
    id: "news-5", title: "Así quedó la tabla tras la Jornada 1", category: "Torneo", date: "2026-10-05", time: "20:00", important: false, author: "Estadística IMEX",
    excerpt: "Cuervos, Galácticos y Halcones abren con victoria. El Grupo A queda apretado.",
    body: "La primera jornada dejó cuatro partidos y catorce goles. Cuervos, Galácticos y Halcones suman de a tres; Rayo y Furia repartieron puntos en un empate con sabor a final.\n\nLa clasificación completa, los goleadores y la forma de cada club ya están disponibles en la plataforma."
  }
];

export const CARDS = [
  { id: "card-1", name: "Gol Doble", timing: "Cualquier momento, 1 por tiempo", duration: "2 minutos", rarity: "Épica", description: "Todos los goles de tu equipo durante los siguientes 2 minutos cuentan doble en el marcador oficial." },
  { id: "card-2", name: "Penalti Presidente", timing: "Primeros 30 minutos", duration: "Inmediato", rarity: "Legendaria", description: "El presidente del club baja a la cancha para cobrar un penalti decisivo contra el guardameta rival." },
  { id: "card-3", name: "Sanción 2 minutos", timing: "Al reanudar el juego", duration: "2 minutos", rarity: "Rara", description: "Un jugador de campo rival, nunca el portero ni el insignia, abandona el terreno durante dos minutos." },
  { id: "card-4", name: "Comodín Total", timing: "Antes de los últimos 5 minutos", duration: "Variable", rarity: "Mítica", description: "El club elige en secreto cualquiera de las cartas del reglamento y la ejecuta al instante." },
  { id: "card-5", name: "Robar Carta", timing: "Antes del inicio o en el descanso", duration: "Inmediato", rarity: "Épica", description: "Roba la carta secreta del rival antes de que la active y úsala a tu favor." },
  { id: "card-6", name: "Jugador Estrella x2", timing: "Inicio del segundo tiempo", duration: "Todo el segundo tiempo", rarity: "Rara", description: "Cada gol del jugador designado suma 1.5 goles adicionales al marcador." }
];

export const DICE = [
  { roll: "1 vs 1", detail: "Con portero", description: "Se retiran los jugadores de campo. Un jugador contra uno, con sus guardametas.", intensity: "Máxima tensión" },
  { roll: "2 vs 2", detail: "Sin porteros", description: "Dos jugadores por bando, arcos vacíos y prohibido tocar con las manos.", intensity: "Caos total" },
  { roll: "3 vs 3", detail: "Con portero", description: "Tres futbolistas por bando. Ida y vuelta constante.", intensity: "Velocidad pura" },
  { roll: "4 vs 4", detail: "Con portero", description: "Cuatro por bando. Más espacio para transiciones y contragolpes.", intensity: "Estratégico" }
];

export const FANTASY_MANAGERS = [
  { id: "fm-1", name: "La Banda del Barrio", owner: "Diego S.", lineup: ["p-101", "p-103", "p-106", "p-408", "p-306"] },
  { id: "fm-2", name: "Trueno FC", owner: "Mariana G.", lineup: ["p-201", "p-204", "p-205", "p-307", "p-506"] },
  { id: "fm-3", name: "Los Galácticos", owner: "Sebastián C.", lineup: ["p-501", "p-503", "p-605", "p-107", "p-706"] },
  { id: "fm-4", name: "Halcón Dorado", owner: "Valeria O.", lineup: ["p-801", "p-804", "p-805", "p-406", "p-607"] },
  { id: "fm-5", name: "Rayo de Medianoche", owner: "Sofía M.", lineup: ["p-301", "p-304", "p-305", "p-407", "p-707"] }
];

export const SEED_ACCOUNTS = [
  { id: "u-admin", email: "admin@imexleague.mx", name: "Dirección de Liga", role: "ADMIN", teamId: null, playerId: null },
  { id: "u-cuervos", email: "cuervos@imexleague.mx", name: "Mateo Ramos", role: "PRESIDENT", teamId: "team-1", playerId: null },
  { id: "u-titanes", email: "titanes@imexleague.mx", name: "Diego Álvarez", role: "PRESIDENT", teamId: "team-2", playerId: null },
  { id: "u-rayo", email: "rayo@imexleague.mx", name: "Sofía Morales", role: "PRESIDENT", teamId: "team-3", playerId: null },
  { id: "u-furia", email: "furia@imexleague.mx", name: "Lucas Hernández", role: "PRESIDENT", teamId: "team-4", playerId: null },
  { id: "u-galacticos", email: "galacticos@imexleague.mx", name: "Sebastián Cruz", role: "PRESIDENT", teamId: "team-5", playerId: null },
  { id: "u-vikingos", email: "vikingos@imexleague.mx", name: "Camila Navarro", role: "PRESIDENT", teamId: "team-6", playerId: null },
  { id: "u-dragones", email: "dragones@imexleague.mx", name: "Emilio Romero", role: "PRESIDENT", teamId: "team-7", playerId: null },
  { id: "u-halcones", email: "halcones@imexleague.mx", name: "Valeria Ortiz", role: "PRESIDENT", teamId: "team-8", playerId: null },
  { id: "u-carlos", email: "carlos@imexleague.mx", name: "Carlos Mendoza", role: "PLAYER", teamId: "team-1", playerId: "p-101" },
  { id: "u-fan", email: "aficionado@imexleague.mx", name: "Aficionado IMEX", role: "FAN", teamId: null, playerId: null }
];

export const ACTIVITY = [
  { id: "act-1", type: "transfer", text: "Andrés Figueroa pasó de Titanes a Furia Azteca por 15 M.", at: "2026-10-09T14:30:00-06:00" },
  { id: "act-2", type: "result", text: "Cuervos 4–2 Titanes · Jornada 1.", at: "2026-10-03T12:30:00-06:00" },
  { id: "act-3", type: "result", text: "Galácticos 5–2 Vikingos · Jornada 1.", at: "2026-10-04T12:30:00-06:00" },
  { id: "act-4", type: "news", text: "El mercado de invierno abre el 21 de octubre.", at: "2026-10-18T09:00:00-06:00" }
];

export function seedState() {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    league: structuredClone(LEAGUE),
    teams: structuredClone(TEAMS),
    players: structuredClone(PLAYERS),
    matches: structuredClone(MATCHES),
    transfers: structuredClone(TRANSFERS),
    finances: structuredClone(FINANCES),
    news: structuredClone(NEWS),
    cards: structuredClone(CARDS),
    dice: structuredClone(DICE),
    fantasy: { budget: LEAGUE.fantasyBudget, managers: structuredClone(FANTASY_MANAGERS) },
    accounts: [],
    activity: structuredClone(ACTIVITY)
  };
}
