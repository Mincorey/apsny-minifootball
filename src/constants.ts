export interface Player {
  id: number;
  number?: number;
  name: string;
  goals: number;
  ownGoals: number;
  yellow: number;
  red: number;
  banMatches: number;
  permanentBan?: boolean;
  photo?: string;
}

export interface PlayerStats {
  goals: number;
  ownGoals: number;
  yellow: number;
  red: number;
}

export interface Match {
  id: number;
  teamAId: number;
  teamBId: number;
  tour: number;
  scoreA: number;
  scoreB: number;
  date: string;
  stats: Record<number, PlayerStats>;
  league: number;
}

export interface ScheduledMatch {
  id: number;
  teamAId: number;
  teamBId: number;
  tour: number;
  dateTime: string;
  league: number;
}

export interface Team {
  id: number;
  league: number;
  name: string;
  color: string;
  logo: string;
  matches: number;
  win: number;
  draw: number;
  loss: number;
  gf: number;
  ga: number;
  players: Player[];
}

export const initialTeams: Team[] = [
  // ЛИГА 1 (Высшая лига)
  {
    id: 1001,
    league: 1,
    name: "АЗАНТА",
    color: "#16a34a",
    logo: "🟢",
    matches: 4, win: 3, draw: 1, loss: 0, gf: 18, ga: 13,
    players: [
      { id: 100101, name: "Адлейба Ален Нодариевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100102, name: "Кобахия Эрик Темурович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100103, name: "Губаз Феликс Славикович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100104, name: "Гуния Данил Джустанович", goals: 6, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100105, name: "Чачба Келешбей Дмитриевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100106, name: "Ханагуа Алмас Зурабович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100107, name: "Хагуш Амаль Гочаевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100108, name: "Цузба Ахря Витальевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100109, name: "Габуния Инар Адгурович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100110, name: "Гунба Айнар Хакибеевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100111, name: "Логуа Давид Нодариевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100112, name: "Гонджуа Аслан Русланович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 }
    ]
  },
  {
    id: 1002,
    league: 1,
    name: "СОВМИН",
    color: "#4f46e5",
    logo: "🏛️",
    matches: 4, win: 3, draw: 0, loss: 1, gf: 20, ga: 10,
    players: [
      { id: 100201, name: "Ахуба Шабат", goals: 6, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100202, name: "Арнаут Анри", goals: 5, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 }
    ]
  },
  {
    id: 1003,
    league: 1,
    name: "ПАТРИОТ",
    color: "#1d4ed8",
    logo: "🛡️",
    matches: 4, win: 3, draw: 0, loss: 1, gf: 23, ga: 14,
    players: [
      { id: 100301, name: "Иванов Игорь", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100302, name: "Семенов Александр", goals: 9, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100303, name: "Назиров Астимир", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100304, name: "Волконский Даниил", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100305, name: "Литовец Юрий", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100306, name: "Абаев Руслан Асланович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100307, name: "Примоский Юрий", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100308, name: "Жириновский Егор", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100309, name: "Паршин Николай", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100310, name: "Пушилин Вадим", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100311, name: "Васильев Владислав", goals: 8, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100312, name: "Невероский Сергей", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100313, name: "Адлейба Ислам Денисович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100314, name: "Пашков Максим", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100315, name: "Войнов Евгений", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 }
    ]
  },
  {
    id: 1004,
    league: 1,
    name: "ЧЕРНОМОРЭНЕРГО",
    color: "#0369a1",
    logo: "⚡",
    matches: 4, win: 2, draw: 1, loss: 1, gf: 15, ga: 17,
    players: [
      { id: 100401, name: "Чаблах Химца Эдикович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100402, name: "Шакрыл Георгий Олегович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100403, name: "Джинджолия Астамур Бесланович", goals: 8, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100404, name: "Адлейба Шабат Зауриевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100405, name: "Харчилава Даур Эдуардович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100406, name: "Гулия Хаджарат Георгиевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100407, name: "Гулия Алиас Георгиевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100408, name: "Квициния Баграт Мурманович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100409, name: "Чхетия Алмасхан Павлович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100410, name: "Дзидзария Нури Астамурович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100411, name: "Ханагуа Саид Зурабович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 }
    ]
  },
  {
    id: 1005,
    league: 1,
    name: "РУБИН",
    color: "#be123c",
    logo: "💎",
    matches: 4, win: 2, draw: 0, loss: 2, gf: 18, ga: 19,
    players: [
      { id: 100501, name: "Канбар Нур Баширович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100502, name: "Кварандзия Алим Алхасович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100503, name: "Харазния Астамур Георгиевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100504, name: "Кварацхелия Кягуа Романович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100505, name: "Читанава Даур Львович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100506, name: "Коява Леван Натрович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100507, name: "Цвижба Инал Омарович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100508, name: "Антия Саид Заурович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100509, name: "Кузьменко Николай Гарриевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100510, name: "Лабия Руслан Владимирович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100511, name: "Шларба Беслан Северьянович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 }
    ]
  },
  {
    id: 1006,
    league: 1,
    name: "ГСО 7-Е УПРАВЛЕНИЕ",
    color: "#64748b",
    logo: "🛡️",
    matches: 4, win: 1, draw: 2, loss: 1, gf: 10, ga: 11,
    players: [
      { id: 100601, name: "Адлейба Армандо Астикович", goals: 6, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100602, name: "Шакая Леван Роландович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100603, name: "Чагава Даут Рудикович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100604, name: "Соломко Саид Зурабович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100605, name: "Чиригба Абзагу Игоревич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100606, name: "Абшилава Денис Хвичевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100607, name: "Кучба Мурат Бесланович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100608, name: "Ахуба Нарсоу Мурманович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100609, name: "Чолокуа Дамей Алиасович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100610, name: "Гурцкая Аляс Гудисович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100611, name: "Лакоба Отар Нодариевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100612, name: "Какубава Даут Тамазиевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 }
    ]
  },
  {
    id: 1007,
    league: 1,
    name: "АТЛАНТ",
    color: "#7c3aed",
    logo: "🔱",
    matches: 4, win: 1, draw: 1, loss: 2, gf: 13, ga: 18,
    players: [
      { id: 100701, name: "Зантария Рамин Романович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100702, name: "Адлейба Александр Тимурович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100703, name: "Цвинария Эмир Геннадьевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100704, name: "Гогия Муртаз Гизович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100705, name: "Зухба Леван Рамазович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100706, name: "Шакрыл Саид Тенгизович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100707, name: "Бжания Алмас Эдуардович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100708, name: "Пилия Айнар Нодарович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100709, name: "Бутба Астамур Резикович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100710, name: "Логуа Сандро Алхасович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100711, name: "Ацухба Тимур Ясонович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100712, name: "Кархалава Сандро Феликсович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100713, name: "Джопуа Аляс Бесланович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100714, name: "Тыркба Рамин Рустамович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100715, name: "Акаба Аслан Русланович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 }
    ]
  },
  {
    id: 1008,
    league: 1,
    name: "НАБЕГУ",
    color: "#10b981",
    logo: "🏃",
    matches: 4, win: 1, draw: 0, loss: 3, gf: 13, ga: 17,
    players: [
      { id: 100801, name: "Алиев Фарид Мерзоевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100802, name: "Джанба Инал Теймуразович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100803, name: "Закарая Беслан Ниронович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100804, name: "Бицоев Джамал Нугзарович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100805, name: "Чантурия Батал Арсенович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100806, name: "Сизов Аляс Русланович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100807, name: "Квициния Астик Ихтиандрович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100808, name: "Ашуба Саид Аликович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100809, name: "Дедегкаев Темур Теймуразович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100810, name: "Квициния Астик Сатбеевич", goals: 9, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 }
    ]
  },
  {
    id: 1009,
    league: 1,
    name: "АПСНЫ",
    color: "#ea580c",
    logo: "🍷",
    matches: 4, win: 0, draw: 2, loss: 2, gf: 11, ga: 18,
    players: [
      { id: 100901, name: "Ашхацава Мустафа Александрович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100902, name: "Ашхацава Шалва Георгиевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100903, name: "Дмитриев Вячеслав Владимирович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100904, name: "Иванов Роман Григорьевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100905, name: "Габелия Мурат Славикович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100906, name: "Гайдуков Тимур Владимирович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100907, name: "Гунба Султан Джемуриевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100908, name: "Асландзия Беслан Динварович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100909, name: "Кобахия Аслан Астамурович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100910, name: "Чкуа Мурат Джанкатович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100911, name: "Гвинджия Леон Ратмирович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100912, name: "Читана Дамир Гурамович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100913, name: "Жиба Леон Рафетович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100914, name: "Пардаев Жавохир", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 100915, name: "Алтейба Алиас Юрьевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 }
    ]
  },
  {
    id: 1010,
    league: 1,
    name: "8-Й РАЙОН ОЧАМЧИРА",
    color: "#d97706",
    logo: "🏠",
    matches: 4, win: 0, draw: 1, loss: 3, gf: 12, ga: 16,
    players: [
      { id: 101001, name: "Алания Адам Игоревич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 101002, name: "Квициния Анджей Леванович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 101003, name: "Бутба Аслан Бесланович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 101004, name: "Тарба Тимур Тимурович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 101005, name: "Салакая Сунар Сатбеевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 101006, name: "Хаджимба Денис Тенгизович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 101007, name: "Начкебия Даниил Джанбулович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 101008, name: "Кучуберия Алан Русланович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 101009, name: "Куржиев Дмитрий Романович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 101010, name: "Делба Омар Бесланович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 101011, name: "Цхадая Рамаз Дмитриевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 101012, name: "Салия Георгий Вахтангович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 }
    ]
  },
  {
    id: 1,
    league: 2,
    name: "Royal mall",
    color: "#d97706",
    logo: "👑",
    matches: 4, win: 2, draw: 1, loss: 1, gf: 19, ga: 13,
    players: [
      { id: 1001, name: "Какалия Аинар Витальевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 401, name: "Когония Арзамет Тенгизович", goals: 8, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 1003, name: "Киут Алмасхан Темурович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 1004, name: "Гаделия Леван Вианорович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 402, name: "Догузия Лука Зурабович", goals: 5, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 1006, name: "Маргания Лёма Вячеславович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 1007, name: "Микая Темур Темурович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 1008, name: "Гунба Нарт Неджетович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 1009, name: "Эшба Батал Валерьевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 1010, name: "Кобахия Гудиса Асланович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 1011, name: "Пилия Сандро Русланович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 1012, name: "Джопуа Леон Мурманович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 1013, name: "Асландзия Алик Лавретьевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 }
    ]
  },
  {
    id: 2,
    league: 2,
    name: "Аэропорт",
    color: "#1d4ed8",
    logo: "✈️",
    matches: 4, win: 3, draw: 1, loss: 0, gf: 39, ga: 12,
    players: [
      { id: 101, name: "Карая Руслан Бесикович", goals: 22, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 111, name: "Кузнецов Роман Леонидович", goals: 4, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 104, name: "Чкадуа Денис Дмитриевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 2004, name: "Барганджия Беслан Арсенович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 106, name: "Гамисония Вахтанг Ревазович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 102, name: "Джопуа Алишер Алимович", goals: 8, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 107, name: "Симония Игорь Раульевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 108, name: "Герзмава Геннадий Отарович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 109, name: "Шинкуба Инал Баталович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 110, name: "Макаров Вячеслав Игоревич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 112, name: "Чесноков Алексей Дмитриевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 113, name: "Киут Саид Асланович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 2013, name: "Кварчия Инал Нарсоуевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 }
    ]
  },
  {
    id: 3,
    league: 2,
    name: "Совмин - 2",
    color: "#4f46e5",
    logo: "🏛️",
    matches: 4, win: 1, draw: 1, loss: 2, gf: 14, ga: 18,
    players: [
      { id: 3001, name: "Харчилава Денис Михайлович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 3002, name: "Тужба Леон Емзарович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 3003, name: "Каджая Руслан Заурович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 3004, name: "Джалагония Наросоу Ревазович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 3005, name: "Пархоменко Антон Александрович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 3006, name: "Зантария Раш Матбеевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 3007, name: "Айба Наур Сурамович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 3008, name: "Аргун Тимур Игоревич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 602, name: "Кверквелия Анзор Нугзарович", goals: 4, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 3010, name: "Асландзия Джинар Джумберович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 601, name: "Чиковани Мераб Зурабович", goals: 6, ownGoals: 0, yellow: 1, red: 0, banMatches: 0 },
      { id: 3012, name: "Жвания Апполон", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 3013, name: "Ласурия Аслан", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 }
    ]
  },
  {
    id: 4,
    league: 2,
    name: "Адуней",
    color: "#dc2626",
    logo: "🐎",
    matches: 4, win: 3, draw: 0, loss: 1, gf: 31, ga: 17,
    players: [
      { id: 4001, name: "Вартикян Артем Артурович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 202, name: "Касландзия Леван Темурович", goals: 7, ownGoals: 0, yellow: 1, red: 0, banMatches: 0 },
      { id: 4003, name: "Агрба Наур Даутович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 4004, name: "Ардзинба Сандро Винорович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 204, name: "Адлейба Даниль Мерабович", goals: 3, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 201, name: "Абухба Астан Джумберович", goals: 14, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 4007, name: "Адлейба Давид Темурович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 4008, name: "Чкадуа Георгий Дмитриевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 203, name: "Тарба Самир Артурович", goals: 6, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 4010, name: "Сангулия Сандро Тимурович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 4011, name: "Беслан-ипа Аслан Феликсович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 }
    ]
  },
  {
    id: 5,
    league: 2,
    name: "Decibel",
    color: "#0d9488",
    logo: "🔊",
    matches: 4, win: 2, draw: 0, loss: 2, gf: 12, ga: 13,
    players: [
      { id: 5001, name: "Кремлян Арутюн Георгиевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 5002, name: "Хаджимба Арсен Темурович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 5003, name: "Адлейба Анри Русланович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 5004, name: "Адлейба Давид Темурович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 5005, name: "Ашуба Нестор Даурович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 801, name: "Амичба Георг Алхасович", goals: 4, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 5007, name: "Иосава Константин Отарович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 5008, name: "Лемонджава Отари Заурович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 5009, name: "Виноградов Владимир Артурович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 5010, name: "Ардзинба Адамур Сергеевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 5011, name: "Квициния Лаша Баталович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 }
    ]
  },
  {
    id: 6,
    league: 2,
    name: "Империал",
    color: "#db2777",
    logo: "🏰",
    matches: 4, win: 3, draw: 0, loss: 1, gf: 16, ga: 15,
    players: [
      { id: 502, name: "Ашуба Рустам Джониевич", goals: 5, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 6002, name: "Хибба Омар Алмасханович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 6003, name: "Чукбар Сандро Кахаевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 6004, name: "Кове Бенар Валерьевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 6005, name: "Пачулия Леван Нугзарович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 6006, name: "Жиба Нарт Отарович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 6007, name: "Зухба Нарсоу Асланович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 6008, name: "Джинджба Дмитрий Яшаевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 6009, name: "Ханагуа Даниил Тенгизович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 6010, name: "Цимцба Владимир Павлович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 6011, name: "Нанба Илларион Джамалович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 6012, name: "Агрба Астан Астамурович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 501, name: "Купалба Даниил Гурамович", goals: 7, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 6014, name: "Купалба Алан", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 }
    ]
  },
  {
    id: 7,
    league: 2,
    name: "Диоскурия",
    color: "#1e293b",
    logo: "🏺",
    matches: 4, win: 0, draw: 1, loss: 3, gf: 12, ga: 19,
    players: [
      { id: 7001, name: "Аршба Гудиса Алесеевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 7002, name: "Аршба Давуд Эрикович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 7003, name: "Айба Саид Гарикович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 7004, name: "Айба Садам Элгуджович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 7005, name: "Адлейба Батал Гивиевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 7006, name: "Бганба Джамал Валерьевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 7007, name: "Кутарба Денис Бесланович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 7008, name: "Куруа Астамур Валерьевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 7009, name: "Хашиг Арсоу Гарикович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 }
    ]
  },
  {
    id: 8,
    league: 2,
    name: "Черное Море",
    color: "#16a34a",
    logo: "🌊",
    matches: 4, win: 3, draw: 0, loss: 1, gf: 24, ga: 15,
    players: [
      { id: 303, name: "Таркил Нестор Саидович", goals: 4, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 8002, name: "Джалагония Леон Гочаевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 301, name: "Салакая Инал Сосланович", goals: 12, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 8004, name: "Ченгелия Георгий Русланович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 8005, name: "Алан Даниил Роландович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 8006, name: "Хагба Смел Малхазович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 302, name: "Павленко Андрей Витальевич", goals: 4, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 8008, name: "Айрапетян Никита Тимурович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 8009, name: "Собекия Никита Сергеевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 8010, name: "Езугбая Роин Цезаревич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 }
    ]
  },
  {
    id: 9,
    league: 2,
    name: "Анакопия",
    color: "#7c3aed",
    logo: "☦️",
    matches: 4, win: 0, draw: 1, loss: 3, gf: 11, ga: 33,
    players: [
      { id: 9001, name: "Ламчава Руслан Харитонович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 9002, name: "Вардания Инал Заурбеевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 9003, name: "Аргун Дмитрий Михайлович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 701, name: "Смыр Саид Гариевич", goals: 5, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 9005, name: "Нурмахаммад Абдухамидов Абурайхон", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 9006, name: "Жиба Эрик Венедиевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 702, name: "Фахризод Каримов Шоберди оглы", goals: 5, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 9008, name: "Хагба Сайд Бесланович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 }
    ]
  },
  {
    id: 10,
    league: 2,
    name: "Миграционная",
    color: "#ea580c",
    logo: "🛂",
    matches: 4, win: 0, draw: 1, loss: 3, gf: 12, ga: 35,
    players: [
      { id: 10001, name: "Тарба Никита Дмитриевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 901, name: "Эшба Саид Джамбулович", goals: 4, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 10003, name: "Бобуа Энрике Габриелович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 10004, name: "Гогуа Владимир Темурович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 10005, name: "Адлейба Денис Викторович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 10006, name: "Касландзия Тимур Бесланович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 10007, name: "Эшба Тимур Джамбулович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 10008, name: "Гогохия Девид Мирабович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 10009, name: "Киут Руслан Рамзикович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 10010, name: "Ханагуа Нугзар Гочаевич", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 10011, name: "Джинджолия Инал Инверович", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 },
      { id: 10012, name: "Логуа Астамур", goals: 0, ownGoals: 0, yellow: 0, red: 0, banMatches: 0 }
    ]
  }

];

export const initialScheduledMatches: ScheduledMatch[] = [
  // ЛИГА 2 Тур 5
  { id: 501, teamAId: 2, teamBId: 4, tour: 5, dateTime: "15.05.2026 19:00", league: 2 },
  { id: 502, teamAId: 6, teamBId: 9, tour: 5, dateTime: "15.05.2026 19:50", league: 2 },
  { id: 503, teamAId: 3, teamBId: 10, tour: 5, dateTime: "15.05.2026 20:40", league: 2 },
  { id: 504, teamAId: 5, teamBId: 1, tour: 5, dateTime: "15.05.2026 21:30", league: 2 },
  { id: 505, teamAId: 8, teamBId: 7, tour: 5, dateTime: "15.05.2026 22:20", league: 2 }
];

export const initialMatches: Match[] = [
  // ЛИГА 1 Тур 1
  { id: 10011, teamAId: 1006, teamBId: 1010, tour: 1, scoreA: 3, scoreB: 3, date: "16.04.2026", stats: {}, league: 1 },
  { id: 10012, teamAId: 1007, teamBId: 1003, tour: 1, scoreA: 2, scoreB: 8, date: "16.04.2026", stats: {}, league: 1 },
  { id: 10013, teamAId: 1009, teamBId: 1005, tour: 1, scoreA: 3, scoreB: 7, date: "16.04.2026", stats: {}, league: 1 },
  { id: 10014, teamAId: 1008, teamBId: 1004, tour: 1, scoreA: 3, scoreB: 5, date: "16.04.2026", stats: {}, league: 1 },
  { id: 10015, teamAId: 1002, teamBId: 1001, tour: 1, scoreA: 1, scoreB: 2, date: "16.04.2026", stats: {}, league: 1 },
  // ЛИГА 1 Тур 2
  { id: 10021, teamAId: 1003, teamBId: 1009, tour: 2, scoreA: 5, scoreB: 2, date: "26.04.2026", stats: {}, league: 1 },
  { id: 10022, teamAId: 1004, teamBId: 1002, tour: 2, scoreA: 1, scoreB: 6, date: "26.04.2026", stats: {}, league: 1 },
  { id: 10023, teamAId: 1005, teamBId: 1008, tour: 2, scoreA: 3, scoreB: 1, date: "26.04.2026", stats: {}, league: 1 },
  { id: 10024, teamAId: 1006, teamBId: 1007, tour: 2, scoreA: 3, scoreB: 2, date: "26.04.2026", stats: {}, league: 1 },
  { id: 10025, teamAId: 1010, teamBId: 1001, tour: 2, scoreA: 3, scoreB: 4, date: "28.04.2026", stats: {}, league: 1 },
  // ЛИГА 1 Тур 3
  { id: 10031, teamAId: 1002, teamBId: 1005, tour: 3, scoreA: 8, scoreB: 4, date: "30.04.2026", stats: {}, league: 1 },
  { id: 10032, teamAId: 1008, teamBId: 1003, tour: 3, scoreA: 5, scoreB: 7, date: "30.04.2026", stats: {}, league: 1 },
  { id: 10033, teamAId: 1001, teamBId: 1004, tour: 3, scoreA: 5, scoreB: 5, date: "30.04.2026", stats: {}, league: 1 },
  { id: 10034, teamAId: 1007, teamBId: 1010, tour: 3, scoreA: 5, scoreB: 3, date: "30.04.2026", stats: {}, league: 1 },
  { id: 10035, teamAId: 1009, teamBId: 1006, tour: 3, scoreA: 2, scoreB: 2, date: "30.04.2026", stats: {}, league: 1 },
  // ЛИГА 1 Тур 4
  { id: 10041, teamAId: 1010, teamBId: 1004, tour: 4, scoreA: 3, scoreB: 4, date: "06.05.2026", stats: {}, league: 1 },
  { id: 10042, teamAId: 1003, teamBId: 1002, tour: 4, scoreA: 3, scoreB: 5, date: "06.05.2026", stats: {}, league: 1 },
  { id: 10043, teamAId: 1006, teamBId: 1008, tour: 4, scoreA: 2, scoreB: 4, date: "06.05.2026", stats: {}, league: 1 },
  { id: 10044, teamAId: 1005, teamBId: 1001, tour: 4, scoreA: 4, scoreB: 7, date: "06.05.2026", stats: {}, league: 1 },
  { id: 10045, teamAId: 1007, teamBId: 1009, tour: 4, scoreA: 4, scoreB: 4, date: "06.05.2026", stats: {}, league: 1 },

  // ЛИГА 2 Тур 1
  { id: 11, teamAId: 1, teamBId: 10, tour: 1, scoreA: 7, scoreB: 2, date: "01.05.2026", stats: {}, league: 2 },
  { id: 12, teamAId: 2, teamBId: 9, tour: 1, scoreA: 13, scoreB: 3, date: "01.05.2026", stats: {}, league: 2 },
  { id: 13, teamAId: 3, teamBId: 8, tour: 1, scoreA: 6, scoreB: 4, date: "01.05.2026", stats: {}, league: 2 },
  { id: 14, teamAId: 4, teamBId: 7, tour: 1, scoreA: 7, scoreB: 2, date: "01.05.2026", stats: {}, league: 2 },
  { id: 15, teamAId: 5, teamBId: 6, tour: 1, scoreA: 2, scoreB: 3, date: "01.05.2026", stats: {}, league: 2 },
  // ЛИГА 2 Тур 2
  { id: 21, teamAId: 8, teamBId: 4, tour: 2, scoreA: 7, scoreB: 5, date: "03.05.2026", stats: {}, league: 2 },
  { id: 22, teamAId: 10, teamBId: 6, tour: 2, scoreA: 3, scoreB: 7, date: "03.05.2026", stats: {}, league: 2 },
  { id: 23, teamAId: 7, teamBId: 5, tour: 2, scoreA: 2, scoreB: 3, date: "03.05.2026", stats: {}, league: 2 },
  { id: 24, teamAId: 9, teamBId: 3, tour: 2, scoreA: 3, scoreB: 3, date: "03.05.2026", stats: {}, league: 2 },
  { id: 25, teamAId: 1, teamBId: 2, tour: 2, scoreA: 3, scoreB: 3, date: "03.05.2026", stats: {}, league: 2 },
  // ЛИГА 2 Тур 3
  { id: 31, teamAId: 4, teamBId: 9, tour: 3, scoreA: 13, scoreB: 4, date: "05.05.2026", stats: {}, league: 2 },
  { id: 32, teamAId: 3, teamBId: 1, tour: 3, scoreA: 2, scoreB: 5, date: "05.05.2026", stats: {}, league: 2 },
  { id: 33, teamAId: 5, teamBId: 8, tour: 3, scoreA: 3, scoreB: 7, date: "05.05.2026", stats: {}, league: 2 },
  { id: 34, teamAId: 2, teamBId: 10, tour: 3, scoreA: 17, scoreB: 3, date: "05.05.2026", stats: {}, league: 2 },
  { id: 35, teamAId: 6, teamBId: 7, tour: 3, scoreA: 5, scoreB: 4, date: "05.05.2026", stats: {}, league: 2 },
  // ЛИГА 2 Тур 4
  { id: 41, teamAId: 9, teamBId: 5, tour: 4, scoreA: 1, scoreB: 4, date: "07.05.2026", stats: {}, league: 2 },
  { id: 42, teamAId: 2, teamBId: 3, tour: 4, scoreA: 6, scoreB: 3, date: "07.05.2026", stats: {}, league: 2 },
  { id: 43, teamAId: 1, teamBId: 4, tour: 4, scoreA: 4, scoreB: 6, date: "07.05.2026", stats: {}, league: 2 },
  { id: 44, teamAId: 8, teamBId: 6, tour: 4, scoreA: 6, scoreB: 1, date: "07.05.2026", stats: {}, league: 2 },
  { id: 45, teamAId: 10, teamBId: 7, tour: 4, scoreA: 4, scoreB: 4, date: "07.05.2026", stats: {}, league: 2 }
];

// АДМИН УЧЕТНЫЕ ДАННЫЕ
export const ADMIN_LOGIN = 'admin'
export const ADMIN_PASSWORD_HASH = 'e980c117460f1ff382447b046c5ff624a75b311f7785472f81275270ba03e2a8'
