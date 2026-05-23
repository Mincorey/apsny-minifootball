/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useMemo, useEffect, Fragment } from "react";
import {
  initialTeams,
  initialScheduledMatches,
  initialMatches,
  Team,
  PlayerStats,
  Match,
  ScheduledMatch,
  Player,
  ADMIN_LOGIN,
  ADMIN_PASSWORD,
} from "./constants";
import { AdminLoginModal } from "./components/AdminLoginModal";
import {
  Trophy,
  Shield,
  RefreshCw,
  User,
  Settings,
  AlertTriangle,
  Search,
  Calendar,
  Users,
  ListOrdered,
  LayoutDashboard,
  Plus,
  Trash2,
  ChevronDown,
  ChevronLeft,
  History,
  Home,
  Eye,
  X,
  Pencil,
} from "lucide-react";

export default function App() {
  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = localStorage.getItem("KFL_V1_TEAMS");
    if (!saved) return initialTeams;
    try {
      const parsed = JSON.parse(saved) as Team[];
      // Sync with initialTeams to get new players or teams added in code
      const updated = parsed.map((savedTeam) => {
        const initialTeam = initialTeams.find((it) => it.id === savedTeam.id);
        if (!initialTeam) return savedTeam;

        // Add players that are in initial but not in saved
        const savedPlayerIds = new Set(savedTeam.players.map((p) => p.id));
        const missingPlayers = initialTeam.players.filter(
          (p) => !savedPlayerIds.has(p.id),
        );

        return {
          ...savedTeam,
          players: [...savedTeam.players, ...missingPlayers],
        };
      });

      const savedIds = new Set(updated.map((t: any) => t.id));
      const missingTeams = initialTeams.filter((t) => !savedIds.has(t.id));
      return [...updated, ...missingTeams];
    } catch {
      return initialTeams;
    }
  });

  const [availableLeagues, setAvailableLeagues] = useState<{ id: number; name: string }[]>(() => {
    const saved = localStorage.getItem("KFL_V1_AVAILABLE_LEAGUES_OBJECTS");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((l: any) => ({ ...l, id: Number(l.id) }));
    }
    
    // Migration from old number array if exists
    const oldSaved = localStorage.getItem("KFL_V1_AVAILABLE_LEAGUES");
    if (oldSaved) {
      try {
        const oldLeagues = JSON.parse(oldSaved);
        if (Array.isArray(oldLeagues)) {
          return oldLeagues.map((l: any) => ({ id: Number(l), name: `${l} Лига` }));
        }
      } catch (e) {
        console.error("Migration error:", e);
      }
    }
    
    return [
      { id: 1, name: "1 Лига" },
      { id: 2, name: "2 Лига" }
    ];
  });

  const [league, setLeague] = useState<number>(1);
  const currentLeagueName = useMemo(() => {
    return availableLeagues.find(l => l.id === league)?.name || `${league} Лига`;
  }, [availableLeagues, league]);
  const [season, setSeason] = useState(
    localStorage.getItem("KFL_V1_SEASON") || "Сезон 1",
  );
  const [activeTab, setActiveTab] = useState<
    "table" | "scorers" | "teams" | "admin" | "teamDetail" | "tours" | "archive"
  >("table");
  const [newTeamName, setNewTeamName] = useState("");
  const [playerInputValues, setPlayerInputValues] = useState<
    Record<number, string>
  >({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);

  // League Creation Wizard State
  const [wizardStep, setWizardStep] = useState<number>(0); // 0: Normal, 1: Teams, 2: Schedule Gen, 3: Manual Edit/Final
  const [wizardTeams, setWizardTeams] = useState<Team[]>([]);
  const [wizardSchedule, setWizardSchedule] = useState<ScheduledMatch[]>([]);
  const [wizardNewTeamName, setWizardNewTeamName] = useState("");
  const [wizardBulkRoster, setWizardBulkRoster] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [selectedProtocolMatchId, setSelectedProtocolMatchId] = useState<
    number | null
  >(null);
  const [matches, setMatches] = useState<Match[]>(() => {
    const saved = localStorage.getItem("KFL_V1_MATCHES");
    if (!saved) return initialMatches;
    try {
      const parsed = JSON.parse(saved) as Match[];
      const savedIds = new Set(parsed.map((m) => m.id));
      const missing = initialMatches.filter((m) => !savedIds.has(m.id));
      return [...parsed, ...missing];
    } catch {
      return initialMatches;
    }
  });
  const [scheduledMatches, setScheduledMatches] = useState<ScheduledMatch[]>(
    () => {
      const saved = localStorage.getItem("KFL_V1_SCHEDULED_MATCHES");
      if (!saved) return initialScheduledMatches;
      try {
        const parsed = JSON.parse(saved) as ScheduledMatch[];
        const savedIds = new Set(parsed.map((m) => m.id));
        const missing = initialScheduledMatches.filter(
          (m) => !savedIds.has(m.id),
        );
        return [...parsed, ...missing];
      } catch {
        return initialScheduledMatches;
      }
    },
  );
  const [scheduledMatchId, setScheduledMatchId] = useState<number | undefined>(
    undefined,
  );
  const [editingMatchId, setEditingMatchId] = useState<number | null>(null);
  const [matchPlayerStats, setMatchPlayerStats] = useState<
    Record<number, PlayerStats>
  >({});
  const [playerSearch, setPlayerSearch] = useState("");
  const [activeSeasonId, setActiveSeasonId] = useState<number | "current">("current");
  const [seasonHistory, setSeasonHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem("KFL_V1_SEASON_HISTORY");
    return saved ? JSON.parse(saved) : [];
  });

  const resolvedData = useMemo(() => {
    if (activeSeasonId === "current") {
      return {
        teams,
        matches,
        scheduledMatches,
        seasonName: season,
        leagues: availableLeagues
      };
    }
    const historical = seasonHistory.find((s) => s.id === activeSeasonId);
    return {
      teams: (historical?.teams || []) as Team[],
      matches: (historical?.matches || []) as Match[],
      scheduledMatches: (historical?.scheduledMatches || []) as ScheduledMatch[],
      seasonName: historical?.seasonName || "Неизвестный сезон",
      leagues: (historical?.availableLeagues || []) as { id: number; name: string }[]
    };
  }, [activeSeasonId, teams, matches, scheduledMatches, season, seasonHistory, availableLeagues]);

  const currentTeams = resolvedData.teams;
  const currentMatches = resolvedData.matches;
  const currentScheduledMatches = resolvedData.scheduledMatches;
  const currentSeasonName = resolvedData.seasonName;
  const currentLeagues = resolvedData.leagues;
  const [currentResult, setCurrentResult] = useState<any | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const clickCount = useRef(0);
  const lastClickTime = useRef(0);

  useEffect(() => {
    localStorage.setItem("KFL_V1_TEAMS", JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    localStorage.setItem("KFL_V1_MATCHES", JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem("KFL_V1_SCHEDULED_MATCHES", JSON.stringify(scheduledMatches));
  }, [scheduledMatches]);

  useEffect(() => {
    localStorage.setItem("KFL_V1_SEASON_HISTORY", JSON.stringify(seasonHistory));
  }, [seasonHistory]);

  const handleLeagueClick = () => {
    const now = Date.now();
    if (now - lastClickTime.current < 1000) {
      clickCount.current++;
    } else {
      clickCount.current = 1;
    }
    lastClickTime.current = now;

    if (clickCount.current === 5) {
      setIsAdmin(true);
      localStorage.setItem("KFL_V1_IS_ADMIN", "true");
      alert("Доступ администратора активирован!");
      clickCount.current = 0;
    }
  };

  const startNewSeason = (copyRosters: boolean = false) => {
    if (
      window.confirm(
        copyRosters 
          ? "Начать новый сезон и скопировать составы команд?" 
          : "ВНИМАНИЕ! Это действие полностью удалит ВСЕ команды, игроков и результаты. Вы сможете начать новую лигу с чистого листа. История сезонов сохранится. Продолжить?",
      )
    ) {
      if (copyRosters) {
        // Reset stats but keep players
        setTeams((prev) =>
          prev.map((t) => ({
            ...t,
            matches: 0,
            win: 0,
            draw: 0,
            loss: 0,
            gf: 0,
            ga: 0,
            players: t.players.map((p) => ({
              ...p,
              goals: 0,
              ownGoals: 0,
              yellow: 0,
              red: 0,
              banMatches: 0,
              permanentBan: false
            })),
          })),
        );
      } else {
        setTeams(initialTeams);
      }
      
      setMatches([]);
      setScheduledMatches([]);
      setSeason("Сезон " + (new Date().getFullYear()));
      
      // Persist the brand new/reset state
      localStorage.setItem("KFL_V1_MATCHES", JSON.stringify([]));
      localStorage.setItem("KFL_V1_SCHEDULED_MATCHES", JSON.stringify([]));
      setActiveSeasonId("current");
      
      alert(copyRosters ? "Составы скопированы, сезон обнулен!" : "Все данные сезона сброшены.");
    }
  };

  const finishSeason = () => {
    const finalists = getFilteredTeams();
    const scorers = getTopScorers();

    if (finalists.length === 0 && teams.length === 0) {
      alert("Нет данных для завершения сезона");
      return false;
    }

    if (!window.confirm("ВНИМАНИЕ: Все составы и статистика будут удалены и перенесены в архив. Вы готовы начать новый сезон с чистого листа?")) {
      return false;
    }

    const winner = finalists[0] || null;
    const topScorer = scorers[0] || null;

    const result = {
      id: Date.now(),
      seasonName: season,
      date: new Date().toLocaleDateString(),
      winner,
      topScorer,
      // Глубокая копия всех данных сезона для архива
      teams: JSON.parse(JSON.stringify(teams)), 
      matches: JSON.parse(JSON.stringify(matches)),
      scheduledMatches: JSON.parse(JSON.stringify(scheduledMatches)),
      availableLeagues: JSON.parse(JSON.stringify(availableLeagues)),
      leagueId: league
    };

    const newHistory = [result, ...seasonHistory];
    setSeasonHistory(newHistory);
    // Принудительно сохраняем историю в localStorage
    localStorage.setItem("KFL_V1_SEASON_HISTORY", JSON.stringify(newHistory));
    
    setCurrentResult(result);
    setShowCelebration(true);
    
    // АБСОЛЮТНЫЙ СБРОС (Hard Reset) для нового сезона
    // 1. Очищаем составы и сбрасываем статистику всех команд
    setTeams(prev => prev.map(t => ({
      ...t,
      matches: 0,
      win: 0,
      draw: 0,
      loss: 0,
      gf: 0,
      ga: 0,
      players: [] // Полная очистка составов
    })));

    // 2. Очищаем текущие и запланированные матчи
    setMatches([]);
    setScheduledMatches([]);
    
    // 3. Сбрасываем год сезона
    const nextYear = new Date().getFullYear();
    setSeason(`Сезон ${nextYear}`);
    localStorage.setItem("KFL_V1_SEASON", `Сезон ${nextYear}`);
    
    localStorage.setItem("KFL_V1_MATCHES", JSON.stringify([]));
    localStorage.setItem("KFL_V1_SCHEDULED_MATCHES", JSON.stringify([]));
    localStorage.setItem("KFL_V1_TEAMS", JSON.stringify([])); // Будет обновлено хуком, но здесь для верности
    
    setActiveSeasonId("current");

    alert("Сезон успешно завершен и заархивирован. Все данные текущего сезона обнулены, составы команд очищены.");
    return true;
  };

  // --- Wizard Logic ---

  const generateRoundRobin = (teamsToUse?: Team[] | any) => {
    const teams = (Array.isArray(teamsToUse)) ? teamsToUse : wizardTeams;
    if (teams.length < 2) {
      alert("Добавьте минимум 2 команды! У вас сейчас: " + teams.length);
      return;
    }

    let rotation = [...teams];
    if (rotation.length % 2 !== 0) {
      // Add a dummy team for BYE
      rotation.push({
        id: -1,
        name: "ВЫХОДНОЙ",
        logo: "⏸️",
        league: league,
        color: "#ccc",
        players: [],
        matches: 0, win: 0, draw: 0, loss: 0, gf: 0, ga: 0
      });
    }

    const numTeams = rotation.length;
    const numTours = numTeams - 1;
    const matchesPerTour = numTeams / 2;
    const newSchedule: ScheduledMatch[] = [];
    let matchId = 1;

    for (let tour = 1; tour <= numTours; tour++) {
      for (let i = 0; i < matchesPerTour; i++) {
        const teamA = rotation[i];
        const teamB = rotation[numTeams - 1 - i];

        if (teamA.id !== -1 && teamB.id !== -1) {
          newSchedule.push({
            id: matchId++,
            teamAId: teamA.id,
            teamBId: teamB.id,
            tour: tour,
            dateTime: "", // Empty for manual entry
            league: league
          });
        }
      }
      // Rotate teams: index 0 stays, others move
      rotation = [rotation[0], rotation[numTeams - 1], ...rotation.slice(1, numTeams - 1)];
    }
    setWizardSchedule(newSchedule);
    setWizardStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateLeague = () => {
    if (confirm("Вы уверены? Текущий сезон будет архивирован, и начнется новый с новыми командами и расписанием.")) {
      // 1. Move current data to archive
      const success = finishSeason();
      if (!success) return;

      // 2. Set new data
      setTeams(wizardTeams);
      setScheduledMatches(wizardSchedule);
      setMatches([]);
      setSeason("Сезон " + (new Date().getFullYear()));
      
      // 3. Persist
      localStorage.setItem("KFL_V1_TEAMS", JSON.stringify(wizardTeams));
      localStorage.setItem("KFL_V1_SCHEDULED_MATCHES", JSON.stringify(wizardSchedule));
      localStorage.setItem("KFL_V1_MATCHES", JSON.stringify([]));
      localStorage.setItem("KFL_V1_SEASON", "Сезон " + (new Date().getFullYear()));

      // 4. Reset Wizard
      setWizardStep(0);
      setWizardTeams([]);
      setWizardSchedule([]);
      alert("Лига создана успешно!");
      setActiveTab("table");
    }
  };

  const addWizardTeam = (nameInput: string, rosterRaw: string) => {
    if (!nameInput.trim()) {
      alert("Введите название команды!");
      return;
    }

    // Remove "СЛУЖБА" if present (case insensitive)
    const cleanedName = nameInput.replace(/служба/gi, "").trim();

    const lines = rosterRaw.split("\n").filter(l => l.trim().length > 0);
    const players: Player[] = lines.map((line) => {
      // Improved parsing: find number anywhere or assume name
      const parts = line.trim().split(/\s+/);
      let number: number | undefined = undefined;
      let nameParts = [...parts];

      // Check first or last part for number
      const firstNum = parseInt(parts[0]);
      const lastNum = parseInt(parts[parts.length - 1]);

      if (!isNaN(firstNum)) {
        number = firstNum;
        nameParts = parts.slice(1);
      } else if (!isNaN(lastNum)) {
        number = lastNum;
        nameParts = parts.slice(0, parts.length - 1);
      }

      return {
        id: Math.floor(Math.random() * 1000000),
        name: nameParts.join(" "),
        number: number,
        goals: 0,
        ownGoals: 0,
        yellow: 0,
        red: 0,
        banMatches: 0
      };
    });

    const newTeam: Team = {
      id: Date.now() + Math.random(),
      name: cleanedName,
      league: league,
      color: "#" + Math.floor(Math.random() * 16777215).toString(16),
      logo: "⚽",
      matches: 0, win: 0, draw: 0, loss: 0, gf: 0, ga: 0,
      players: players
    };

    setWizardTeams([...wizardTeams, newTeam]);
    setWizardNewTeamName("");
    setWizardBulkRoster("");
  };

  const addTeam = () => {
    if (!newTeamName.trim()) {
      alert("Введите название команды!");
      return;
    }
    const newTeam: Team = {
      id: Date.now(),
      name: newTeamName.trim(),
      league,
      color: "#8b5cf6",
      logo: "⚽",
      matches: 0,
      win: 0,
      draw: 0,
      loss: 0,
      gf: 0,
      ga: 0,
      players: [],
    };
    setTeams(prev => [...prev, newTeam]);
    setNewTeamName("");
    alert(`Команда "${newTeam.name}" добавлена!`);
  };

  const removeTeam = (id: number) => {
    const nextTeams = teams.filter((t) => t.id !== id);
    setTeams(nextTeams);
    localStorage.setItem("KFL_V1_TEAMS", JSON.stringify(nextTeams));
    alert("Команда и её игроки удалены");
  };

  const addPlayer = (teamId: number, name: string) => {
    if (!name.trim()) return;
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          const newPlayer: Player = {
            id: Date.now(),
            name: name.trim(),
            goals: 0,
            ownGoals: 0,
            yellow: 0,
            red: 0,
            banMatches: 0,
          };
          return { ...t, players: [...t.players, newPlayer] };
        }
        return t;
      }),
    );
  };

  const removePlayer = (teamId: number, playerId: number) => {
    setTeams((prev) => {
      const next = prev.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            players: t.players.filter((p) => p.id !== playerId),
          };
        }
        return t;
      });
      localStorage.setItem("KFL_V1_TEAMS", JSON.stringify(next));
      return next;
    });
    alert("Игрок удален из состава");
  };

  const handleImageUpload = (
    file: File,
    callback: (base64: string) => void,
  ) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      callback(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const updateTeam = (teamId: number, updates: Partial<Team>) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, ...updates } : t)),
    );
  };

  useEffect(() => {
    localStorage.setItem("KFL_V1_AVAILABLE_LEAGUES_OBJECTS", JSON.stringify(availableLeagues));
  }, [availableLeagues]);

  const handleHeaderClick = () => {
    const now = Date.now();
    if (now - lastClickTime.current < 1000) {
      clickCount.current++;
    } else {
      clickCount.current = 1;
    }
    lastClickTime.current = now;

    if (clickCount.current === 5) {
      setShowAdminLoginModal(true);
      clickCount.current = 0;
    }
  };

  const tabs = [
    { id: "table" as const, name: "Таблица", icon: ListOrdered },
    { id: "tours" as const, name: "Матчи", icon: Calendar },
    { id: "archive" as const, name: "Архив", icon: LayoutDashboard },
    { id: "scorers" as const, name: "Бомбардиры", icon: Trophy },
    { id: "teams" as const, name: "Команды", icon: Shield },
    ...(isAdmin
      ? [{ id: "admin" as const, name: "Админ", icon: Settings }]
      : []),
  ];

  const updatePlayerStats = (
    teamId: number,
    playerId: number,
    updates: Partial<Player>,
  ) => {
    setTeams((prev) =>
      prev.map((team) => {
        if (team.id === teamId) {
          return {
            ...team,
            players: team.players.map((player) =>
              player.id === playerId ? { ...player, ...updates } : player,
            ),
          };
        }
        return team;
      }),
    );
  };

  const updateMatchPlayerStats = (
    playerId: number,
    updates: Partial<PlayerStats>,
  ) => {
    setMatchPlayerStats((prev) => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || { goals: 0, ownGoals: 0, yellow: 0, red: 0 }),
        ...updates,
      },
    }));
  };

  const applyMatchStats = (match: Match) => {
    const { teamAId, teamBId, scoreA, scoreB, stats } = match;
    setTeams((prevTeams) =>
      prevTeams.map((t) => {
        let updatedTeam = { ...t };
        if (t.id === teamAId) {
          const isWin = scoreA > scoreB;
          const isDraw = scoreA === scoreB;
          updatedTeam = {
            ...updatedTeam,
            matches: updatedTeam.matches + 1,
            win: updatedTeam.win + (isWin ? 1 : 0),
            draw: updatedTeam.draw + (isDraw ? 1 : 0),
            loss: updatedTeam.loss + (scoreA < scoreB ? 1 : 0),
            gf: updatedTeam.gf + scoreA,
            ga: updatedTeam.ga + scoreB,
          };
        }
        if (t.id === teamBId) {
          const isWin = scoreB > scoreA;
          const isDraw = scoreA === scoreB;
          updatedTeam = {
            ...updatedTeam,
            matches: updatedTeam.matches + 1,
            win: updatedTeam.win + (isWin ? 1 : 0),
            draw: updatedTeam.draw + (isDraw ? 1 : 0),
            loss: updatedTeam.loss + (scoreB < scoreA ? 1 : 0),
            gf: updatedTeam.gf + scoreB,
            ga: updatedTeam.ga + scoreA,
          };
        }

        if (t.id === teamAId || t.id === teamBId) {
          updatedTeam.players = updatedTeam.players.map((p) => {
            if (stats[p.id]) {
              return {
                ...p,
                goals: (p.goals || 0) + stats[p.id].goals,
                ownGoals: (p.ownGoals || 0) + stats[p.id].ownGoals,
                yellow: (p.yellow || 0) + stats[p.id].yellow,
                red: (p.red || 0) + stats[p.id].red,
              };
            }
            return p;
          });
        }
        return updatedTeam;
      }),
    );
  };

  const revertMatchStats = (match: Match) => {
    const { teamAId, teamBId, scoreA, scoreB, stats } = match;
    setTeams((prevTeams) =>
      prevTeams.map((t) => {
        let updatedTeam = { ...t };
        if (t.id === teamAId) {
          const isWin = scoreA > scoreB;
          const isDraw = scoreA === scoreB;
          updatedTeam = {
            ...updatedTeam,
            matches: Math.max(0, updatedTeam.matches - 1),
            win: Math.max(0, updatedTeam.win - (isWin ? 1 : 0)),
            draw: Math.max(0, updatedTeam.draw - (isDraw ? 1 : 0)),
            loss: Math.max(0, updatedTeam.loss - (scoreA < scoreB ? 1 : 0)),
            gf: Math.max(0, updatedTeam.gf - scoreA),
            ga: Math.max(0, updatedTeam.ga - scoreB),
          };
        }
        if (t.id === teamBId) {
          const isWin = scoreB > scoreA;
          const isDraw = scoreA === scoreB;
          updatedTeam = {
            ...updatedTeam,
            matches: Math.max(0, updatedTeam.matches - 1),
            win: Math.max(0, updatedTeam.win - (isWin ? 1 : 0)),
            draw: Math.max(0, updatedTeam.draw - (isDraw ? 1 : 0)),
            loss: Math.max(0, updatedTeam.loss - (scoreB < scoreA ? 1 : 0)),
            gf: Math.max(0, updatedTeam.gf - scoreB),
            ga: Math.max(0, updatedTeam.ga - scoreA),
          };
        }

        if (t.id === teamAId || t.id === teamBId) {
          updatedTeam.players = updatedTeam.players.map((p) => {
            if (stats && stats[p.id]) {
              return {
                ...p,
                goals: Math.max(0, (p.goals || 0) - stats[p.id].goals),
                ownGoals: Math.max(0, (p.ownGoals || 0) - stats[p.id].ownGoals),
                yellow: Math.max(0, (p.yellow || 0) - stats[p.id].yellow),
                red: Math.max(0, (p.red || 0) - stats[p.id].red),
              };
            }
            return p;
          });
        }
        return updatedTeam;
      }),
    );
  };

  const recordMatch = (
    teamAId: number,
    teamBId: number,
    scoreA: number,
    scoreB: number,
    tour: number,
    stats: Record<number, PlayerStats>,
    scheduledMatchId?: number,
  ) => {
    const newMatch: Match = {
      id: Date.now(),
      teamAId,
      teamBId,
      tour,
      scoreA,
      scoreB,
      date: new Date().toLocaleDateString(),
      stats,
      league,
    };
    const nextMatches = [...matches, newMatch];
    setMatches(nextMatches);
    localStorage.setItem("KFL_V1_MATCHES", JSON.stringify(nextMatches));

    if (scheduledMatchId) {
      const nextScheduled = scheduledMatches.filter((sm) => sm.id !== scheduledMatchId);
      setScheduledMatches(nextScheduled);
      localStorage.setItem("KFL_V1_SCHEDULED_MATCHES", JSON.stringify(nextScheduled));
    }
    applyMatchStats(newMatch);
  };

  const deleteMatch = (matchId: number) => {
    const matchToDelete = matches.find((m) => m.id === matchId);
    if (!matchToDelete) return;

    // Direct deletion because window.confirm might be blocked in the preview environment
    revertMatchStats(matchToDelete);
    setMatches((prev) => prev.filter((m) => m.id !== matchId));
    alert("Результат матча удален, статистика пересчитана.");
  };

  const updateMatch = (
    matchId: number,
    teamAId: number,
    teamBId: number,
    scoreA: number,
    scoreB: number,
    tour: number,
    stats: Record<number, PlayerStats>,
  ) => {
    const oldMatch = matches.find((m) => m.id === matchId);
    if (!oldMatch) return;

    // 1. Revert stats for the old result
    revertMatchStats(oldMatch);

    // 2. Prepare the updated match data
    const updatedMatch: Match = {
      ...oldMatch,
      teamAId,
      teamBId,
      scoreA,
      scoreB,
      tour,
      stats,
    };

    // 3. Update matches array
    setMatches((prev) => prev.map((m) => (m.id === matchId ? updatedMatch : m)));

    // 4. Apply stats for the new result
    applyMatchStats(updatedMatch);
  };

  const getFilteredTeams = () =>
    currentTeams
      .filter((t) => t.league === league)
      .sort((a, b) => {
        const pointsA = a.win * 3 + a.draw;
        const pointsB = b.win * 3 + b.draw;
        if (pointsB !== pointsA) return pointsB - pointsA;
        const gdA = a.gf - a.ga;
        const gdB = b.gf - b.ga;
        if (gdB !== gdA) return gdB - gdA;
        return b.gf - a.gf;
      });

  const getTopScorers = () =>
    currentTeams
      .filter((t) => t.league === league)
      .flatMap((t) => t.players.map((p) => ({ ...p, teamName: t.name })))
      .filter((p) => (p.goals || 0) > 0)
      .sort((a, b) => (b.goals || 0) - (a.goals || 0));

  const [matchForm, setMatchForm] = useState({
    teamAId: "",
    teamBId: "",
    scoreA: "",
    scoreB: "",
    tour: "",
  });
  const [scheduledMatchForm, setScheduledMatchForm] = useState({
    teamAId: "",
    teamBId: "",
    tour: "",
    dateTime: "",
  });

  return (
    <>
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onSuccess={() => {
          setIsAdmin(true);
          localStorage.setItem("KFL_V1_IS_ADMIN", "true");
        }}
        correctLogin={ADMIN_LOGIN}
        correctPassword={ADMIN_PASSWORD}
      />
      <div className="min-h-screen bg-brand-bg font-sans text-slate-200 pb-20">
      <header className="sticky top-0 z-50 glass px-6 py-4 flex flex-col items-center gap-4">
        <h1
          className="text-xl md:text-2xl font-black text-white uppercase tracking-[0.2em] cursor-pointer select-none text-center"
          onClick={handleHeaderClick}
        >
          ЧЕМПИОНАТ АБХАЗИИ МИНИ-ФУТБОЛ
        </h1>

        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex bg-slate-800/50 p-1 rounded-xl border border-white/5 w-fit overflow-x-auto">
            {currentLeagues.map(l => (
              <button
                key={l.id}
                onClick={() => { setLeague(l.id); handleLeagueClick(); }}
                className={`px-6 py-1.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${league === l.id ? "bg-brand-accent text-white glow-accent" : "text-slate-400 hover:text-white"}`}
              >
                {l.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <select
                value={activeSeasonId}
                onChange={(e) => {
                  const val = e.target.value;
                  setActiveSeasonId(val === "current" ? "current" : Number(val));
                  if (activeTab === "history" && val === "current") {
                    setActiveTab("table");
                  }
                }}
                className="h-9 min-w-[140px] bg-slate-800/80 border border-white/10 rounded-xl px-4 py-1 text-[10px] font-black text-white uppercase tracking-widest focus:outline-none focus:border-brand-accent cursor-pointer appearance-none pr-8"
              >
                <option value="current">● Текущий: {season}</option>
                {seasonHistory.map((s) => (
                  <option key={s.id} value={s.id}>
                    Архив: {s.seasonName}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* View Mode Banner */}
      {activeSeasonId !== "current" && (
        <div className="bg-brand-accent/20 border-y border-brand-accent/30 py-3 px-6 animate-in fade-in slide-in-from-top duration-500 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sticky top-[132px] md:top-[84px] z-40 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
            <p className="text-[10px] font-black text-white uppercase tracking-widest leading-relaxed text-center">
              Вы просматриваете архивный сезон: <span className="text-brand-accent">{seasonHistory.find(s => s.id === activeSeasonId)?.seasonName}</span>
            </p>
          </div>
          <button 
            onClick={() => setActiveSeasonId("current")}
            className="flex items-center gap-2 px-4 py-1.5 bg-brand-accent text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-transform glow-accent"
          >
            <History className="w-3 h-3" />
            Вернуться в текущий
          </button>
        </div>
      )}

      <main className={`mx-auto p-4 md:p-8 space-y-8 ${activeTab === "admin" ? "w-full max-w-none px-4 md:px-12" : "max-w-7xl px-4 md:px-0"}`}>
        {activeTab === "tours" && (
          <section className="bg-brand-card shadow-2xl rounded-2xl overflow-hidden border border-brand-border">
            <div className="p-6 border-b border-brand-border bg-gradient-to-r from-brand-accent/10 to-transparent">
              <h3 className="font-black text-lg text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-accent" />
                {selectedMatchId ? "Протокол матча" : "Календарь матчей"}
              </h3>
            </div>

            <div className="p-4 md:p-6">
              {selectedMatchId ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {(() => {
                    const m = matches.find((ma) => ma.id === selectedMatchId);
                    if (!m) return null;
                    const tA = teams.find((t) => t.id === m.teamAId);
                    const tB = teams.find((t) => t.id === m.teamBId);
                    return (
                      <div className="space-y-8">
                        <div className="flex justify-around items-center gap-4">
                          <div className="flex flex-col items-center gap-2 flex-1 text-center">
                            <div className="w-20 h-20 rounded-2xl overflow-hidden glass border border-white/10 flex items-center justify-center p-2">
                              {tA?.logo.startsWith("data:") ||
                              tA?.logo.startsWith("http") ? (
                                <img
                                  src={tA.logo}
                                  alt=""
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <span className="text-4xl">{tA?.logo}</span>
                              )}
                            </div>
                            <p className="font-black text-sm text-white">
                              {tA?.name}
                            </p>
                          </div>

                          <div className="flex flex-col items-center gap-2">
                            <div className="bg-brand-accent text-white font-black text-4xl px-6 py-3 rounded-2xl glow-accent">
                              {m.scoreA} : {m.scoreB}
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                              {m.date}
                            </p>
                          </div>

                          <div className="flex flex-col items-center gap-2 flex-1 text-center">
                            <div className="w-20 h-20 rounded-2xl overflow-hidden glass border border-white/10 flex items-center justify-center p-2">
                              {tB?.logo.startsWith("data:") ||
                              tB?.logo.startsWith("http") ? (
                                <img
                                  src={tB.logo}
                                  alt=""
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <span className="text-4xl">{tB?.logo}</span>
                              )}
                            </div>
                            <p className="font-black text-sm text-white">
                              {tB?.name}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-brand-border">
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center py-1 bg-slate-800/50 rounded-lg">
                              {tA?.name}
                            </h4>
                            <div className="space-y-2">
                              {tA?.players.map((player) => {
                                const s = m.stats[player.id];
                                const isBanned = (player.banMatches || 0) > 0;
                                return (
                                  <div
                                    key={player.id}
                                    className={`group flex items-center gap-3 p-2 rounded-xl border border-transparent transition-all ${s ? "bg-slate-800/40 border-white/5" : "opacity-40 grayscale"}`}
                                  >
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-bg border border-brand-border flex-shrink-0 flex items-center justify-center">
                                      {player.photo ? (
                                        <img
                                          src={player.photo}
                                          alt=""
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <User className="w-4 h-4 text-slate-600" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div
                                        className={`text-xs font-bold truncate ${isBanned ? "glow-red font-black" : "text-slate-300"}`}
                                      >
                                        {player.name}
                                      </div>
                                      <div className="flex flex-wrap gap-1.5 mt-1">
                                        {s?.goals ? (
                                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black">
                                            Г:{s.goals}
                                          </span>
                                        ) : null}
                                        {s?.ownGoals ? (
                                          <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-black underline">
                                            аГ:{s.ownGoals}
                                          </span>
                                        ) : null}
                                        {s?.yellow ? (
                                          <div className="w-2 h-3 bg-yellow-400 rounded-sm shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                                        ) : null}
                                        {s?.red ? (
                                          <div className="w-2 h-3 bg-red-500 rounded-sm shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center py-1 bg-slate-800/50 rounded-lg">
                              {tB?.name}
                            </h4>
                            <div className="space-y-2">
                              {tB?.players.map((player) => {
                                const s = m.stats[player.id];
                                const isBanned = (player.banMatches || 0) > 0;
                                return (
                                  <div
                                    key={player.id}
                                    className={`group flex flex-row-reverse items-center gap-3 p-2 rounded-xl border border-transparent transition-all ${s ? "bg-slate-800/40 border-white/5" : "opacity-40 grayscale"}`}
                                  >
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-bg border border-brand-border flex-shrink-0 flex items-center justify-center">
                                      {player.photo ? (
                                        <img
                                          src={player.photo}
                                          alt=""
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <User className="w-4 h-4 text-slate-600" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0 text-right">
                                      <div
                                        className={`text-xs font-bold truncate ${isBanned ? "glow-red font-black" : "text-slate-300"}`}
                                      >
                                        {player.name}
                                      </div>
                                      <div className="flex flex-wrap flex-row-reverse gap-1.5 mt-1">
                                        {s?.goals ? (
                                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black">
                                            Г:{s.goals}
                                          </span>
                                        ) : null}
                                        {s?.ownGoals ? (
                                          <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-black underline">
                                            аГ:{s.ownGoals}
                                          </span>
                                        ) : null}
                                        {s?.yellow ? (
                                          <div className="w-2 h-3 bg-yellow-400 rounded-sm shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                                        ) : null}
                                        {s?.red ? (
                                          <div className="w-2 h-3 bg-red-500 rounded-sm shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedMatchId(null);
                            setActiveTab("tours");
                          }}
                          className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-brand-bg border border-brand-border text-slate-400 hover:text-white transition-all"
                        >
                          Вернуться к списку
                        </button>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-10">
                  {(() => {
                    const leagueMatches = currentMatches.filter(
                      (m) => m.league === league,
                    );
                    const leagueScheduled = currentScheduledMatches.filter(
                      (m) => m.league === league,
                    );
                    const allTours = [
                      ...new Set([
                        ...leagueMatches.map((m) => m.tour),
                        ...leagueScheduled.map((m) => m.tour),
                      ]),
                    ].sort((a, b) => Number(a) - Number(b));

                    if (allTours.length === 0)
                      return (
                        <p className="text-center text-xs text-slate-500 font-bold uppercase py-12">
                          Нет матчей в этой лиге
                        </p>
                      );

                    return allTours.map((tour) => (
                      <div key={tour} className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="h-[1px] flex-1 bg-brand-border" />
                          <h4 className="font-black text-brand-accent text-xs uppercase tracking-[0.2em]">
                            {tour} ТУР
                          </h4>
                          <div className="h-[1px] flex-1 bg-brand-border" />
                        </div>
                        <div className="grid gap-3">
                          {leagueMatches
                            .filter((m) => m.tour === tour)
                            .map((m) => {
                              const tA = currentTeams.find((t) => t.id === m.teamAId);
                              const tB = currentTeams.find((t) => t.id === m.teamBId);
                              return (
                                <div
                                  key={`played-${m.id}`}
                                  className="group flex justify-between items-center bg-slate-800/30 p-4 rounded-2xl cursor-pointer border border-transparent hover:border-brand-accent/30 hover:bg-slate-800/50 transition-all shadow-sm"
                                  onClick={() => setSelectedMatchId(m.id)}
                                >
                                  <div className="flex-1 flex items-center justify-end gap-3 pr-2 md:pr-6 overflow-hidden">
                                    <span className="font-bold text-xs md:text-sm truncate text-white uppercase">
                                      {tA?.name}
                                    </span>
                                    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-brand-bg border border-brand-border flex items-center justify-center p-1.5">
                                      {tA?.logo.startsWith("data:") ||
                                      tA?.logo.startsWith("http") ? (
                                        <img
                                          src={tA.logo}
                                          alt=""
                                          className="w-full h-full object-contain"
                                        />
                                      ) : (
                                        <span className="text-[10px]">
                                          {tA?.logo}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="bg-brand-accent/20 border border-brand-accent/30 text-brand-accent font-black px-4 py-1.5 rounded-xl text-sm md:text-lg glow-accent min-w-[70px] text-center">
                                    {m.scoreA} : {m.scoreB}
                                  </div>
                                  <div className="flex-1 flex items-center justify-start gap-3 pl-2 md:pl-6 overflow-hidden">
                                    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-brand-bg border border-brand-border flex items-center justify-center p-1.5">
                                      {tB?.logo.startsWith("data:") ||
                                      tB?.logo.startsWith("http") ? (
                                        <img
                                          src={tB.logo}
                                          alt=""
                                          className="w-full h-full object-contain"
                                        />
                                      ) : (
                                        <span className="text-[10px]">
                                          {tB?.logo}
                                        </span>
                                      )}
                                    </div>
                                    <span className="font-bold text-xs md:text-sm truncate text-white uppercase">
                                      {tB?.name}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          {leagueScheduled
                            .filter((m) => m.tour === tour)
                            .map((m) => {
                              const tA = currentTeams.find((t) => t.id === m.teamAId);
                              const tB = currentTeams.find((t) => t.id === m.teamBId);
                              return (
                                <div
                                  key={`scheduled-${m.id}`}
                                  className="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-brand-border/50 text-slate-500"
                                >
                                  <div className="flex-1 flex items-center justify-end gap-3 pr-2 md:pr-6 overflow-hidden opacity-60">
                                    <span className="text-xs font-bold truncate uppercase">
                                      {tA?.name}
                                    </span>
                                    <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 bg-brand-bg border border-brand-border flex items-center justify-center p-1.5 grayscale">
                                      {tA?.logo.startsWith("data:") ||
                                      tA?.logo.startsWith("http") ? (
                                        <img
                                          src={tA.logo}
                                          alt=""
                                          className="w-full h-full object-contain"
                                        />
                                      ) : (
                                        <span className="text-[10px]">
                                          {tA?.logo}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-[9px] font-black px-3 py-1.5 bg-slate-800 rounded-lg border border-brand-border text-slate-400 text-center min-w-[100px] uppercase tracking-widest">
                                    {m.dateTime || "TBD"}
                                  </div>
                                  <div className="flex-1 flex items-center justify-start gap-3 pl-2 md:pl-6 overflow-hidden opacity-60">
                                    <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 bg-brand-bg border border-brand-border flex items-center justify-center p-1.5 grayscale">
                                      {tB?.logo.startsWith("data:") ||
                                      tB?.logo.startsWith("http") ? (
                                        <img
                                          src={tB.logo}
                                          alt=""
                                          className="w-full h-full object-contain"
                                        />
                                      ) : (
                                        <span className="text-[10px]">
                                          {tB?.logo}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs font-bold truncate uppercase">
                                      {tB?.name}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "teamDetail" && selectedTeamId && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {(() => {
              const team = currentTeams.find((t) => t.id === selectedTeamId);
              if (!team) return null;

              const teamMatches = currentMatches.filter(
                (m) =>
                  m.teamAId === selectedTeamId || m.teamBId === selectedTeamId,
              );
              const teamScheduled = currentScheduledMatches.filter(
                (m) =>
                  m.teamAId === selectedTeamId || m.teamBId === selectedTeamId,
              );

              return (
                <>
                  {/* Team Header Card */}
                  <section className="bg-brand-card shadow-2xl rounded-2xl overflow-hidden border border-brand-border p-6 relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-bl-full -mr-16 -mt-16" />
                    <div className="flex flex-col md:flex-row items-center gap-6 relative">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden glass border border-white/10 flex items-center justify-center p-4">
                        {team.logo.startsWith("data:") ||
                        team.logo.startsWith("http") ? (
                          <img
                            src={team.logo}
                            alt=""
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-5xl">{team.logo}</span>
                        )}
                      </div>
                      <div className="text-center md:text-left flex-1 space-y-2">
                        <div className="flex items-center justify-center md:justify-start gap-3 group/name">
                          <h2 className="text-3xl font-black text-white uppercase tracking-wider">
                            {team.name}
                          </h2>
                          {isAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const newName = window.prompt("Введите новое название команды:", team.name);
                                if (newName && newName.trim() !== "" && newName !== team.name) {
                                  setTeams(prev => prev.map(t => t.id === team.id ? { ...t, name: newName.trim() } : t));
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-brand-accent bg-white/5 hover:bg-brand-accent/10 rounded-lg transition-all opacity-0 group-hover/name:opacity-100"
                              title="Редактировать название"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3">
                          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded-full border border-white/5">
                            <span className="text-[10px] font-black text-slate-500 uppercase">
                              Очки:
                            </span>
                            <span className="text-xs font-black text-brand-accent">
                              {team.win * 3 + team.draw}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded-full border border-white/5">
                            <span className="text-[10px] font-black text-slate-500 uppercase">
                              Матчи:
                            </span>
                            <span className="text-xs font-black text-white">
                              {team.matches}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                            <span className="text-[10px] font-black text-emerald-500 uppercase">
                              В:
                            </span>
                            <span className="text-xs font-black text-emerald-400">
                              {team.win}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/20">
                            <span className="text-[10px] font-black text-yellow-500 uppercase">
                              Н:
                            </span>
                            <span className="text-xs font-black text-yellow-400">
                              {team.draw}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20">
                            <span className="text-[10px] font-black text-red-500 uppercase">
                              П:
                            </span>
                            <span className="text-xs font-black text-red-400">
                              {team.loss}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab("teams")}
                        className="px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest bg-brand-accent/20 border border-brand-accent/40 text-brand-accent hover:bg-brand-accent hover:text-white transition-all shadow-lg shadow-brand-accent/10"
                      >
                        Назад
                      </button>
                    </div>
                  </section>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Roster Section */}
                    <section className="bg-brand-card shadow-2xl rounded-2xl overflow-hidden border border-brand-border h-full flex flex-col">
                      <div className="p-4 border-b border-brand-border bg-slate-800/50 flex items-center gap-2">
                        <Users className="w-4 h-4 text-brand-accent shadow-glow" />
                        <h3 className="font-black text-xs text-white uppercase tracking-widest">
                          Состав Команды
                        </h3>
                      </div>
                      <div className="p-4 space-y-2 flex-1 overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-slate-700">
                        {team.players
                          .sort((a, b) => (b.goals || 0) - (a.goals || 0))
                          .map((player) => (
                            <div
                              key={player.id}
                              className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/20 border border-transparent hover:border-brand-accent/40 cursor-pointer hover:bg-slate-800/40 transition-all group"
                              onClick={() => setSelectedPlayerId(player.id)}
                            >
                              <div className="w-10 h-10 rounded-full bg-brand-bg border border-brand-border flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:border-brand-accent/50 transition-colors">
                                {player.photo ? (
                                  <img
                                    src={player.photo}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <User className="w-5 h-5 text-slate-700" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-xs font-bold truncate group-hover:text-brand-accent transition-colors ${player.permanentBan || player.banMatches ? "text-red-400 animate-pulse" : "text-white"}`}
                                >
                                  {player.name}
                                </p>
                                <div className="flex gap-2 mt-1">
                                  {player.goals > 0 && (
                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-tighter">
                                      🏆 {player.goals}
                                    </span>
                                  )}
                                  {player.yellow > 0 && (
                                    <span className="text-[9px] font-black text-yellow-400 flex items-center gap-0.5">
                                      🟨 {player.yellow}
                                    </span>
                                  )}
                                  {player.red > 0 && (
                                    <span className="text-[9px] font-black text-red-400 flex items-center gap-0.5">
                                      🟥 {player.red}
                                    </span>
                                  )}
                                  {player.permanentBan ? (
                                    <span className="text-[9px] font-black text-white bg-red-600 px-1.5 rounded uppercase tracking-tighter">
                                      BANNED
                                    </span>
                                  ) : (
                                    player.banMatches > 0 && (
                                      <span className="text-[9px] font-black text-red-500 bg-red-500/10 px-1.5 rounded uppercase tracking-tighter">
                                        Ban: {player.banMatches}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Search className="w-3 h-3 text-brand-accent" />
                              </div>
                            </div>
                          ))}
                        {team.players.length === 0 && (
                          <p className="text-center text-slate-600 py-10 italic text-sm">
                            В составе пока нет игроков
                          </p>
                        )}
                      </div>
                    </section>

                    {/* Matches Section */}
                    <section className="space-y-6">
                      <div className="bg-brand-card shadow-2xl rounded-2xl overflow-hidden border border-brand-border">
                        <div className="p-4 border-b border-brand-border bg-slate-800/50 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-brand-accent shadow-glow" />
                          <h3 className="font-black text-xs text-white uppercase tracking-widest">
                            Прошедшие Игры
                          </h3>
                        </div>
                        <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-slate-700">
                          {teamMatches
                            .sort((a, b) => b.id - a.id)
                            .map((m) => {
                              const isTeamA = m.teamAId === selectedTeamId;
                              const opponent = teams.find(
                                (t) =>
                                  t.id === (isTeamA ? m.teamBId : m.teamAId),
                              );
                              const isWin =
                                (isTeamA && m.scoreA > m.scoreB) ||
                                (!isTeamA && m.scoreB > m.scoreA);
                              const isDraw = m.scoreA === m.scoreB;

                              return (
                                <div
                                  key={m.id}
                                  className="group flex justify-between items-center bg-slate-800/30 p-4 rounded-xl cursor-pointer hover:bg-slate-800/50 border border-transparent hover:border-brand-accent/20 transition-all"
                                  onClick={() => {
                                    setSelectedMatchId(m.id);
                                    setActiveTab("tours");
                                  }}
                                >
                                  <div className="flex items-center gap-4">
                                    <div
                                      className={`w-2 h-2 rounded-full ${isWin ? "bg-emerald-500 shadow-glow-emerald" : isDraw ? "bg-yellow-500" : "bg-red-500"}`}
                                    />
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[10px] font-black text-white uppercase truncate">
                                        vs {opponent?.name}
                                      </span>
                                      <span className="text-[8px] text-slate-500 font-bold uppercase">
                                        {m.date}
                                      </span>
                                    </div>
                                  </div>
                                  <span
                                    className={`font-black text-base tabular-nums ${isWin ? "text-emerald-400" : isDraw ? "text-yellow-400" : "text-red-400"}`}
                                  >
                                    {isTeamA
                                      ? `${m.scoreA}:${m.scoreB}`
                                      : `${m.scoreB}:${m.scoreA}`}
                                  </span>
                                </div>
                              );
                            })}
                          {teamMatches.length === 0 && (
                            <p className="text-center text-slate-600 py-8 italic text-[10px] uppercase">
                              Нет данных об играх
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="bg-brand-card shadow-2xl rounded-2xl overflow-hidden border border-brand-border">
                        <div className="p-4 border-b border-brand-border bg-slate-800/50 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <h3 className="font-black text-xs text-white uppercase tracking-widest">
                            Будущие Игры
                          </h3>
                        </div>
                        <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-slate-700">
                          {teamScheduled.map((m) => {
                            const opponent = teams.find(
                              (t) =>
                                t.id ===
                                (m.teamAId === selectedTeamId
                                  ? m.teamBId
                                  : m.teamAId),
                            );
                            return (
                              <div
                                key={m.id}
                                className="flex justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-brand-border/30"
                              >
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-black text-slate-300 uppercase">
                                    vs {opponent?.name}
                                  </span>
                                  <span className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">
                                    Тур {m.tour}
                                  </span>
                                </div>
                                <span className="text-[9px] font-black text-brand-accent bg-brand-accent/5 px-3 py-1.5 rounded-lg border border-brand-accent/20">
                                  {m.dateTime || "TBD"}
                                </span>
                              </div>
                            );
                          })}
                          {teamScheduled.length === 0 && (
                            <p className="text-center text-slate-600 py-8 italic text-[10px] uppercase">
                              Расписание не составлено
                            </p>
                          )}
                        </div>
                      </div>
                    </section>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {activeTab === "table" && (
          <section className="space-y-6">
            {seasonHistory.length > 0 && (
              <div 
                className="bg-brand-card shadow-2xl rounded-2xl overflow-hidden border border-brand-accent/30 p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative group cursor-pointer"
                onClick={() => {
                  setCurrentResult(seasonHistory[0]);
                  setShowCelebration(true);
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-bl-full -mr-16 -mt-16 group-hover:bg-brand-accent/10 transition-colors" />
                <div className="flex items-center gap-4">
                  <div className="bg-brand-accent/20 p-3 rounded-2xl">
                    <Trophy className="w-6 h-6 text-brand-accent animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-brand-accent uppercase tracking-widest">Последние итоги</h4>
                    <p className="text-sm font-black text-white uppercase">{seasonHistory[0].seasonName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Чемпион</p>
                    <p className="text-xs font-black text-white">{seasonHistory[0].winner.name}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Бомбардир</p>
                    <p className="text-xs font-black text-white">{seasonHistory[0].topScorer?.name || "—"}</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-slate-800 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest border border-white/5 hover:text-white hover:border-brand-accent/30 transition-all">
                  Смотреть
                </button>
              </div>
            )}
            <div className="bg-brand-card shadow-2xl rounded-2xl overflow-hidden border border-brand-border">
            <div className="p-6 border-b border-brand-border bg-gradient-to-r from-brand-accent/20 to-transparent flex items-center justify-between">
              <h2 
                onClick={handleLeagueClick}
                className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-wider cursor-pointer select-none"
              >
                <ListOrdered className="h-6 w-6 text-brand-accent" />{" "}
                {currentLeagueName}
              </h2>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-brand-bg px-3 py-1 rounded-full border border-brand-border">
                {season}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-brand-border">
                    <th className="p-4 text-center">М</th>
                    <th className="p-4 text-left">Команда</th>
                    <th className="p-4 text-center text-white">Очки</th>
                    <th className="p-4 text-center">И</th>
                    <th className="p-4 text-center text-emerald-400">В</th>
                    <th className="p-4 text-center text-yellow-400">Н</th>
                    <th className="p-4 text-center text-red-400">П</th>
                    <th className="p-4 text-center">ЗМ</th>
                    <th className="p-4 text-center">ПМ</th>
                    <th className="p-4 text-center">РМ</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredTeams().map((team, index) => (
                    <tr
                      key={team.id}
                      className="group border-b border-brand-border/50 transition-colors hover:bg-slate-800/30 odd:bg-white/[0.02]"
                    >
                      <td className="p-4 text-center font-black text-slate-500">
                        {index + 1}
                      </td>
                      <td className="p-4 text-left">
                        <div
                          className="flex items-center gap-3 cursor-pointer group-hover:translate-x-1 transition-transform"
                          onClick={() => {
                            setSelectedTeamId(team.id);
                            setActiveTab("teamDetail");
                          }}
                        >
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-bg border border-brand-border flex items-center justify-center p-1">
                              {team.logo.startsWith("data:") ||
                              team.logo.startsWith("http") ? (
                                <img
                                  src={team.logo}
                                  alt=""
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <span className="text-xs">{team.logo}</span>
                              )}
                            </div>
                            <div
                              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-brand-card shadow-sm"
                              style={{ backgroundColor: team.color }}
                            />
                          </div>
                          <span className="font-bold text-white group-hover:text-brand-accent transition-colors">
                            {team.name}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-brand-accent/10 border border-brand-accent/20 rounded-lg font-black text-brand-accent glow-accent">
                          {team.win * 3 + team.draw}
                        </div>
                      </td>
                      <td className="p-4 text-center font-medium text-slate-400">
                        {team.matches}
                      </td>
                      <td className="p-4 text-center font-bold text-emerald-500/80">
                        {team.win}
                      </td>
                      <td className="p-4 text-center font-bold text-yellow-500/80">
                        {team.draw}
                      </td>
                      <td className="p-4 text-center font-bold text-red-500/80">
                        {team.loss}
                      </td>
                      <td className="p-4 text-center text-slate-400">
                        {team.gf}
                      </td>
                      <td className="p-4 text-center text-slate-400">
                        {team.ga}
                      </td>
                      <td
                        className={`p-4 text-center font-bold ${team.gf - team.ga >= 0 ? "text-emerald-500/60" : "text-red-500/60"}`}
                      >
                        {team.gf - team.ga > 0
                          ? `+${team.gf - team.ga}`
                          : team.gf - team.ga}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-800/10 border-t border-brand-border/30">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest text-center">
                Система начисления: Победа +3 • Ничья +1 • Поражение 0
              </p>
            </div>
          </div>
        </section>
      )}

        {activeTab === "scorers" && (
          <div className="max-w-xl mx-auto w-full">
            <section className="bg-brand-card shadow-2xl rounded-2xl overflow-hidden border border-brand-border">
              <div className="p-4 border-b border-brand-border bg-gradient-to-r from-emerald-500/10 to-transparent">
                <h3 className="font-black text-xs text-white uppercase tracking-widest flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-emerald-400" /> Бомбардиры
                </h3>
              </div>
              <div className="p-4 space-y-1">
                {getTopScorers()
                  .filter((p) => p.goals > 0)
                  .sort((a, b) => b.goals - a.goals)
                  .slice(0, 20)
                  .map((p, i) => (
                    <div
                      key={p.id}
                      className="group flex justify-between items-center p-2 rounded-xl hover:bg-white/[0.03] transition-all cursor-pointer"
                      onClick={() => setSelectedPlayerId(p.id)}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="text-[10px] font-black text-slate-500 w-4">
                          {i + 1}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-brand-bg overflow-hidden flex-shrink-0 border border-brand-border group-hover:border-emerald-500/30 transition-colors">
                          {p.photo ? (
                            <img
                              src={p.photo}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 m-auto text-slate-700" />
                          )}
                        </div>
                        <div className="flex flex-col truncate">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-xs font-bold transition-colors ${p.permanentBan ? "text-red-500 line-through opacity-60" : "text-white group-hover:text-emerald-400"}`}
                            >
                              {p.name}
                            </span>
                            {p.permanentBan && (
                              <AlertTriangle className="w-2.5 h-2.5 text-red-500" />
                            )}
                          </div>
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">
                            {p.teamName}
                          </span>
                        </div>
                      </div>
                      <span className="font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg text-xs shadow-sm">
                        {p.goals}
                      </span>
                    </div>
                  ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "archive" && (
          <div className="max-w-4xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center justify-center gap-3">
                <LayoutDashboard className="w-8 h-8 text-brand-accent" /> Архив сезонов
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Итоговые таблицы и лучшие бомбардиры прошлых лет</p>
            </div>
            
            {seasonHistory.length === 0 ? (
              <div className="bg-brand-card p-16 rounded-[32px] border border-dashed border-brand-border text-center">
                <Trophy className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                <p className="text-slate-500 uppercase tracking-widest font-black text-xs">История пока пуста</p>
                <p className="text-slate-600 text-[10px] mt-2">Завершите сезон, чтобы сохранить результаты</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {seasonHistory.map((item) => (
                  <div 
                    key={item.id}
                    className="bg-brand-card rounded-2xl border border-brand-border hover:border-brand-accent/50 transition-all p-5 flex flex-col md:flex-row items-center gap-6 group cursor-pointer"
                    onClick={() => {
                      setCurrentResult(item);
                      setShowCelebration(true);
                    }}
                  >
                    <div className="flex-shrink-0 text-center md:text-left min-w-[120px]">
                      <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest">{item.date}</span>
                      <h4 className="text-lg font-black text-white uppercase tracking-tighter leading-none mt-1">{item.seasonName}</h4>
                    </div>

                    <div className="flex-1 flex items-center justify-around w-full border-y md:border-y-0 md:border-l border-white/5 py-4 md:py-0 md:pl-6">
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Победитель</p>
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center p-2 text-xl overflow-hidden border border-brand-border">
                          {item.winner.logo.startsWith("data:") || item.winner.logo.startsWith("http") ? (
                            <img src={item.winner.logo} className="w-full h-full object-contain" />
                          ) : (
                            item.winner.logo
                          )}
                        </div>
                        <span className="text-[11px] font-black text-white uppercase">{item.winner.name}</span>
                      </div>

                      <div className="flex flex-col items-center gap-2">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Бомбардир</p>
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-emerald-500/20 shadow-lg">
                          {item.topScorer?.photo ? (
                            <img src={item.topScorer.photo} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-slate-600" />
                          )}
                        </div>
                        <span className="text-[11px] font-black text-white uppercase">{item.topScorer?.name || "—"}</span>
                      </div>
                    </div>

                    <button className="flex-shrink-0 w-full md:w-auto px-6 py-3 bg-slate-800/50 hover:bg-brand-accent text-[10px] font-black text-slate-400 hover:text-white rounded-xl uppercase tracking-widest transition-all border border-white/5 hover:border-brand-accent">
                      Детали
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "teams" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {currentTeams
              .filter((t) => t.league === league)
              .map((team) => (
                <div
                  key={team.id}
                  className="group bg-brand-card p-6 rounded-2xl border border-brand-border cursor-pointer hover:border-brand-accent transition-all duration-500 hover:-translate-y-1 flex flex-col items-center gap-4 relative overflow-hidden"
                  onClick={() => {
                    setSelectedTeamId(team.id);
                    setActiveTab("teamDetail");
                  }}
                >
                  {/* Background accent */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/5 rounded-bl-full -mr-12 -mt-12 group-hover:bg-brand-accent/10 transition-colors" />

                  <div className="w-20 h-20 rounded-2xl overflow-hidden glass border border-white/5 shadow-xl flex items-center justify-center p-4 group-hover:scale-110 transition-transform duration-500">
                    {team.logo.startsWith("data:") ||
                    team.logo.startsWith("http") ? (
                      <img
                        src={team.logo}
                        alt=""
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-4xl">{team.logo}</span>
                    )}
                  </div>
                  <div className="text-center group/name w-full">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <h3 className="font-black text-white uppercase tracking-wider group-hover:text-brand-accent transition-colors truncate max-w-[150px]">
                        {team.name}
                      </h3>
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newName = window.prompt("Введите новое название команды:", team.name);
                            if (newName && newName.trim() !== "" && newName !== team.name) {
                              setTeams(prev => prev.map(t => t.id === team.id ? { ...t, name: newName.trim() } : t));
                            }
                          }}
                          className="p-1 text-slate-500 hover:text-brand-accent bg-white/5 hover:bg-brand-accent/10 rounded transition-all opacity-0 group-hover/name:opacity-100"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em]">
                      Основан 2024
                    </p>
                  </div>

                  <div className="w-full relative">
                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5 -z-10" />
                    <div className="flex justify-center">
                      <div className="bg-brand-accent/20 border border-brand-accent/40 px-3 py-1 rounded-full backdrop-blur-md">
                        <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest">
                          {team.win * 3 + team.draw} ПТС
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full grid grid-cols-3 gap-2 mt-2">
                    <div className="text-center p-2 rounded-lg bg-emerald-500/5">
                      <p className="text-[8px] text-slate-600 font-bold uppercase tracking-tighter">
                        Поб
                      </p>
                      <p className="text-xs font-black text-white">
                        {team.win}
                      </p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-yellow-500/5">
                      <p className="text-[8px] text-slate-600 font-bold uppercase tracking-tighter">
                        Нич
                      </p>
                      <p className="text-xs font-black text-white">
                        {team.draw}
                      </p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-red-500/5">
                      <p className="text-[8px] text-slate-600 font-bold uppercase tracking-tighter">
                        Пор
                      </p>
                      <p className="text-xs font-black text-white">
                        {team.loss}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {activeTab === "admin" && isAdmin && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 w-full">
            {/* New League Wizard Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-brand-card p-6 rounded-2xl border border-brand-border shadow-xl">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                  <RefreshCw className={`w-6 h-6 text-brand-accent ${wizardStep > 0 ? "animate-spin" : ""}`} />
                  {wizardStep > 0 ? `Создание новой лиги: Шаг ${wizardStep}` : "Управление лигой"}
                </h2>
                <p className="text-xs font-bold text-slate-500">
                  {wizardStep === 0 ? "Настройка текущего сезона" : "Следуйте шагам для настройки нового турнира"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {wizardStep > 0 ? (
                  <button
                    onClick={() => setWizardStep(0)}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-brand-border flex items-center gap-2"
                  >
                    Отмена
                  </button>
                ) : (
                  <button
                    onClick={() => { setWizardStep(1); setWizardTeams([]); }}
                    className="px-6 py-2.5 bg-brand-accent hover:bg-emerald-600 text-black rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Новый сезон
                  </button>
                )}
              </div>
            </div>

            {/* --- Wizard Steps --- */}
            {wizardStep === 1 && (
              <div className="space-y-6 animate-in zoom-in-95 duration-300">
                <div className="bg-brand-card rounded-2xl border border-brand-border overflow-hidden p-6 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Users className="w-5 h-5 text-brand-accent" /> Добавить команду
                      </h3>
                      <div className="space-y-4 bg-slate-900/50 p-6 rounded-2xl border border-brand-border h-full">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Название новой команды</label>
                          <input
                            type="text"
                            placeholder="Напр. Аэропорт"
                            className="w-full bg-slate-800 border border-brand-border rounded-xl px-4 py-3 text-sm font-black text-white focus:outline-none"
                            value={wizardNewTeamName}
                            onChange={(e) => setWizardNewTeamName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-emerald-400">Вставить список игроков для этой команды (быстрый ввод)</label>
                          <textarea
                            placeholder="1 Иванов Иван&#10;2 Петров Петр"
                            rows={12}
                            className="w-full bg-slate-800 border border-brand-border rounded-xl px-4 py-3 text-xs font-medium text-slate-300 focus:outline-none font-mono"
                            value={wizardBulkRoster}
                            onChange={(e) => setWizardBulkRoster(e.target.value)}
                          />
                        </div>
                        <button
                          onClick={() => addWizardTeam(wizardNewTeamName, wizardBulkRoster)}
                          className="w-full py-4 bg-brand-accent text-black hover:bg-emerald-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                          Добавить команду и состав
                        </button>

                        <button
                          onClick={() => {
                            if (!wizardNewTeamName.trim()) {
                              alert("Введите название команды в поле выше, чтобы найти её состав.");
                              return;
                            }
                            
                            const searchName = wizardNewTeamName.toLowerCase().trim();
                            const foundTeam = teams.find(t => 
                              t.name.toLowerCase().trim() === searchName
                            ) || teams.find(t => 
                              t.name.toLowerCase().includes(searchName)
                            );

                            if (foundTeam) {
                              const playerNames = foundTeam.players.map(p => p.name).join("\n");
                              setWizardBulkRoster(playerNames);
                              setWizardNewTeamName(foundTeam.name);
                              alert(`Состав команды "${foundTeam.name}" найден и вставлен в поле ввода.`);
                            } else {
                              alert(`Команда "${wizardNewTeamName}" не найдена в текущем сезоне.`);
                            }
                          }}
                          className="w-full py-4 bg-brand-accent/10 border border-brand-accent/20 text-brand-accent hover:bg-brand-accent/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                          <Users className="w-4 h-4" /> Скопировать состав по названию
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4" id="wizard-teams-list">
                      <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <ListOrdered className="w-5 h-5 text-emerald-400" /> Составы команд ({wizardTeams.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {wizardTeams.map((team, idx) => (
                          <div key={idx} className="bg-slate-900/50 border border-brand-border rounded-2xl p-4 space-y-4 flex flex-col">
                            <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-black text-brand-accent">#{idx + 1}</span>
                                <h4 className="text-sm font-black text-white uppercase truncate">{team.name}</h4>
                              </div>
                              <button
                                onClick={() => setWizardTeams(wizardTeams.filter((_, i) => i !== idx))}
                                className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="flex-1 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                              <table className="w-full text-[10px]">
                                <thead>
                                  <tr className="text-slate-500 font-bold uppercase border-b border-white/5">
                                    <th className="py-2 w-8 text-center">№</th>
                                    <th className="py-2 text-left">ФИО Игрока</th>
                                    <th className="py-2 w-8"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {team.players.length === 0 ? (
                                    <tr>
                                      <td colSpan={3} className="py-8 text-center text-slate-600 italic">Пусто. Введите игроков.</td>
                                    </tr>
                                  ) : (
                                    team.players.map((p, pIdx) => (
                                      <tr key={pIdx} className="border-b border-white/5 hover:bg-white/[0.02]">
                                        <td className="py-2 text-center text-slate-400">{p.number || "—"}</td>
                                        <td className="py-2 font-bold text-slate-300">{p.name}</td>
                                        <td className="py-2 text-right">
                                          <button 
                                            onClick={() => {
                                              const newTeams = [...wizardTeams];
                                              newTeams[idx].players = newTeams[idx].players.filter((_, i) => i !== pIdx);
                                              setWizardTeams(newTeams);
                                            }}
                                            className="text-slate-600 hover:text-red-400"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>

                            <div className="pt-3 border-t border-white/5 flex gap-2">
                              <input 
                                type="text" 
                                placeholder="ФИО и номер" 
                                className="flex-1 bg-slate-800 border border-brand-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const input = e.currentTarget;
                                    const val = input.value;
                                    if (!val.trim()) return;
                                    
                                    const parts = val.trim().split(/\s+/);
                                    let number: number | undefined = undefined;
                                    let nameParts = [...parts];
                                    const firstNum = parseInt(parts[0]);
                                    if (!isNaN(firstNum)) {
                                      number = firstNum;
                                      nameParts = parts.slice(1);
                                    }
                                    
                                    const newPlayer: Player = {
                                      id: Math.floor(Math.random() * 1000000),
                                      name: nameParts.join(" "),
                                      number: number,
                                      goals: 0,
                                      ownGoals: 0,
                                      yellow: 0,
                                      red: 0,
                                      banMatches: 0
                                    };
                                    
                                    const newTeams = [...wizardTeams];
                                    newTeams[idx].players = [...newTeams[idx].players, newPlayer];
                                    setWizardTeams(newTeams);
                                    input.value = "";
                                  }
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      {wizardTeams.length === 0 && (
                        <div className="bg-slate-900/50 p-20 rounded-2xl border border-brand-border border-dashed text-center opacity-30">
                          <Users className="w-12 h-12 mx-auto mb-4" />
                          <p className="text-xs font-black uppercase tracking-widest">Список команд пуст</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-brand-border">
                    <button
                      onClick={() => generateRoundRobin()}
                      disabled={wizardTeams.length < 2}
                      className="w-full py-5 bg-brand-accent hover:bg-emerald-600 disabled:opacity-30 disabled:pointer-events-none text-black rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]"
                    >
                      Сгенерировать календарь
                    </button>
                  </div>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-6 animate-in zoom-in-95 duration-300">
                <div className="bg-brand-card rounded-2xl border border-brand-border p-6 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-brand-accent" /> Ручная правка календаря
                    </h3>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setWizardStep(1)}
                        className="px-4 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-brand-border hover:bg-slate-700 transition-all"
                      >
                        Назад к командам
                      </button>
                      <button
                        onClick={() => {
                          generateRoundRobin(wizardTeams);
                        }}
                        className="px-4 py-2 bg-brand-accent/10 text-brand-accent rounded-xl text-[10px] font-black uppercase tracking-widest border border-brand-accent/20 hover:bg-brand-accent hover:text-white transition-all"
                      >
                        Перегенерировать
                      </button>
                    </div>
                  </div>

                  <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-slate-700 custom-scrollbar">
                    {Array.from({ length: wizardSchedule.length > 0 ? Math.max(...wizardSchedule.map(m => m.tour)) : 0 }, (_, i) => i + 1).map(tourNum => (
                      <div key={tourNum} className="space-y-4 bg-slate-900/30 p-5 rounded-3xl border border-brand-border/50">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[11px] font-black text-brand-accent uppercase tracking-[0.3em] bg-brand-accent/10 px-4 py-1.5 rounded-full border border-brand-accent/20">
                            ТУР {tourNum}
                          </span>
                          <div className="h-[1px] flex-grow bg-brand-border/30"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {wizardSchedule.filter(m => m.tour === tourNum).map((match, mIdx) => {
                            const teamA = wizardTeams.find(t => t.id === match.teamAId);
                            const teamB = wizardTeams.find(t => t.id === match.teamBId);
                            return (
                              <div key={match.id} className="relative bg-slate-900/50 p-4 rounded-2xl border border-brand-border border-l-4 border-l-brand-accent/30 space-y-3 group hover:border-brand-accent/50 transition-all">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1 text-center">
                                    <p className="text-[10px] font-black text-white uppercase truncate">{teamA?.name}</p>
                                  </div>
                                  <div className="flex flex-col items-center gap-1 px-2 border-x border-brand-border/20">
                                     <span className="text-[8px] font-black text-slate-700">VS</span>
                                  </div>
                                  <div className="flex-1 text-center">
                                    <p className="text-[10px] font-black text-white uppercase truncate">{teamB?.name}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <p className="text-[7px] font-black text-slate-600 uppercase tracking-tighter">Дата</p>
                                    <input
                                      type="text"
                                      placeholder="дд.мм"
                                      className="w-full bg-brand-bg/50 border border-brand-border/50 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white focus:outline-none focus:border-brand-accent"
                                      value={match.dateTime.split(' ')[0] || ''}
                                      onChange={(e) => {
                                        const time = match.dateTime.split(' ')[1] || '';
                                        const newSchedule = [...wizardSchedule];
                                        const idx = newSchedule.findIndex(ms => ms.id === match.id);
                                        newSchedule[idx].dateTime = `${e.target.value} ${time}`.trim();
                                        setWizardSchedule(newSchedule);
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[7px] font-black text-slate-600 uppercase tracking-tighter">Время</p>
                                    <input
                                      type="text"
                                      placeholder="00:00"
                                      className="w-full bg-brand-bg/50 border border-brand-border/50 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white focus:outline-none focus:border-brand-accent"
                                      value={match.dateTime.split(' ')[1] || ''}
                                      onChange={(e) => {
                                        const date = match.dateTime.split(' ')[0] || '';
                                        const newSchedule = [...wizardSchedule];
                                        const idx = newSchedule.findIndex(ms => ms.id === match.id);
                                        newSchedule[idx].dateTime = `${date} ${e.target.value}`.trim();
                                        setWizardSchedule(newSchedule);
                                      }}
                                    />
                                  </div>
                                </div>
                                
                                {/* Manual Match Editing Controls */}
                                <div className="pt-2 flex items-center justify-between border-t border-brand-border/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <div className="flex items-center gap-1">
                                      <select 
                                        className="bg-slate-800 text-[8px] font-black border border-brand-border rounded p-1 text-white focus:outline-none"
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          if (val) {
                                            const newSchedule = [...wizardSchedule];
                                            const idx = newSchedule.findIndex(ms => ms.id === match.id);
                                            newSchedule[idx].tour = val;
                                            setWizardSchedule(newSchedule);
                                          }
                                        }}
                                        value={match.tour}
                                      >
                                        {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                                          <option key={num} value={num}>{num} тур</option>
                                        ))}
                                      </select>
                                   </div>
                                   <button 
                                     onClick={() => {
                                       if (confirm("Удалить этот матч из расписания?")) {
                                         setWizardSchedule(prev => prev.filter(m => m.id !== match.id));
                                       }
                                     }}
                                     className="p-1.5 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500 hover:text-white transition-all"
                                   >
                                      <Trash2 className="w-3 h-3" />
                                   </button>
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* Add manual match to this tour */}
                          <div 
                             onClick={() => {
                               const firstTeam = wizardTeams[0];
                               const secondTeam = wizardTeams[1] || wizardTeams[0];
                               const newM: ScheduledMatch = {
                                 id: Date.now(),
                                 teamAId: firstTeam.id,
                                 teamBId: secondTeam.id,
                                 tour: tourNum,
                                 dateTime: "",
                                 league: 1
                               };
                               setWizardSchedule(prev => [...prev, newM]);
                             }}
                             className="flex flex-col items-center justify-center p-4 bg-slate-900/20 rounded-2xl border border-dashed border-brand-border/30 hover:bg-brand-accent/5 hover:border-brand-accent/50 transition-all cursor-pointer group"
                          >
                             <Plus className="w-5 h-5 text-slate-700 group-hover:text-brand-accent mb-1 transition-colors" />
                             <span className="text-[8px] font-black text-slate-700 group-hover:text-brand-accent uppercase tracking-widest">Добавить пару</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <button 
                      onClick={() => {
                         const maxTour = wizardSchedule.length > 0 ? Math.max(...wizardSchedule.map(m => m.tour)) : 0;
                         const firstTeam = wizardTeams[0];
                         const secondTeam = wizardTeams[1] || wizardTeams[0];
                         const newM: ScheduledMatch = {
                            id: Date.now(),
                            teamAId: firstTeam.id,
                            teamBId: secondTeam.id,
                            tour: maxTour + 1,
                            dateTime: "",
                            league: 1
                          };
                          setWizardSchedule(prev => [...prev, newM]);
                      }}
                      className="w-full py-4 bg-slate-900 border border-dashed border-brand-border rounded-2xl text-[9px] font-black uppercase text-slate-500 hover:text-brand-accent hover:border-brand-accent transition-all flex items-center justify-center gap-2"
                    >
                       <Plus className="w-4 h-4" /> Добавить еще один тур
                    </button>
                  </div>

                  <div className="pt-6 border-t border-brand-border">
                    <button
                      onClick={handleCreateLeague}
                      className="w-full py-5 bg-brand-accent hover:bg-emerald-600 text-black rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]"
                    >
                      Завершить и начать лигу
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* --- End Wizard --- */}

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${activeSeasonId !== "current" || wizardStep > 0 ? "hidden" : ""}`}>
              <section className="bg-brand-card shadow-2xl rounded-2xl overflow-hidden border border-brand-border">
                <div className="p-6 border-b border-brand-border bg-slate-800/50">
                  <h3 className="font-black text-xs text-brand-accent uppercase tracking-widest flex items-center gap-3">
                    <Plus className="w-5 h-5" /> {editingMatchId ? "Редактировать Матч" : "Результат Матча"}
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Команда А
                      </label>
                      <select
                        className="w-full bg-slate-800/50 border border-brand-border rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none"
                        value={matchForm.teamAId}
                        onChange={(e) =>
                          setMatchForm({
                            ...matchForm,
                            teamAId: e.target.value,
                          })
                        }
                      >
                        <option value="">Выбор...</option>
                        {currentTeams
                          .filter((t) => t.league === league)
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Команда Б
                      </label>
                      <select
                        className="w-full bg-slate-800/50 border border-brand-border rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none"
                        value={matchForm.teamBId}
                        onChange={(e) =>
                          setMatchForm({
                            ...matchForm,
                            teamBId: e.target.value,
                          })
                        }
                      >
                        <option value="">Выбор...</option>
                        {currentTeams
                          .filter((t) => t.league === league)
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 text-center">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Счет А
                      </label>
                      <input
                        type="number"
                        className="w-full bg-slate-800/50 border border-brand-border rounded-xl px-4 py-3 text-2xl font-black text-white text-center focus:outline-none"
                        value={matchForm.scoreA}
                        onChange={(e) =>
                          setMatchForm({ ...matchForm, scoreA: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2 text-center">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Счет Б
                      </label>
                      <input
                        type="number"
                        className="w-full bg-slate-800/50 border border-brand-border rounded-xl px-4 py-3 text-2xl font-black text-white text-center focus:outline-none"
                        value={matchForm.scoreB}
                        onChange={(e) =>
                          setMatchForm({ ...matchForm, scoreB: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Тур
                    </label>
                    <input
                      type="number"
                      className="w-full bg-slate-800/50 border border-brand-border rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none"
                      value={matchForm.tour}
                      onChange={(e) =>
                        setMatchForm({ ...matchForm, tour: e.target.value })
                      }
                    />
                  </div>

                  {/* Player Stats Inputs */}
                  {(matchForm.teamAId || matchForm.teamBId) && (
                    <div className="pt-6 border-t border-brand-border space-y-6">
                      <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-2 text-center">
                        Статистика Игроков
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Team A Section */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                              <Shield className="w-3.5 h-3.5 text-brand-accent" />
                              <span className="text-[10px] font-black text-white uppercase tracking-wider truncate max-w-[120px]">
                                {currentTeams.find((t) => t.id === Number(matchForm.teamAId))?.name || "Команда А"}
                              </span>
                            </div>
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Хозяева</span>
                          </div>
                          <div className="max-h-80 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-slate-700">
                            {(currentTeams.find((t) => t.id === Number(matchForm.teamAId))?.players || []).map((p) => (
                              <div
                                key={p.id}
                                className="grid grid-cols-12 gap-2 items-center bg-brand-bg/40 px-3 py-2 rounded-xl border border-brand-border/30 hover:border-brand-accent/20 transition-all"
                              >
                                <span className="col-span-5 text-[10px] font-bold text-slate-300 truncate">
                                  {p.name}
                                </span>
                                <div className="col-span-2 flex flex-col items-center">
                                  <p className="text-[7px] text-slate-600 font-bold uppercase">
                                    Г
                                  </p>
                                  <input
                                    type="number"
                                    min="0"
                                    className="w-full bg-transparent border-none p-0 text-[10px] font-black text-emerald-400 text-center focus:outline-none focus:ring-0"
                                    value={matchPlayerStats[p.id]?.goals || ""}
                                    onChange={(e) =>
                                      updateMatchPlayerStats(p.id, {
                                        goals: parseInt(e.target.value) || 0,
                                      })
                                    }
                                  />
                                </div>
                                <div className="col-span-2 flex flex-col items-center">
                                  <p className="text-[7px] text-slate-600 font-bold uppercase">
                                    аГ
                                  </p>
                                  <input
                                    type="number"
                                    min="0"
                                    className="w-full bg-transparent border-none p-0 text-[10px] font-black text-red-400 text-center focus:outline-none focus:ring-0"
                                    value={matchPlayerStats[p.id]?.ownGoals || ""}
                                    onChange={(e) =>
                                      updateMatchPlayerStats(p.id, {
                                        ownGoals: parseInt(e.target.value) || 0,
                                      })
                                    }
                                  />
                                </div>
                                <div className="col-span-3 flex flex-col items-center">
                                  <p className="text-[7px] text-slate-600 font-bold uppercase">
                                    Ж/К
                                  </p>
                                  <div className="flex gap-1.5">
                                    <input
                                      type="checkbox"
                                      className="w-3 h-3 accent-yellow-400"
                                      checked={!!matchPlayerStats[p.id]?.yellow}
                                      onChange={(e) =>
                                        updateMatchPlayerStats(p.id, {
                                          yellow: e.target.checked ? 1 : 0,
                                        })
                                      }
                                    />
                                    <input
                                      type="checkbox"
                                      className="w-3 h-3 accent-red-600"
                                      checked={!!matchPlayerStats[p.id]?.red}
                                      onChange={(e) =>
                                        updateMatchPlayerStats(p.id, {
                                          red: e.target.checked ? 1 : 0,
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Team B Section */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                              <Shield className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[10px] font-black text-white uppercase tracking-wider truncate max-w-[120px]">
                                {currentTeams.find((t) => t.id === Number(matchForm.teamBId))?.name || "Команда Б"}
                              </span>
                            </div>
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Гости</span>
                          </div>
                          <div className="max-h-80 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-slate-700">
                            {(currentTeams.find((t) => t.id === Number(matchForm.teamBId))?.players || []).map((p) => (
                              <div
                                key={p.id}
                                className="grid grid-cols-12 gap-2 items-center bg-brand-bg/40 px-3 py-2 rounded-xl border border-brand-border/30 hover:border-brand-accent/20 transition-all"
                              >
                                <span className="col-span-5 text-[10px] font-bold text-slate-300 truncate">
                                  {p.name}
                                </span>
                                <div className="col-span-2 flex flex-col items-center">
                                  <p className="text-[7px] text-slate-600 font-bold uppercase">
                                    Г
                                  </p>
                                  <input
                                    type="number"
                                    min="0"
                                    className="w-full bg-transparent border-none p-0 text-[10px] font-black text-emerald-400 text-center focus:outline-none focus:ring-0"
                                    value={matchPlayerStats[p.id]?.goals || ""}
                                    onChange={(e) =>
                                      updateMatchPlayerStats(p.id, {
                                        goals: parseInt(e.target.value) || 0,
                                      })
                                    }
                                  />
                                </div>
                                <div className="col-span-2 flex flex-col items-center">
                                  <p className="text-[7px] text-slate-600 font-bold uppercase">
                                    аГ
                                  </p>
                                  <input
                                    type="number"
                                    min="0"
                                    className="w-full bg-transparent border-none p-0 text-[10px] font-black text-red-400 text-center focus:outline-none focus:ring-0"
                                    value={matchPlayerStats[p.id]?.ownGoals || ""}
                                    onChange={(e) =>
                                      updateMatchPlayerStats(p.id, {
                                        ownGoals: parseInt(e.target.value) || 0,
                                      })
                                    }
                                  />
                                </div>
                                <div className="col-span-3 flex flex-col items-center">
                                  <p className="text-[7px] text-slate-600 font-bold uppercase">
                                    Ж/К
                                  </p>
                                  <div className="flex gap-1.5">
                                    <input
                                      type="checkbox"
                                      className="w-3 h-3 accent-yellow-400"
                                      checked={!!matchPlayerStats[p.id]?.yellow}
                                      onChange={(e) =>
                                        updateMatchPlayerStats(p.id, {
                                          yellow: e.target.checked ? 1 : 0,
                                        })
                                      }
                                    />
                                    <input
                                      type="checkbox"
                                      className="w-3 h-3 accent-red-600"
                                      checked={!!matchPlayerStats[p.id]?.red}
                                      onChange={(e) =>
                                        updateMatchPlayerStats(p.id, {
                                          red: e.target.checked ? 1 : 0,
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    className="w-full bg-brand-accent text-white font-black py-4 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all glow-accent uppercase tracking-widest text-xs mt-4 disabled:opacity-50 disabled:grayscale"
                    disabled={
                      !matchForm.teamAId ||
                      !matchForm.teamBId ||
                      !matchForm.tour
                    }
                    onClick={() => {
                      if (editingMatchId) {
                        updateMatch(
                          editingMatchId,
                          Number(matchForm.teamAId),
                          Number(matchForm.teamBId),
                          Number(matchForm.scoreA),
                          Number(matchForm.scoreB),
                          Number(matchForm.tour),
                          matchPlayerStats,
                        );
                        setEditingMatchId(null);
                        alert("Матч обновлен!");
                      } else {
                        recordMatch(
                          Number(matchForm.teamAId),
                          Number(matchForm.teamBId),
                          Number(matchForm.scoreA),
                          Number(matchForm.scoreB),
                          Number(matchForm.tour),
                          matchPlayerStats,
                          scheduledMatchId,
                        );
                        alert("Матч записан!");
                      }

                      setMatchForm({
                        teamAId: "",
                        teamBId: "",
                        scoreA: "",
                        scoreB: "",
                        tour: "",
                      });
                      setMatchPlayerStats({});
                      setScheduledMatchId(undefined);
                    }}
                  >
                    {editingMatchId ? "Обновить Результат" : "Сохранить Результат"}
                  </button>
                  {editingMatchId && (
                    <button
                      className="w-full bg-slate-800 text-slate-400 font-black py-3 rounded-2xl border border-brand-border hover:text-white transition-all uppercase tracking-widest text-xs mt-2"
                      onClick={() => {
                        setEditingMatchId(null);
                        setMatchForm({
                          teamAId: "",
                          teamBId: "",
                          scoreA: "",
                          scoreB: "",
                          tour: "",
                        });
                        setMatchPlayerStats({});
                      }}
                    >
                      Отменить редактирование
                    </button>
                  )}
                </div>
              </section>

              <section className="bg-brand-card shadow-2xl rounded-2xl overflow-hidden border border-brand-border">
                <div className="p-6 border-b border-brand-border bg-slate-800/50">
                  <h3 className="font-black text-xs text-brand-accent uppercase tracking-widest flex items-center gap-3">
                    <ListOrdered className="w-5 h-5" /> История матчей
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-slate-700">
                    {currentMatches
                      .filter((m) => m.league === league)
                      .sort((a, b) => b.id - a.id)
                      .map((m) => {
                        const tA = currentTeams.find((t) => t.id === m.teamAId);
                        const tB = currentTeams.find((t) => t.id === m.teamBId);
                        return (
                          <div
                            key={m.id}
                            className="bg-brand-bg p-3 rounded-xl border border-brand-border flex items-center justify-between group"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-black text-white truncate">
                                Тур {m.tour} • {tA?.name} {m.scoreA}:{m.scoreB}{" "}
                                {tB?.name}
                              </p>
                              <p className="text-[8px] text-slate-500 font-bold uppercase">
                                {m.date}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingMatchId(m.id);
                                  setMatchForm({
                                    teamAId: m.teamAId.toString(),
                                    teamBId: m.teamBId.toString(),
                                    scoreA: m.scoreA.toString(),
                                    scoreB: m.scoreB.toString(),
                                    tour: m.tour.toString(),
                                    date: m.date
                                  });
                                  setMatchPlayerStats(m.stats || {});
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="p-2 bg-brand-accent/10 text-brand-accent rounded-lg hover:bg-brand-accent hover:text-white transition-all shadow-sm"
                                title="Редактировать"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (window.confirm("Удалить этот матч? Статистика команд и игроков будет пересчитана автоматически.")) {
                                    deleteMatch(m.id);
                                  }
                                }}
                                className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                title="Удалить"
                              >
                                <Trash2 className="w-3 h-3 pointer-events-none" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    {currentMatches.filter((m) => m.league === league).length ===
                      0 && (
                      <p className="text-center text-[10px] text-slate-600 font-bold uppercase py-4">
                        Нет сыгранных матчей
                      </p>
                    )}
                  </div>
                </div>
              </section>

            <section className="bg-brand-card shadow-2xl rounded-2xl overflow-hidden border border-brand-border">
              <div className="p-6 border-b border-brand-border bg-slate-800/50 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-xs text-brand-accent uppercase tracking-widest flex items-center gap-3">
                    <Calendar className="w-5 h-5" /> Календарь И Расписание
                  </h3>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mt-1">
                    Планирование и управление очередными турами
                  </p>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Create Scheduled Match Form */}
                   <div className="bg-brand-bg/50 p-6 rounded-2xl border border-brand-border space-y-5">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-brand-border/30 pb-3 flex items-center gap-2">
                       <Plus className="w-3 h-3 text-brand-accent" /> Назначить новый матч
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Команда А (Хозяева)
                        </label>
                        <select
                          className="w-full bg-slate-800 border border-brand-border rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-brand-accent transition-colors shadow-inner"
                          value={scheduledMatchForm.teamAId}
                          onChange={(e) =>
                            setScheduledMatchForm({
                              ...scheduledMatchForm,
                              teamAId: e.target.value,
                            })
                          }
                        >
                          <option value="">Выберите команду...</option>
                          {currentTeams
                            .filter((t) => t.league === league)
                            .map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Команда Б (Гости)
                        </label>
                        <select
                          className="w-full bg-slate-800 border border-brand-border rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-brand-accent transition-colors shadow-inner"
                          value={scheduledMatchForm.teamBId}
                          onChange={(e) =>
                            setScheduledMatchForm({
                              ...scheduledMatchForm,
                              teamBId: e.target.value,
                            })
                          }
                        >
                          <option value="">Выберите команду...</option>
                          {currentTeams
                            .filter((t) => t.league === league)
                            .map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Номер тура
                        </label>
                        <input
                          type="number"
                          className="w-full bg-slate-800 border border-brand-border rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-brand-accent text-center shadow-inner"
                          value={scheduledMatchForm.tour}
                          onChange={(e) =>
                            setScheduledMatchForm({
                              ...scheduledMatchForm,
                              tour: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Дата и время
                        </label>
                        <input
                          className="w-full bg-slate-800 border border-brand-border rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-brand-accent text-center shadow-inner"
                          placeholder="Напр: 12.05 18:00"
                          value={scheduledMatchForm.dateTime}
                          onChange={(e) =>
                            setScheduledMatchForm({
                              ...scheduledMatchForm,
                              dateTime: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <button
                      className="w-full bg-slate-700 hover:bg-brand-accent text-white font-black py-4 rounded-xl shadow-xl transition-all uppercase tracking-widest text-[10px] mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
                      disabled={
                        !scheduledMatchForm.teamAId ||
                        !scheduledMatchForm.teamBId ||
                        !scheduledMatchForm.tour
                      }
                      onClick={() => {
                        setScheduledMatches((prev) => [
                          ...prev,
                          {
                            id: Date.now(),
                            ...scheduledMatchForm,
                            teamAId: Number(scheduledMatchForm.teamAId),
                            teamBId: Number(scheduledMatchForm.teamBId),
                            tour: Number(scheduledMatchForm.tour),
                            league,
                          },
                        ]);
                        setScheduledMatchForm({
                          teamAId: "",
                          teamBId: "",
                          tour: "",
                          dateTime: "",
                        });
                        alert("Матч добавлен в расписание!");
                      }}
                    >
                      <Plus className="w-4 h-4" /> Добавить в календарь
                    </button>
                   </div>

                  {/* Scheduled Matches Table */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-brand-accent uppercase tracking-widest ml-1 flex items-center justify-between">
                       Предстоящие Матчи
                       <span className="text-slate-600 text-[8px] font-bold">
                          {currentScheduledMatches.filter((sm) => sm.league === league).length} матчей впереди
                       </span>
                    </h4>
                    <div className="overflow-hidden rounded-2xl border border-brand-border bg-slate-900/50 shadow-inner max-h-[400px] overflow-y-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-800/40 border-b border-brand-border text-[8px] font-black text-slate-500 uppercase tracking-widest sticky top-0 z-10">
                            <th className="px-4 py-3 w-16 text-center">Тур</th>
                            <th className="px-4 py-3">Соперники</th>
                            <th className="px-4 py-3 w-32 text-center text-[7px]">Дата/Время</th>
                            <th className="px-4 py-3 w-24"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentScheduledMatches
                            .filter((sm) => sm.league === league)
                            .sort((a,b) => a.tour - b.tour)
                            .map((sm) => (
                              <tr key={sm.id} className="border-b border-brand-border/10 hover:bg-white/[0.01] transition-colors group">
                                <td className="px-4 py-3 text-center">
                                   <span className="text-xs font-black text-slate-500">{sm.tour}</span>
                                </td>
                                <td className="px-4 py-3">
                                   <div className="flex items-center gap-3">
                                      <span className="text-[11px] font-black text-white truncate max-w-[100px]">
                                        {currentTeams.find((t) => t.id === sm.teamAId)?.name}
                                      </span>
                                      <span className="text-[8px] font-black text-slate-700 uppercase">vs</span>
                                      <span className="text-[11px] font-black text-white truncate max-w-[100px]">
                                        {currentTeams.find((t) => t.id === sm.teamBId)?.name}
                                      </span>
                                   </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                   <span className="text-[9px] font-bold text-brand-accent/70 uppercase whitespace-nowrap">{sm.dateTime || "Не задано"}</span>
                                </td>
                                <td className="px-4 py-3 pr-6 text-right">
                                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => {
                                        setMatchForm({
                                          teamAId: sm.teamAId.toString(),
                                          teamBId: sm.teamBId.toString(),
                                          scoreA: "",
                                          scoreB: "",
                                          tour: sm.tour.toString(),
                                        });
                                        setScheduledMatchId(sm.id);
                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                        alert("Данные перенесены в форму результата выше.");
                                      }}
                                      className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                      title="Внести результат"
                                    >
                                      <RefreshCw className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (window.confirm("Отменить этот матч?")) {
                                          setScheduledMatches((prev) => prev.filter((m) => m.id !== sm.id));
                                        }
                                      }}
                                      className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                      title="Удалить"
                                    >
                                      <Trash2 className="w-3 h-3 pointer-events-none" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          {currentScheduledMatches.filter((sm) => sm.league === league).length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-12 text-center">
                                <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Нет предстоящих игр</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            </div>

            <section className="bg-brand-card shadow-2xl rounded-2xl overflow-hidden border border-brand-border">
              <div className="p-6 border-b border-brand-border bg-slate-800/50">
                <h3 className="font-black text-xs text-brand-accent uppercase tracking-widest flex items-center gap-3">
                  <Settings className="w-5 h-5" /> Общие Настройки
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Название текущего сезона
                    </label>
                    <input
                      className="w-full bg-slate-800/50 border border-brand-border rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-brand-accent transition-colors"
                      value={season}
                      onChange={(e) => {
                        setSeason(e.target.value);
                        localStorage.setItem("KFL_V1_SEASON", e.target.value);
                      }}
                      placeholder="Напр: Сезон 1"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                        Название новой команды
                      </label>
                      <input
                        className="w-full bg-slate-800/50 border border-brand-border rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-brand-accent transition-colors"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        placeholder="Напр: ФК Победитель"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("ВНИМАНИЕ! Это действие полностью ОЧИСТИТ все таблицы, всю историю и сбросит текущий сезон на №1. Составы команд сохранятся, но их статистика обнулится. Продолжить?")) {
                            // 1. Reset Season Name
                            setSeason("Сезон 1");
                            localStorage.setItem("KFL_V1_SEASON", "Сезон 1");
                            
                            // 2. Clear History and Matches
                            setSeasonHistory([]);
                            setMatches([]);
                            setScheduledMatches([]);
                            
                            // 3. Reset all Team and Player statistics to ZERO
                            setTeams(prevTeams => prevTeams.map(t => ({
                              ...t,
                              matches: 0,
                              win: 0,
                              draw: 0,
                              loss: 0,
                              gf: 0,
                              ga: 0,
                              players: (t.players || []).map(p => ({
                                ...p,
                                goals: 0,
                                ownGoals: 0,
                                yellow: 0,
                                red: 0,
                                banMatches: 0,
                                permanentBan: false
                              }))
                            })));
                            
                            // 4. Reset View State
                            setActiveSeasonId("current");
                            setActiveTab("table");
                            setLeague(1);
                            setAvailableLeagues([
                              { id: 1, name: "1 Лига" },
                              { id: 2, name: "2 Лига" }
                            ]);
                            localStorage.removeItem("KFL_V1_AVAILABLE_LEAGUES_OBJECTS");
                            setCurrentResult(null);
                            setShowCelebration(false);
                            
                            alert("Полный сброс завершен успешно! Сезон: 1. База команд сохранена.");
                          }
                        }}
                        className="bg-red-500/10 border border-red-500/20 text-red-500 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-3 h-3" /> Полный сброс (Сезон 1)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Вы уверены, что хотите удалить ВСЮ историю прошлых сезонов? Текущие команды и составы останутся. Это действие нельзя отменить.")) {
                            setSeasonHistory([]);
                            localStorage.setItem("KFL_V1_SEASON_HISTORY", JSON.stringify([]));
                            alert("История сезонов очищена. Команды сохранены.");
                          }
                        }}
                        className="bg-slate-800 border border-brand-border text-slate-500 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-red-400 transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-3 h-3" /> Очистить историю
                      </button>

                      <button
                        type="button"
                        onClick={finishSeason}
                        className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2"
                      >
                        <Trophy className="w-3 h-3" /> Завершить и архивировать
                      </button>

                      <button
                        type="button"
                        onClick={addTeam}
                        className="bg-brand-accent border border-brand-accent text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-accent/90 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.3)] md:col-span-2 lg:col-span-1"
                      >
                        <Plus className="w-3 h-3" /> Добавить команду
                      </button>
                    </div>
                  </div>

                  {/* League Management */}
                  <div className="bg-brand-card rounded-2xl border border-brand-border overflow-hidden p-6 space-y-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <Settings className="w-5 h-5 text-brand-accent" /> Управление лигами
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {availableLeagues.map(l => (
                        <div key={l.id} className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-xl border border-white/5 group">
                          <span className="text-xs font-black text-white uppercase tracking-widest">{l.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newName = window.prompt("Введите новое название лиги:", l.name);
                              if (newName && newName.trim() !== "" && newName !== l.name) {
                                setAvailableLeagues(prev => prev.map(x => x.id === l.id ? { ...x, name: newName.trim() } : x));
                              }
                            }}
                            className="p-1 text-slate-500 hover:text-brand-accent hover:bg-brand-accent/10 rounded transition-all cursor-pointer"
                            title="Переименовать"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (availableLeagues.length <= 1) {
                                alert("Нельзя удалить последнюю лигу.");
                                return;
                              }
                              
                              if (window.confirm(`Вы действительно хотите УДАЛИТЬ лигу "${l.name}"?\n\nВНИМАНИЕ:\n1. Упоминание о лиге будет удалено из всех меню.\n2. Все результаты и матчи этой лиги будут удалены.\n3. Команды ЭТОЙ лиги будут также удалены из базы.`)) {
                                const idToDel = Number(l.id);
                                
                                // Шаг 1: Удаляем матчи и расписание
                                setMatches(prev => prev.filter(m => Number(m.league) !== idToDel));
                                setScheduledMatches(prev => prev.filter(s => Number(s.league) !== idToDel));

                                // Шаг 2: Удаляем саму лигу и переключаем фокус
                                setAvailableLeagues(prevLeagues => {
                                  const nextLeagues = prevLeagues.filter(x => Number(x.id) !== idToDel);
                                  
                                  if (Number(league) === idToDel && nextLeagues.length > 0) {
                                    setLeague(nextLeagues[0].id);
                                  }
                                  
                                  return nextLeagues;
                                });

                                // Шаг 3: Удаляем команды, привязанные к этой лиге
                                setTeams(prevTeams => prevTeams.filter(t => Number(t.league) !== idToDel));
                                
                                alert(`Лига "${l.name}" и все связанные данные успешно удалены.`);
                              }
                            }}
                            className="p-1 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                            title="Удалить лигу"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const leagueName = window.prompt("Введите название для новой лиги:");
                          if (leagueName && leagueName.trim() !== "") {
                            const nextId = Math.max(...availableLeagues.map(l => l.id), 0) + 1;
                            setAvailableLeagues(prev => [...prev, { id: nextId, name: leagueName.trim() }]);
                          }
                        }}
                        className="flex items-center gap-2 bg-brand-accent/10 border border-brand-accent/20 text-brand-accent px-4 py-2 rounded-xl hover:bg-brand-accent/20 transition-all text-xs font-black uppercase tracking-widest"
                      >
                        <Plus className="w-4 h-4" /> Добавить лигу
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-brand-card shadow-2xl rounded-2xl overflow-hidden border border-brand-border h-full">
              <div className="p-6 border-b border-brand-border bg-slate-800/50 flex items-center justify-between">
                <h3 className="font-black text-xs text-brand-accent uppercase tracking-widest flex items-center gap-3">
                  <Users className="w-5 h-5" /> Управление Командами ({currentLeagueName})
                </h3>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-full border border-brand-border">
                      {teams.filter(t => t.league === league).length} Команд
                   </span>
                </div>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-900/50 border-b border-brand-border text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      <th className="px-6 py-4 w-20 text-center">Лого</th>
                      <th className="px-6 py-4">Название команды</th>
                      <th className="px-6 py-4 w-32 text-center">Цвет</th>
                      <th className="px-6 py-4 w-32 text-center">Состав</th>
                      <th className="px-6 py-4 w-32 text-center">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.filter(t => t.league === league).map((team) => (
                      <Fragment key={team.id}>
                        <tr className="border-b border-brand-border/30 hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-4">
                            <div className="w-12 h-12 mx-auto rounded-xl bg-slate-800 border border-brand-border overflow-hidden flex items-center justify-center relative group/logo">
                              {team.logo.startsWith("data:") || team.logo.startsWith("http") ? (
                                <img src={team.logo} alt="" className="w-full h-full object-contain" />
                              ) : (
                                <span className="text-xl">{team.logo}</span>
                              )}
                              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                <Plus className="w-4 h-4 text-white" />
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setTeams(prev => prev.map(t => t.id === team.id ? { ...t, logo: reader.result as string } : t));
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }} />
                              </label>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <input
                                className="flex-1 bg-transparent border-b border-white/10 focus:border-brand-accent/50 py-1 text-sm font-black text-white focus:outline-none transition-all"
                                value={team.name}
                                onChange={(e) => setTeams(prev => prev.map(t => t.id === team.id ? { ...t, name: e.target.value } : t))}
                              />
                              <button 
                                onClick={() => {
                                  localStorage.setItem("KFL_V1_TEAMS", JSON.stringify(teams));
                                  alert("Все изменения команды успешно сохранены в БД");
                                }}
                                className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded transition-all"
                                title="Принудительно сохранить"
                              >
                                <Shield className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                               <input
                                  type="color"
                                  className="w-8 h-8 rounded-lg bg-slate-800 border border-brand-border p-0.5 cursor-pointer shrink-0"
                                  value={team.color}
                                  onChange={(e) => setTeams(prev => prev.map(t => t.id === team.id ? { ...t, color: e.target.value } : t))}
                                />
                                <span className="text-[10px] font-mono text-slate-500 uppercase">{team.color}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => setSelectedTeamId(selectedTeamId === team.id ? null : team.id)}
                              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${selectedTeamId === team.id ? "bg-brand-accent text-white" : "bg-slate-800 text-slate-400 hover:text-white border border-brand-border"}`}
                            >
                              {team.players.length} Игроков
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                               <button
                                 onClick={() => {
                                   if (window.confirm("Удалить эту команду?")) removeTeam(team.id);
                                 }}
                                 className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                            </div>
                          </td>
                        </tr>
                        {selectedTeamId === team.id && (
                          <tr className="bg-slate-900/30">
                            <td colSpan={5} className="px-6 py-6 border-b border-brand-border/30">
                              <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center justify-between pb-4 border-b border-brand-border/30">
                                  <h4 className="text-[10px] font-black text-brand-accent uppercase tracking-widest">Управление составом</h4>
                                  <button
                                    onClick={() => {
                                      const pName = prompt("ФИО Игрока:");
                                      if (pName) {
                                        const pNum = parseInt(prompt("Номер (необязательно):") || "0");
                                        const newP = { id: Date.now(), name: pName, number: pNum || undefined, goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 };
                                        setTeams(prev => prev.map(t => t.id === team.id ? { ...t, players: [...t.players, newP] } : t));
                                      }
                                    }}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest border border-brand-border flex items-center gap-2"
                                  >
                                    <Plus className="w-3.5 h-3.5" /> Добавить игрока
                                  </button>
                                </div>
                                <div className="overflow-x-auto rounded-xl border border-brand-border bg-slate-900/50">
                                  <table className="w-full text-left border-collapse">
                                    <thead>
                                      <tr className="border-b border-brand-border/30 text-[8px] font-black text-slate-600 uppercase tracking-widest bg-slate-800/40">
                                        <th className="px-4 py-2 w-16 text-center">№</th>
                                        <th className="px-4 py-2">ФИО Игрока</th>
                                        <th className="px-4 py-2 w-20 text-center">Голы</th>
                                        <th className="px-4 py-2 w-16 text-center">Ж/К</th>
                                        <th className="px-4 py-2 w-16 text-center">К/К</th>
                                        <th className="px-4 py-2 w-16 text-center">Бан</th>
                                        <th className="px-4 py-2 w-12 mr-4"></th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {team.players.map((player) => (
                                        <tr key={player.id} className="border-b border-brand-border/10 hover:bg-white/[0.01] transition-colors group/row">
                                          <td className="px-4 py-1.5">
                                            <input
                                              type="number"
                                              className="w-full bg-transparent text-center text-xs font-black text-white focus:outline-none"
                                              value={player.number || ""}
                                              placeholder="—"
                                              onChange={(e) => updatePlayerStats(team.id, player.id, { number: parseInt(e.target.value) || 0 })}
                                            />
                                          </td>
                                          <td className="px-4 py-1.5">
                                            <input
                                              className="w-full bg-transparent text-xs font-bold text-slate-300 focus:outline-none focus:text-white"
                                              value={player.name}
                                              onChange={(e) => updatePlayerStats(team.id, player.id, { name: e.target.value })}
                                            />
                                          </td>
                                          <td className="px-4 py-1.5">
                                            <input
                                              type="number"
                                              className="w-full bg-transparent text-center text-xs font-black text-emerald-400 focus:outline-none"
                                              value={player.goals || ""}
                                              onChange={(e) => {
                                                const val = parseInt(e.target.value) || 0;
                                                updatePlayerStats(team.id, player.id, { goals: val });
                                              }}
                                            />
                                          </td>
                                          <td className="px-4 py-1.5">
                                            <input
                                              type="number"
                                              className="w-full bg-transparent text-center text-xs font-black text-yellow-400 focus:outline-none"
                                              value={player.yellow || ""}
                                              onChange={(e) => updatePlayerStats(team.id, player.id, { yellow: parseInt(e.target.value) || 0 })}
                                            />
                                          </td>
                                          <td className="px-4 py-1.5">
                                            <input
                                              type="number"
                                              className="w-full bg-transparent text-center text-xs font-black text-red-500 focus:outline-none"
                                              value={player.red || ""}
                                              onChange={(e) => updatePlayerStats(team.id, player.id, { red: parseInt(e.target.value) || 0 })}
                                            />
                                          </td>
                                          <td className="px-4 py-1.5">
                                             <input
                                              type="number"
                                              className="w-full bg-transparent text-center text-xs font-black text-slate-500 focus:outline-none"
                                              value={player.banMatches || ""}
                                              onChange={(e) => updatePlayerStats(team.id, player.id, { banMatches: parseInt(e.target.value) || 0 })}
                                            />
                                          </td>
                                          <td className="px-4 py-1.5 pr-6 text-right">
                                            <button
                                              onClick={() => {
                                                if (confirm(`Удалить игрока ${player.name}?`)) {
                                                  setTeams(prev => prev.map(t => t.id === team.id ? { ...t, players: t.players.filter(p => p.id !== player.id) } : t));
                                                }
                                              }}
                                              className="p-1.5 text-slate-700 hover:text-red-500 rounded transition-all opacity-0 group-row:opacity-100"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-brand-card shadow-2xl rounded-2xl overflow-hidden border border-brand-border">
              <div className="p-6 border-b border-brand-border bg-slate-800/50 flex justify-between items-center">
                <h3 className="font-black text-xs text-brand-accent uppercase tracking-widest flex items-center gap-3">
                  <LayoutDashboard className="w-5 h-5" /> Управление Архивом Сезонов
                </h3>
              </div>
              <div className="p-6">
                {seasonHistory.length === 0 ? (
                  <p className="text-center text-[10px] text-slate-600 font-black uppercase py-4">Архив пуст</p>
                ) : (
                  <div className="space-y-3">
                    {seasonHistory.map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-4 bg-brand-bg rounded-2xl border border-brand-border group hover:border-brand-accent/30 transition-all">
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-[11px] font-black text-white uppercase tracking-wider truncate">
                            {s.seasonName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[8px] text-slate-500 font-bold uppercase">
                              {s.date}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-slate-700" />
                            <span className="text-[8px] text-brand-accent font-black uppercase">
                              {s.winner?.name || "Нет победителя"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                           <button
                            onClick={() => {
                              setActiveSeasonId(s.id);
                              setCurrentResult(s);
                              setShowCelebration(true);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="h-8 px-4 bg-brand-accent/10 text-brand-accent rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-brand-accent hover:text-white transition-all border border-brand-accent/20"
                          >
                            Обзор
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Удалить ${s.seasonName} из архива?`)) {
                                setSeasonHistory(prev => prev.filter(item => item.id !== s.id));
                                if (activeSeasonId === s.id) setActiveSeasonId("current");
                              }
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <button
              onClick={() => {
                setIsAdmin(false);
                localStorage.removeItem("KFL_V1_IS_ADMIN");
                setActiveTab("table");
              }}
              className="w-full mt-8 bg-red-500/10 border border-red-500/20 text-red-500 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-red-500/20 transition-all shadow-xl"
            >
              Выйти из режима администратора
            </button>
          </div>
        )}
      </main>

      {/* Modern Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/5 px-4 h-18 flex items-center justify-around md:justify-center md:gap-12">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center transition-all duration-300 ${
                isActive
                  ? "text-brand-accent scale-110"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon
                className={`w-6 h-6 mb-1 ${isActive ? "drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" : ""}`}
              />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {tab.name}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-brand-accent rounded-full glow-accent" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Player Detail Modal */}
      {selectedPlayerId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-bg/90 backdrop-blur-md animate-in fade-in duration-300">
          <div
            className="absolute inset-0"
            onClick={() => setSelectedPlayerId(null)}
          />
          <div className="bg-brand-card w-full max-w-lg rounded-3xl border border-brand-border shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            {/* Close button */}
            <button
              onClick={() => setSelectedPlayerId(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-slate-900/50 flex items-center justify-center text-white hover:bg-slate-900 transition-colors border border-white/5"
            >
              ×
            </button>

            <div className="overflow-y-auto overflow-x-hidden p-6 space-y-8 scrollbar-thin scrollbar-slate-700">
              {(() => {
                const team = currentTeams.find((t) =>
                  t.players.some((p) => p.id === selectedPlayerId),
                );
                const player = team?.players.find(
                  (p) => p.id === selectedPlayerId,
                );
                if (!player) return null;

                return (
                  <>
                    {/* Enlarged Photo */}
                    <div className="relative group">
                      <div className="aspect-square w-full max-w-[280px] mx-auto rounded-full bg-brand-bg border-4 border-brand-accent/20 overflow-hidden shadow-2xl relative transition-transform duration-500 group-hover:scale-105">
                        {player.photo ? (
                          <img
                            src={player.photo}
                            alt={player.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800/50">
                            <User className="w-24 h-24 text-slate-700" />
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-2">
                              Нет фото
                            </p>
                          </div>
                        )}
                      </div>
                      {/* Aura effect */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full bg-brand-accent/10 blur-3xl -z-10" />
                    </div>

                    <div className="text-center space-y-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em]">
                          Профиль Игрока
                        </p>
                        <h2 className="text-2xl font-black text-white uppercase tracking-wider">
                          {player.name}
                        </h2>
                        <div className="flex items-center justify-center gap-2 mt-1">
                          <div className="w-6 h-6 rounded bg-brand-bg border border-brand-border flex items-center justify-center p-1">
                            {team?.logo.startsWith("data:") ||
                            team?.logo.startsWith("http") ? (
                              <img
                                src={team?.logo}
                                alt=""
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <span className="text-[8px]">{team?.logo}</span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {team?.name}
                          </span>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-4 mt-8">
                        <div className="bg-slate-800/40 p-4 rounded-3xl border border-white/5 group hover:border-emerald-500/20 transition-colors">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-emerald-500/60">
                            Забито мячей
                          </p>
                          <p className="text-3xl font-black text-emerald-400 tabular-nums">
                            🏆 {player.goals || 0}
                          </p>
                        </div>
                        <div className="bg-slate-800/40 p-4 rounded-3xl border border-white/5 group hover:border-yellow-500/20 transition-colors">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-yellow-500/60">
                            Желтые карточки
                          </p>
                          <p className="text-3xl font-black text-yellow-400 tabular-nums">
                            🟨 {player.yellow || 0}
                          </p>
                        </div>
                        <div className="bg-slate-800/40 p-4 rounded-3xl border border-white/5 group hover:border-red-500/20 transition-colors">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-red-500/60">
                            Красные карточки
                          </p>
                          <p className="text-3xl font-black text-red-500 tabular-nums">
                            🟥 {player.red || 0}
                          </p>
                        </div>
                        <div
                          className={`bg-slate-800/40 p-4 rounded-3xl border border-white/5 group transition-colors ${player.permanentBan ? "border-red-600/60 bg-red-600/10" : player.banMatches ? "border-red-500/40 bg-red-500/5" : "hover:border-slate-500/20"}`}
                        >
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                            Статус бана
                          </p>
                          <p
                            className={`text-3xl font-black tabular-nums flex items-center justify-center gap-2 ${player.permanentBan ? "text-red-600" : player.banMatches ? "text-red-500 animate-pulse" : "text-slate-700"}`}
                          >
                            {player.permanentBan ? (
                              <>
                                🚫{" "}
                                <span className="text-xl uppercase">PERM</span>
                              </>
                            ) : (
                              <>🛡️ {player.banMatches || 0}</>
                            )}
                          </p>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="grid grid-cols-2 gap-4 pt-4">
                          <button
                            onClick={() => {
                              setTeams((prev) =>
                                prev.map((t) =>
                                  t.id === team.id
                                    ? {
                                        ...t,
                                        players: t.players.map((p) =>
                                          p.id === player.id
                                            ? {
                                                ...p,
                                                permanentBan: !p.permanentBan,
                                              }
                                            : p,
                                        ),
                                      }
                                    : t,
                                ),
                              );
                            }}
                            className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${player.permanentBan ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20" : "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"}`}
                          >
                            {player.permanentBan
                              ? "Снять вечный бан"
                              : "Дать вечный бан"}
                          </button>
                          <button
                            onClick={() => {
                              removePlayer(team.id, player.id);
                              setSelectedPlayerId(null);
                            }}
                            className="py-3 rounded-xl font-black text-[10px] uppercase tracking-widest bg-slate-800 border border-brand-border text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                          >
                            Удалить игрока
                          </button>
                        </div>
                      )}

                      <div className="pt-6">
                        <button
                          onClick={() => setSelectedPlayerId(null)}
                          className="w-full py-4 rounded-2xl bg-brand-accent text-white font-black uppercase tracking-widest text-xs glow-accent hover:scale-[1.02] transition-transform"
                        >
                          Закрыть
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Season Completion Celebration Overlay */}
      {showCelebration && currentResult && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-brand-bg/95 backdrop-blur-xl animate-in fade-in duration-700">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce opacity-20"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  fontSize: `${Math.random() * 20 + 10}px`,
                }}
              >
                🎊
              </div>
            ))}
          </div>

          <div className="bg-brand-card w-full max-w-2xl rounded-[40px] border border-brand-accent/30 shadow-[0_0_50px_rgba(139,92,246,0.2)] overflow-hidden relative animate-in zoom-in-95 duration-500 flex flex-col items-center p-6 md:p-12 text-center">
            <div className="absolute top-6 right-6 z-10">
              <button
                onClick={() => {
                  setShowCelebration(false);
                  setActiveTab("table");
                  setActiveSeasonId("current");
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/10 active:scale-95"
              >
                <ChevronLeft className="w-3 h-3 text-brand-accent" />
                НАЗАД В МЕНЮ
              </button>
            </div>

            <Trophy className="w-16 h-16 md:w-20 md:h-20 text-brand-accent mb-6 animate-pulse drop-shadow-[0_0_20px_rgba(139,92,246,0.5)]" />
            
            <h2 className="text-[10px] md:text-[12px] font-black text-brand-accent uppercase tracking-[0.4em] mb-2 px-4 leading-relaxed">
              {currentResult.seasonName}
            </h2>
            <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-8 md:mb-12">
              Итоги Турнира
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full mb-8 md:mb-10">
              {/* Champion Card */}
              <div className="relative group h-full">
                <div className="absolute inset-0 bg-brand-accent/20 blur-3xl rounded-full scale-110 opacity-50 transition-opacity group-hover:opacity-100" />
                <div className="relative h-full bg-white/5 backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-[32px] flex flex-col items-center">
                  <div className="bg-brand-accent/20 px-3 py-1 rounded-full mb-4 md:mb-6">
                    <p className="text-[8px] md:text-[9px] font-black text-brand-accent uppercase tracking-[0.2em]">
                      🏆 Чемпион Лиги
                    </p>
                  </div>
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-slate-900/50 border border-white/5 flex items-center justify-center p-4 md:p-6 mb-4 md:mb-6 shadow-2xl">
                    {currentResult.winner.logo.startsWith("data:") ||
                    currentResult.winner.logo.startsWith("http") ? (
                      <img
                        src={currentResult.winner.logo}
                        alt=""
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-5xl md:text-6xl">{currentResult.winner.logo}</span>
                    )}
                  </div>
                  <h4 className="text-lg md:text-xl font-black text-white uppercase tracking-tight text-center leading-tight">
                    {currentResult.winner.name}
                  </h4>
                  <div className="mt-auto pt-4 flex flex-col items-center w-full">
                    <p className="text-[10px] md:text-xs font-black text-brand-accent uppercase tracking-widest bg-brand-accent/10 px-3 py-1 rounded-lg">
                      {currentResult.winner.win * 3 + currentResult.winner.draw} ОЧКОВ
                    </p>
                    <div className="flex gap-1 mt-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-1 h-1 rounded-full bg-brand-accent/30" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Scorer Card */}
              {currentResult.topScorer && (
                <div className="relative group h-full">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-110 opacity-50 transition-opacity group-hover:opacity-100" />
                  <div className="relative h-full bg-white/5 backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-[32px] flex flex-col items-center">
                    <div className="bg-emerald-500/20 px-3 py-1 rounded-full mb-4 md:mb-6">
                      <p className="text-[8px] md:text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">
                        ⚽ Золотая Бутса
                      </p>
                    </div>
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-emerald-500/20 shadow-2xl mb-4 md:mb-6 relative bg-slate-900/50">
                      {currentResult.topScorer.photo ? (
                        <img
                          src={currentResult.topScorer.photo}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                          <User className="w-10 h-10 md:w-12 md:h-12 text-slate-700" />
                        </div>
                      )}
                    </div>
                    <h4 className="text-lg md:text-xl font-black text-white uppercase tracking-tight text-center leading-tight">
                      {currentResult.topScorer.name}
                    </h4>
                    <div className="mt-auto pt-4 flex flex-col items-center w-full">
                      <p className="text-[10px] md:text-xs font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-lg">
                        {currentResult.topScorer.goals} ГОЛОВ
                      </p>
                      <p className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2 truncate w-full text-center">
                        {currentResult.topScorer.teamName}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* FULL SEASON SUMMARY (TABLE & MATCHES) */}
            <div className="w-full space-y-12 mt-4 pt-10 border-t border-white/5 overflow-y-auto max-h-[50vh] scrollbar-thin scrollbar-slate-700 pr-4">
               {/* Final Standings */}
               <div className="space-y-6">
                 <div className="flex items-center gap-4 justify-center">
                    <div className="h-px bg-white/5 flex-1" />
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Итоговое Положение</h4>
                    <div className="h-px bg-white/5 flex-1" />
                 </div>
                 <div className="grid gap-2">
                    {currentResult.teams
                      .sort((a: any, b: any) => {
                         const pA = a.win * 3 + a.draw;
                         const pB = b.win * 3 + b.draw;
                         if (pB !== pA) return pB - pA;
                         return (b.gf - b.ga) - (a.gf - a.ga);
                      })
                      .map((t: any, index: number) => (
                        <div key={t.id} className="flex items-center gap-3 bg-white/5 border border-white/5 p-3 rounded-2xl">
                           <span className={`w-6 text-[10px] font-black ${index === 0 ? 'text-brand-accent' : 'text-slate-500'}`}>{index + 1}</span>
                           <div className="w-6 h-6 rounded bg-slate-900 overflow-hidden flex items-center justify-center p-1">
                              {t.logo.startsWith('data:') || t.logo.startsWith('http') ? <img src={t.logo} className="w-full h-full object-contain" /> : <span className="text-[8px]">{t.logo}</span>}
                           </div>
                           <span className="flex-1 text-[11px] font-bold text-white uppercase truncate">{t.name}</span>
                           <span className="text-[11px] font-black text-brand-accent">{t.win * 3 + t.draw} Очков</span>
                        </div>
                      ))
                    }
                 </div>
               </div>

               {/* All Matches */}
               <div className="space-y-6 pb-8">
                 <div className="flex items-center gap-4 justify-center">
                    <div className="h-px bg-white/5 flex-1" />
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Хроника Матчей</h4>
                    <div className="h-px bg-white/5 flex-1" />
                 </div>
                 <div className="space-y-3">
                   {currentResult.matches
                     .sort((a: any, b: any) => Number(b.tour) - Number(a.tour) || b.id - a.id)
                     .map((m: any) => {
                       const tA = currentResult.teams.find((t: any) => t.id === m.teamAId);
                       const tB = currentResult.teams.find((t: any) => t.id === m.teamBId);
                       return (
                         <div key={m.id} className="bg-slate-900/40 border border-white/5 p-3 rounded-2xl flex items-center justify-between">
                            <div className="flex-1 flex items-center justify-end gap-2 text-right">
                               <span className="text-[9px] font-bold text-white uppercase truncate max-w-[80px]">{tA?.name}</span>
                               <div className="w-5 h-5 rounded bg-brand-bg flex items-center justify-center p-1 grayscale group-hover:grayscale-0">
                                  {tA?.logo.startsWith('data:') || tA?.logo.startsWith('http') ? <img src={tA.logo} className="w-full h-full object-contain" /> : <span className="text-[7px]">{tA?.logo}</span>}
                               </div>
                            </div>
                            <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-[11px] font-black text-brand-accent mx-4 min-w-[50px] text-center">
                               {m.scoreA} : {m.scoreB}
                            </div>
                            <div className="flex-1 flex items-center justify-start gap-2">
                               <div className="w-5 h-5 rounded bg-brand-bg flex items-center justify-center p-1 grayscale group-hover:grayscale-0">
                                  {tB?.logo.startsWith('data:') || tB?.logo.startsWith('http') ? <img src={tB.logo} className="w-full h-full object-contain" /> : <span className="text-[7px]">{tB?.logo}</span>}
                               </div>
                               <span className="text-[9px] font-bold text-white uppercase truncate max-w-[80px]">{tB?.name}</span>
                            </div>
                         </div>
                       );
                     })
                   }
                 </div>
               </div>
            </div>

            <button
              onClick={() => setShowCelebration(false)}
              className="w-full max-w-xs py-4 md:py-5 rounded-[24px] bg-brand-accent text-white font-black uppercase tracking-widest text-[10px] md:text-xs shadow-[0_10px_30px_rgba(139,92,246,0.3)] hover:scale-105 active:scale-95 transition-all glow-accent"
            >
              ЗАКРЫТЬ
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
