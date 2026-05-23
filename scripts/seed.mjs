/**
 * scripts/seed.mjs
 * Заполняет БД Supabase начальными данными из constants.ts
 *
 * Запуск (один раз, после выполнения docs/schema.sql):
 *   node scripts/seed.mjs
 *
 * Требует Node 18+. Использует native fetch — никаких npm-зависимостей не нужно.
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ── Читаем .env вручную (не нужен dotenv) ─────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dir, '../.env')
const envVars = {}
try {
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
    envVars[key] = val
  }
} catch {
  console.error('❌ Не удалось прочитать .env')
  process.exit(1)
}

const SUPABASE_URL     = envVars.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Нет VITE_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY в .env')
  process.exit(1)
}

// ── Вспомогательные функции ───────────────────────────────────────────────────

const headers = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
}

async function insert(table, rows) {
  if (!Array.isArray(rows)) rows = [rows]
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(rows),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`INSERT ${table} failed (${res.status}): ${text}`)
  }
  return res.json()
}

async function deleteAll(table) {
  // DELETE WHERE id IS NOT NULL — удаляет все строки
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=not.is.null`, {
    method: 'DELETE',
    headers,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`DELETE ${table} failed (${res.status}): ${text}`)
  }
}

/** "16.04.2026" → "2026-04-16" */
function toISODate(str) {
  const [d, m, y] = str.split('.')
  return `${y}-${m}-${d}`
}

/** "15.05.2026 19:00" → "2026-05-15T19:00:00+00:00" */
function toISODateTime(str) {
  const [date, time] = str.split(' ')
  const [d, m, y] = date.split('.')
  return `${y}-${m}-${d}T${time}:00+00:00`
}

// ── Исходные данные (скопированы из constants.ts) ─────────────────────────────

const initialTeams = [
  // ЛИГА 1 (Высшая лига)
  {
    oldId: 1001, league: 1, name: 'АЗАНТА', color: '#16a34a',
    players: [
      { oldId: 100101, name: 'Адлейба Ален Нодариевич' },
      { oldId: 100102, name: 'Кобахия Эрик Темурович' },
      { oldId: 100103, name: 'Губаз Феликс Славикович' },
      { oldId: 100104, name: 'Гуния Данил Джустанович' },
      { oldId: 100105, name: 'Чачба Келешбей Дмитриевич' },
      { oldId: 100106, name: 'Ханагуа Алмас Зурабович' },
      { oldId: 100107, name: 'Хагуш Амаль Гочаевич' },
      { oldId: 100108, name: 'Цузба Ахря Витальевич' },
      { oldId: 100109, name: 'Габуния Инар Адгурович' },
      { oldId: 100110, name: 'Гунба Айнар Хакибеевич' },
      { oldId: 100111, name: 'Логуа Давид Нодариевич' },
      { oldId: 100112, name: 'Гонджуа Аслан Русланович' },
    ],
  },
  {
    oldId: 1002, league: 1, name: 'СОВМИН', color: '#4f46e5',
    players: [
      { oldId: 100201, name: 'Ахуба Шабат' },
      { oldId: 100202, name: 'Арнаут Анри' },
    ],
  },
  {
    oldId: 1003, league: 1, name: 'ПАТРИОТ', color: '#1d4ed8',
    players: [
      { oldId: 100301, name: 'Иванов Игорь' },
      { oldId: 100302, name: 'Семенов Александр' },
      { oldId: 100303, name: 'Назиров Астимир' },
      { oldId: 100304, name: 'Волконский Даниил' },
      { oldId: 100305, name: 'Литовец Юрий' },
      { oldId: 100306, name: 'Абаев Руслан Асланович' },
      { oldId: 100307, name: 'Примоский Юрий' },
      { oldId: 100308, name: 'Жириновский Егор' },
      { oldId: 100309, name: 'Паршин Николай' },
      { oldId: 100310, name: 'Пушилин Вадим' },
      { oldId: 100311, name: 'Васильев Владислав' },
      { oldId: 100312, name: 'Невероский Сергей' },
      { oldId: 100313, name: 'Адлейба Ислам Денисович' },
      { oldId: 100314, name: 'Пашков Максим' },
      { oldId: 100315, name: 'Войнов Евгений' },
    ],
  },
  {
    oldId: 1004, league: 1, name: 'ЧЕРНОМОРЭНЕРГО', color: '#0369a1',
    players: [
      { oldId: 100401, name: 'Чаблах Химца Эдикович' },
      { oldId: 100402, name: 'Шакрыл Георгий Олегович' },
      { oldId: 100403, name: 'Джинджолия Астамур Бесланович' },
      { oldId: 100404, name: 'Адлейба Шабат Зауриевич' },
      { oldId: 100405, name: 'Харчилава Даур Эдуардович' },
      { oldId: 100406, name: 'Гулия Хаджарат Георгиевич' },
      { oldId: 100407, name: 'Гулия Алиас Георгиевич' },
      { oldId: 100408, name: 'Квициния Баграт Мурманович' },
      { oldId: 100409, name: 'Чхетия Алмасхан Павлович' },
      { oldId: 100410, name: 'Дзидзария Нури Астамурович' },
      { oldId: 100411, name: 'Ханагуа Саид Зурабович' },
    ],
  },
  {
    oldId: 1005, league: 1, name: 'РУБИН', color: '#be123c',
    players: [
      { oldId: 100501, name: 'Канбар Нур Баширович' },
      { oldId: 100502, name: 'Кварандзия Алим Алхасович' },
      { oldId: 100503, name: 'Харазния Астамур Георгиевич' },
      { oldId: 100504, name: 'Кварацхелия Кягуа Романович' },
      { oldId: 100505, name: 'Читанава Даур Львович' },
      { oldId: 100506, name: 'Коява Леван Натрович' },
      { oldId: 100507, name: 'Цвижба Инал Омарович' },
      { oldId: 100508, name: 'Антия Саид Заурович' },
      { oldId: 100509, name: 'Кузьменко Николай Гарриевич' },
      { oldId: 100510, name: 'Лабия Руслан Владимирович' },
      { oldId: 100511, name: 'Шларба Беслан Северьянович' },
    ],
  },
  {
    oldId: 1006, league: 1, name: 'ГСО 7-Е УПРАВЛЕНИЕ', color: '#64748b',
    players: [
      { oldId: 100601, name: 'Адлейба Армандо Астикович' },
      { oldId: 100602, name: 'Шакая Леван Роландович' },
      { oldId: 100603, name: 'Чагава Даут Рудикович' },
      { oldId: 100604, name: 'Соломко Саид Зурабович' },
      { oldId: 100605, name: 'Чиригба Абзагу Игоревич' },
      { oldId: 100606, name: 'Абшилава Денис Хвичевич' },
      { oldId: 100607, name: 'Кучба Мурат Бесланович' },
      { oldId: 100608, name: 'Ахуба Нарсоу Мурманович' },
      { oldId: 100609, name: 'Чолокуа Дамей Алиасович' },
      { oldId: 100610, name: 'Гурцкая Аляс Гудисович' },
      { oldId: 100611, name: 'Лакоба Отар Нодариевич' },
      { oldId: 100612, name: 'Какубава Даут Тамазиевич' },
    ],
  },
  {
    oldId: 1007, league: 1, name: 'АТЛАНТ', color: '#7c3aed',
    players: [
      { oldId: 100701, name: 'Зантария Рамин Романович' },
      { oldId: 100702, name: 'Адлейба Александр Тимурович' },
      { oldId: 100703, name: 'Цвинария Эмир Геннадьевич' },
      { oldId: 100704, name: 'Гогия Муртаз Гизович' },
      { oldId: 100705, name: 'Зухба Леван Рамазович' },
      { oldId: 100706, name: 'Шакрыл Саид Тенгизович' },
      { oldId: 100707, name: 'Бжания Алмас Эдуардович' },
      { oldId: 100708, name: 'Пилия Айнар Нодарович' },
      { oldId: 100709, name: 'Бутба Астамур Резикович' },
      { oldId: 100710, name: 'Логуа Сандро Алхасович' },
      { oldId: 100711, name: 'Ацухба Тимур Ясонович' },
      { oldId: 100712, name: 'Кархалава Сандро Феликсович' },
      { oldId: 100713, name: 'Джопуа Аляс Бесланович' },
      { oldId: 100714, name: 'Тыркба Рамин Рустамович' },
      { oldId: 100715, name: 'Акаба Аслан Русланович' },
    ],
  },
  {
    oldId: 1008, league: 1, name: 'НАБЕГУ', color: '#10b981',
    players: [
      { oldId: 100801, name: 'Алиев Фарид Мерзоевич' },
      { oldId: 100802, name: 'Джанба Инал Теймуразович' },
      { oldId: 100803, name: 'Закарая Беслан Ниронович' },
      { oldId: 100804, name: 'Бицоев Джамал Нугзарович' },
      { oldId: 100805, name: 'Чантурия Батал Арсенович' },
      { oldId: 100806, name: 'Сизов Аляс Русланович' },
      { oldId: 100807, name: 'Квициния Астик Ихтиандрович' },
      { oldId: 100808, name: 'Ашуба Саид Аликович' },
      { oldId: 100809, name: 'Дедегкаев Темур Теймуразович' },
      { oldId: 100810, name: 'Квициния Астик Сатбеевич' },
    ],
  },
  {
    oldId: 1009, league: 1, name: 'АПСНЫ', color: '#ea580c',
    players: [
      { oldId: 100901, name: 'Ашхацава Мустафа Александрович' },
      { oldId: 100902, name: 'Ашхацава Шалва Георгиевич' },
      { oldId: 100903, name: 'Дмитриев Вячеслав Владимирович' },
      { oldId: 100904, name: 'Иванов Роман Григорьевич' },
      { oldId: 100905, name: 'Габелия Мурат Славикович' },
      { oldId: 100906, name: 'Гайдуков Тимур Владимирович' },
      { oldId: 100907, name: 'Гунба Султан Джемуриевич' },
      { oldId: 100908, name: 'Асландзия Беслан Динварович' },
      { oldId: 100909, name: 'Кобахия Аслан Астамурович' },
      { oldId: 100910, name: 'Чкуа Мурат Джанкатович' },
      { oldId: 100911, name: 'Гвинджия Леон Ратмирович' },
      { oldId: 100912, name: 'Читана Дамир Гурамович' },
      { oldId: 100913, name: 'Жиба Леон Рафетович' },
      { oldId: 100914, name: 'Пардаев Жавохир' },
      { oldId: 100915, name: 'Алтейба Алиас Юрьевич' },
    ],
  },
  {
    oldId: 1010, league: 1, name: '8-Й РАЙОН ОЧАМЧИРА', color: '#d97706',
    players: [
      { oldId: 101001, name: 'Алания Адам Игоревич' },
      { oldId: 101002, name: 'Квициния Анджей Леванович' },
      { oldId: 101003, name: 'Бутба Аслан Бесланович' },
      { oldId: 101004, name: 'Тарба Тимур Тимурович' },
      { oldId: 101005, name: 'Салакая Сунар Сатбеевич' },
      { oldId: 101006, name: 'Хаджимба Денис Тенгизович' },
      { oldId: 101007, name: 'Начкебия Даниил Джанбулович' },
      { oldId: 101008, name: 'Кучуберия Алан Русланович' },
      { oldId: 101009, name: 'Куржиев Дмитрий Романович' },
      { oldId: 101010, name: 'Делба Омар Бесланович' },
      { oldId: 101011, name: 'Цхадая Рамаз Дмитриевич' },
      { oldId: 101012, name: 'Салия Георгий Вахтангович' },
    ],
  },

  // ЛИГА 2
  {
    oldId: 1, league: 2, name: 'Royal Mall', color: '#d97706',
    players: [
      { oldId: 1001, name: 'Какалия Аинар Витальевич' },
      { oldId: 401,  name: 'Когония Арзамет Тенгизович' },
      { oldId: 1003, name: 'Киут Алмасхан Темурович' },
      { oldId: 1004, name: 'Гаделия Леван Вианорович' },
      { oldId: 402,  name: 'Догузия Лука Зурабович' },
      { oldId: 1006, name: 'Маргания Лёма Вячеславович' },
      { oldId: 1007, name: 'Микая Темур Темурович' },
      { oldId: 1008, name: 'Гунба Нарт Неджетович' },
      { oldId: 1009, name: 'Эшба Батал Валерьевич' },
      { oldId: 1010, name: 'Кобахия Гудиса Асланович' },
      { oldId: 1011, name: 'Пилия Сандро Русланович' },
      { oldId: 1012, name: 'Джопуа Леон Мурманович' },
      { oldId: 1013, name: 'Асландзия Алик Лавретьевич' },
    ],
  },
  {
    oldId: 2, league: 2, name: 'Аэропорт', color: '#1d4ed8',
    players: [
      { oldId: 101,  name: 'Карая Руслан Бесикович' },
      { oldId: 111,  name: 'Кузнецов Роман Леонидович' },
      { oldId: 104,  name: 'Чкадуа Денис Дмитриевич' },
      { oldId: 2004, name: 'Барганджия Беслан Арсенович' },
      { oldId: 106,  name: 'Гамисония Вахтанг Ревазович' },
      { oldId: 102,  name: 'Джопуа Алишер Алимович' },
      { oldId: 107,  name: 'Симония Игорь Раульевич' },
      { oldId: 108,  name: 'Герзмава Геннадий Отарович' },
      { oldId: 109,  name: 'Шинкуба Инал Баталович' },
      { oldId: 110,  name: 'Макаров Вячеслав Игоревич' },
      { oldId: 112,  name: 'Чесноков Алексей Дмитриевич' },
      { oldId: 113,  name: 'Киут Саид Асланович' },
      { oldId: 2013, name: 'Кварчия Инал Нарсоуевич' },
    ],
  },
  {
    oldId: 3, league: 2, name: 'Совмин - 2', color: '#4f46e5',
    players: [
      { oldId: 3001, name: 'Харчилава Денис Михайлович' },
      { oldId: 3002, name: 'Тужба Леон Емзарович' },
      { oldId: 3003, name: 'Каджая Руслан Заурович' },
      { oldId: 3004, name: 'Джалагония Наросоу Ревазович' },
      { oldId: 3005, name: 'Пархоменко Антон Александрович' },
      { oldId: 3006, name: 'Зантария Раш Матбеевич' },
      { oldId: 3007, name: 'Айба Наур Сурамович' },
      { oldId: 3008, name: 'Аргун Тимур Игоревич' },
      { oldId: 602,  name: 'Кверквелия Анзор Нугзарович' },
      { oldId: 3010, name: 'Асландзия Джинар Джумберович' },
      { oldId: 601,  name: 'Чиковани Мераб Зурабович', yellowCards: 1 },
      { oldId: 3012, name: 'Жвания Апполон' },
      { oldId: 3013, name: 'Ласурия Аслан' },
    ],
  },
  {
    oldId: 4, league: 2, name: 'Адуней', color: '#dc2626',
    players: [
      { oldId: 4001, name: 'Вартикян Артем Артурович' },
      { oldId: 202,  name: 'Касландзия Леван Темурович', yellowCards: 1 },
      { oldId: 4003, name: 'Агрба Наур Даутович' },
      { oldId: 4004, name: 'Ардзинба Сандро Винорович' },
      { oldId: 204,  name: 'Адлейба Даниль Мерабович' },
      { oldId: 201,  name: 'Абухба Астан Джумберович' },
      { oldId: 4007, name: 'Адлейба Давид Темурович' },
      { oldId: 4008, name: 'Чкадуа Георгий Дмитриевич' },
      { oldId: 203,  name: 'Тарба Самир Артурович' },
      { oldId: 4010, name: 'Сангулия Сандро Тимурович' },
      { oldId: 4011, name: 'Беслан-ипа Аслан Феликсович' },
    ],
  },
  {
    oldId: 5, league: 2, name: 'Decibel', color: '#0d9488',
    players: [
      { oldId: 5001, name: 'Кремлян Арутюн Георгиевич' },
      { oldId: 5002, name: 'Хаджимба Арсен Темурович' },
      { oldId: 5003, name: 'Адлейба Анри Русланович' },
      { oldId: 5004, name: 'Адлейба Давид Темурович' },
      { oldId: 5005, name: 'Ашуба Нестор Даурович' },
      { oldId: 801,  name: 'Амичба Георг Алхасович' },
      { oldId: 5007, name: 'Иосава Константин Отарович' },
      { oldId: 5008, name: 'Лемонджава Отари Заурович' },
      { oldId: 5009, name: 'Виноградов Владимир Артурович' },
      { oldId: 5010, name: 'Ардзинба Адамур Сергеевич' },
      { oldId: 5011, name: 'Квициния Лаша Баталович' },
    ],
  },
  {
    oldId: 6, league: 2, name: 'Империал', color: '#db2777',
    players: [
      { oldId: 502,  name: 'Ашуба Рустам Джониевич' },
      { oldId: 6002, name: 'Хибба Омар Алмасханович' },
      { oldId: 6003, name: 'Чукбар Сандро Кахаевич' },
      { oldId: 6004, name: 'Кове Бенар Валерьевич' },
      { oldId: 6005, name: 'Пачулия Леван Нугзарович' },
      { oldId: 6006, name: 'Жиба Нарт Отарович' },
      { oldId: 6007, name: 'Зухба Нарсоу Асланович' },
      { oldId: 6008, name: 'Джинджба Дмитрий Яшаевич' },
      { oldId: 6009, name: 'Ханагуа Даниил Тенгизович' },
      { oldId: 6010, name: 'Цимцба Владимир Павлович' },
      { oldId: 6011, name: 'Нанба Илларион Джамалович' },
      { oldId: 6012, name: 'Агрба Астан Астамурович' },
      { oldId: 501,  name: 'Купалба Даниил Гурамович' },
      { oldId: 6014, name: 'Купалба Алан' },
    ],
  },
  {
    oldId: 7, league: 2, name: 'Диоскурия', color: '#1e293b',
    players: [
      { oldId: 7001, name: 'Аршба Гудиса Алесеевич' },
      { oldId: 7002, name: 'Аршба Давуд Эрикович' },
      { oldId: 7003, name: 'Айба Саид Гарикович' },
      { oldId: 7004, name: 'Айба Садам Элгуджович' },
      { oldId: 7005, name: 'Адлейба Батал Гивиевич' },
      { oldId: 7006, name: 'Бганба Джамал Валерьевич' },
      { oldId: 7007, name: 'Кутарба Денис Бесланович' },
      { oldId: 7008, name: 'Куруа Астамур Валерьевич' },
      { oldId: 7009, name: 'Хашиг Арсоу Гарикович' },
    ],
  },
  {
    oldId: 8, league: 2, name: 'Черное Море', color: '#16a34a',
    players: [
      { oldId: 303,  name: 'Таркил Нестор Саидович' },
      { oldId: 8002, name: 'Джалагония Леон Гочаевич' },
      { oldId: 301,  name: 'Салакая Инал Сосланович' },
      { oldId: 8004, name: 'Ченгелия Георгий Русланович' },
      { oldId: 8005, name: 'Алан Даниил Роландович' },
      { oldId: 8006, name: 'Хагба Смел Малхазович' },
      { oldId: 302,  name: 'Павленко Андрей Витальевич' },
      { oldId: 8008, name: 'Айрапетян Никита Тимурович' },
      { oldId: 8009, name: 'Собекия Никита Сергеевич' },
      { oldId: 8010, name: 'Езугбая Роин Цезаревич' },
    ],
  },
  {
    oldId: 9, league: 2, name: 'Анакопия', color: '#7c3aed',
    players: [
      { oldId: 9001, name: 'Ламчава Руслан Харитонович' },
      { oldId: 9002, name: 'Вардания Инал Заурбеевич' },
      { oldId: 9003, name: 'Аргун Дмитрий Михайлович' },
      { oldId: 701,  name: 'Смыр Саид Гариевич' },
      { oldId: 9005, name: 'Нурмахаммад Абдухамидов Абурайхон' },
      { oldId: 9006, name: 'Жиба Эрик Венедиевич' },
      { oldId: 702,  name: 'Фахризод Каримов Шоберди оглы' },
      { oldId: 9008, name: 'Хагба Сайд Бесланович' },
    ],
  },
  {
    oldId: 10, league: 2, name: 'Миграционная', color: '#ea580c',
    players: [
      { oldId: 10001, name: 'Тарба Никита Дмитриевич' },
      { oldId: 901,   name: 'Эшба Саид Джамбулович' },
      { oldId: 10003, name: 'Бобуа Энрике Габриелович' },
      { oldId: 10004, name: 'Гогуа Владимир Темурович' },
      { oldId: 10005, name: 'Адлейба Денис Викторович' },
      { oldId: 10006, name: 'Касландзия Тимур Бесланович' },
      { oldId: 10007, name: 'Эшба Тимур Джамбулович' },
      { oldId: 10008, name: 'Гогохия Девид Мирабович' },
      { oldId: 10009, name: 'Киут Руслан Рамзикович' },
      { oldId: 10010, name: 'Ханагуа Нугзар Гочаевич' },
      { oldId: 10011, name: 'Джинджолия Инал Инверович' },
      { oldId: 10012, name: 'Логуа Астамур' },
    ],
  },
]

const initialMatches = [
  // ЛИГА 1
  { oldTeamA: 1006, oldTeamB: 1010, tour: 1, scoreA: 3,  scoreB: 3,  date: '16.04.2026', league: 1 },
  { oldTeamA: 1007, oldTeamB: 1003, tour: 1, scoreA: 2,  scoreB: 8,  date: '16.04.2026', league: 1 },
  { oldTeamA: 1009, oldTeamB: 1005, tour: 1, scoreA: 3,  scoreB: 7,  date: '16.04.2026', league: 1 },
  { oldTeamA: 1008, oldTeamB: 1004, tour: 1, scoreA: 3,  scoreB: 5,  date: '16.04.2026', league: 1 },
  { oldTeamA: 1002, oldTeamB: 1001, tour: 1, scoreA: 1,  scoreB: 2,  date: '16.04.2026', league: 1 },
  { oldTeamA: 1003, oldTeamB: 1009, tour: 2, scoreA: 5,  scoreB: 2,  date: '26.04.2026', league: 1 },
  { oldTeamA: 1004, oldTeamB: 1002, tour: 2, scoreA: 1,  scoreB: 6,  date: '26.04.2026', league: 1 },
  { oldTeamA: 1005, oldTeamB: 1008, tour: 2, scoreA: 3,  scoreB: 1,  date: '26.04.2026', league: 1 },
  { oldTeamA: 1006, oldTeamB: 1007, tour: 2, scoreA: 3,  scoreB: 2,  date: '26.04.2026', league: 1 },
  { oldTeamA: 1010, oldTeamB: 1001, tour: 2, scoreA: 3,  scoreB: 4,  date: '28.04.2026', league: 1 },
  { oldTeamA: 1002, oldTeamB: 1005, tour: 3, scoreA: 8,  scoreB: 4,  date: '30.04.2026', league: 1 },
  { oldTeamA: 1008, oldTeamB: 1003, tour: 3, scoreA: 5,  scoreB: 7,  date: '30.04.2026', league: 1 },
  { oldTeamA: 1001, oldTeamB: 1004, tour: 3, scoreA: 5,  scoreB: 5,  date: '30.04.2026', league: 1 },
  { oldTeamA: 1007, oldTeamB: 1010, tour: 3, scoreA: 5,  scoreB: 3,  date: '30.04.2026', league: 1 },
  { oldTeamA: 1009, oldTeamB: 1006, tour: 3, scoreA: 2,  scoreB: 2,  date: '30.04.2026', league: 1 },
  { oldTeamA: 1010, oldTeamB: 1004, tour: 4, scoreA: 3,  scoreB: 4,  date: '06.05.2026', league: 1 },
  { oldTeamA: 1003, oldTeamB: 1002, tour: 4, scoreA: 3,  scoreB: 5,  date: '06.05.2026', league: 1 },
  { oldTeamA: 1006, oldTeamB: 1008, tour: 4, scoreA: 2,  scoreB: 4,  date: '06.05.2026', league: 1 },
  { oldTeamA: 1005, oldTeamB: 1001, tour: 4, scoreA: 4,  scoreB: 7,  date: '06.05.2026', league: 1 },
  { oldTeamA: 1007, oldTeamB: 1009, tour: 4, scoreA: 4,  scoreB: 4,  date: '06.05.2026', league: 1 },
  // ЛИГА 2
  { oldTeamA: 1,  oldTeamB: 10, tour: 1, scoreA: 7,  scoreB: 2,  date: '01.05.2026', league: 2 },
  { oldTeamA: 2,  oldTeamB: 9,  tour: 1, scoreA: 13, scoreB: 3,  date: '01.05.2026', league: 2 },
  { oldTeamA: 3,  oldTeamB: 8,  tour: 1, scoreA: 6,  scoreB: 4,  date: '01.05.2026', league: 2 },
  { oldTeamA: 4,  oldTeamB: 7,  tour: 1, scoreA: 7,  scoreB: 2,  date: '01.05.2026', league: 2 },
  { oldTeamA: 5,  oldTeamB: 6,  tour: 1, scoreA: 2,  scoreB: 3,  date: '01.05.2026', league: 2 },
  { oldTeamA: 8,  oldTeamB: 4,  tour: 2, scoreA: 7,  scoreB: 5,  date: '03.05.2026', league: 2 },
  { oldTeamA: 10, oldTeamB: 6,  tour: 2, scoreA: 3,  scoreB: 7,  date: '03.05.2026', league: 2 },
  { oldTeamA: 7,  oldTeamB: 5,  tour: 2, scoreA: 2,  scoreB: 3,  date: '03.05.2026', league: 2 },
  { oldTeamA: 9,  oldTeamB: 3,  tour: 2, scoreA: 3,  scoreB: 3,  date: '03.05.2026', league: 2 },
  { oldTeamA: 1,  oldTeamB: 2,  tour: 2, scoreA: 3,  scoreB: 3,  date: '03.05.2026', league: 2 },
  { oldTeamA: 4,  oldTeamB: 9,  tour: 3, scoreA: 13, scoreB: 4,  date: '05.05.2026', league: 2 },
  { oldTeamA: 3,  oldTeamB: 1,  tour: 3, scoreA: 2,  scoreB: 5,  date: '05.05.2026', league: 2 },
  { oldTeamA: 5,  oldTeamB: 8,  tour: 3, scoreA: 3,  scoreB: 7,  date: '05.05.2026', league: 2 },
  { oldTeamA: 2,  oldTeamB: 10, tour: 3, scoreA: 17, scoreB: 3,  date: '05.05.2026', league: 2 },
  { oldTeamA: 6,  oldTeamB: 7,  tour: 3, scoreA: 5,  scoreB: 4,  date: '05.05.2026', league: 2 },
  { oldTeamA: 9,  oldTeamB: 5,  tour: 4, scoreA: 1,  scoreB: 4,  date: '07.05.2026', league: 2 },
  { oldTeamA: 2,  oldTeamB: 3,  tour: 4, scoreA: 6,  scoreB: 3,  date: '07.05.2026', league: 2 },
  { oldTeamA: 1,  oldTeamB: 4,  tour: 4, scoreA: 4,  scoreB: 6,  date: '07.05.2026', league: 2 },
  { oldTeamA: 8,  oldTeamB: 6,  tour: 4, scoreA: 6,  scoreB: 1,  date: '07.05.2026', league: 2 },
  { oldTeamA: 10, oldTeamB: 7,  tour: 4, scoreA: 4,  scoreB: 4,  date: '07.05.2026', league: 2 },
]

const initialScheduledMatches = [
  { oldTeamA: 2, oldTeamB: 4,  tour: 5, dateTime: '15.05.2026 19:00', league: 2 },
  { oldTeamA: 6, oldTeamB: 9,  tour: 5, dateTime: '15.05.2026 19:50', league: 2 },
  { oldTeamA: 3, oldTeamB: 10, tour: 5, dateTime: '15.05.2026 20:40', league: 2 },
  { oldTeamA: 5, oldTeamB: 1,  tour: 5, dateTime: '15.05.2026 21:30', league: 2 },
  { oldTeamA: 8, oldTeamB: 7,  tour: 5, dateTime: '15.05.2026 22:20', league: 2 },
]

// ── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Начинаем seed...\n')

  // 1. Сезон
  console.log('📅 Создаём сезон...')
  const [season] = await insert('seasons', {
    name: '2025/2026',
    year: 2026,
    status: 'active',
    started_at: '2026-04-16T00:00:00+00:00',
  })
  const seasonId = season.id
  console.log(`   ✅ Сезон: ${season.name} (${seasonId})\n`)

  // 2. Лиги
  console.log('🏆 Создаём лиги...')
  const [liga1] = await insert('leagues', {
    season_id: seasonId,
    name: 'Высшая лига',
    sort_order: 1,
  })
  const [liga2] = await insert('leagues', {
    season_id: seasonId,
    name: 'Первая лига',
    sort_order: 2,
  })
  const leagueMap = { 1: liga1.id, 2: liga2.id }
  console.log(`   ✅ ${liga1.name} (${liga1.id})`)
  console.log(`   ✅ ${liga2.name} (${liga2.id})\n`)

  // 3. Команды + игроки
  console.log('👕 Создаём команды и игроков...')
  const teamMap = new Map()   // oldId → newUUID
  const playerMap = new Map() // oldId → newUUID

  for (const team of initialTeams) {
    const [t] = await insert('teams', {
      league_id: leagueMap[team.league],
      name: team.name,
      color: team.color,
    })
    teamMap.set(team.oldId, t.id)

    if (team.players.length > 0) {
      const playerRows = team.players.map(p => ({
        team_id: t.id,
        name: p.name,
      }))
      const inserted = await insert('players', playerRows)
      // Суперпозиция: inserted идёт в том же порядке что и playerRows
      for (let i = 0; i < team.players.length; i++) {
        playerMap.set(team.players[i].oldId, inserted[i].id)
      }
    }

    const league = team.league === 1 ? 'Высшая лига' : 'Первая лига'
    console.log(`   ✅ ${team.name} (${league}) — ${team.players.length} игроков`)
  }
  console.log()

  // 4. Сыгранные матчи
  console.log('⚽ Вставляем сыгранные матчи...')
  const matchRows = initialMatches.map(m => ({
    league_id: leagueMap[m.league],
    team_a_id: teamMap.get(m.oldTeamA),
    team_b_id: teamMap.get(m.oldTeamB),
    score_a:   m.scoreA,
    score_b:   m.scoreB,
    tour:      m.tour,
    status:    'played',
    played_at: `${toISODate(m.date)}T18:00:00+00:00`,
  }))
  await insert('matches', matchRows)
  console.log(`   ✅ ${matchRows.length} сыгранных матчей\n`)

  // 5. Запланированные матчи
  console.log('📆 Вставляем запланированные матчи...')
  const scheduledRows = initialScheduledMatches.map(m => ({
    league_id:    leagueMap[m.league],
    team_a_id:    teamMap.get(m.oldTeamA),
    team_b_id:    teamMap.get(m.oldTeamB),
    tour:         m.tour,
    status:       'scheduled',
    scheduled_at: toISODateTime(m.dateTime),
  }))
  await insert('matches', scheduledRows)
  console.log(`   ✅ ${scheduledRows.length} запланированных матчей\n`)

  console.log('✨ Seed завершён успешно!')
  console.log()
  console.log('📊 Итого:')
  console.log(`   • 1 сезон`)
  console.log(`   • 2 лиги`)
  console.log(`   • ${initialTeams.length} команд`)
  console.log(`   • ${initialTeams.reduce((s, t) => s + t.players.length, 0)} игроков`)
  console.log(`   • ${matchRows.length} сыгранных матчей`)
  console.log(`   • ${scheduledRows.length} запланированных матчей`)
  console.log()
  console.log('⚠️  Примечание: статистика игроков (голы/карточки по матчам)')
  console.log('   вводится через админ-панель после запуска приложения.')
}

main().catch(err => {
  console.error('\n❌ Ошибка:', err.message)
  process.exit(1)
})
