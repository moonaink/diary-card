// The columns of the paper diary card (front side), declared once. The day screen, the PDF and the
// record validation all iterate these declarations, so a column is added or renamed only here.

export const RATING_MAX = 5
export const SKILLS_USE_MAX = 7

export const URGE_FIELDS = [
  { key: 'urgeSuicide', label: 'Совершению суицида' },
  { key: 'urgeSelfHarm', label: 'Самоповреждению' },
  { key: 'urgeDrugUse', label: 'Употреблению наркотиков' },
] as const

export const STATE_FIELDS = [
  { key: 'emotionalMisery', label: 'Эмоциональное страдание' },
  { key: 'physicalMisery', label: 'Физическое страдание' },
  { key: 'pleasure', label: 'Удовольствие' },
] as const

export const EMOTION_FIELDS = [
  { key: 'anger', label: 'Гнев' },
  { key: 'happiness', label: 'Счастье' },
  { key: 'sadness', label: 'Печаль' },
  { key: 'guilt', label: 'Вина' },
  { key: 'shame', label: 'Стыд' },
  { key: 'fear', label: 'Страх' },
  { key: 'anxiety', label: 'Тревога' },
  { key: 'disappointment', label: 'Разочарование' },
] as const

export type RatingKey =
  | (typeof URGE_FIELDS)[number]['key']
  | (typeof STATE_FIELDS)[number]['key']
  | (typeof EMOTION_FIELDS)[number]['key']

export interface RatingGroup {
  title: string
  subtitle?: string
  fields: readonly { key: RatingKey; label: string }[]
}

export const URGES: RatingGroup = { title: 'Побуждение к', fields: URGE_FIELDS }

export const STATES: RatingGroup = {
  title: 'Состояния',
  subtitle: 'максимальная выраженность в течение дня',
  fields: STATE_FIELDS,
}

export const EMOTIONS: RatingGroup = {
  title: 'Эмоции',
  subtitle: 'максимальная выраженность в течение дня',
  fields: EMOTION_FIELDS,
}

export const RATING_KEYS: readonly RatingKey[] = [URGES, STATES, EMOTIONS].flatMap((group) =>
  group.fields.map((field) => field.key),
)

/** «Группа: колонка» for messages, e.g. «Побуждение к: Совершению суицида». */
export const RATING_LABELS = Object.fromEntries(
  [URGES, STATES, EMOTIONS].flatMap((group) =>
    group.fields.map((field) => [field.key, `${group.title}: ${field.label}`]),
  ),
) as Record<RatingKey, string>

export const SUBSTANCES_TITLE = 'Наркотики/Медикаменты'

export const SUBSTANCE_CATEGORIES = [
  { key: 'alcohol', label: 'Алкоголь' },
  { key: 'drugs', label: 'Наркотики' },
  { key: 'prescribed', label: 'Лекарственные препараты (по рецепту)' },
  { key: 'otc', label: 'Лекарственные препараты (без рецепта)' },
] as const

export type SubstanceCategory = (typeof SUBSTANCE_CATEGORIES)[number]['key']

export const SUBSTANCE_CATEGORY_KEYS: readonly SubstanceCategory[] = SUBSTANCE_CATEGORIES.map(
  (category) => category.key,
)

export const ACTIONS_TITLE = 'Действия'

export const ACTION_LABELS = {
  selfHarm: 'Самоповреждение',
  lies: 'Ложь',
  skillsUse: 'Применение навыков',
} as const

/** Meaning of each «Применение навыков» value, index = value, as printed on the paper card. */
export const SKILLS_USE_SCALE = [
  'не думал(а) о навыках и не использовал(а)',
  'думал(а) о навыках, не хотел(а) применять, не использовал(а)',
  'думал(а) о навыках, хотел(а) применить, но не использовал(а)',
  'старался(ась), но не смог(ла) применить навыки',
  'старался(ась), смог(ла) применить навыки, но они не помогли',
  'старался(ась), смог(ла) применить навыки, они помогли',
  'использовал(а) навыки, не стараясь (автоматически), они не помогли',
  'использовал(а) навыки, не стараясь (автоматически), они помогли',
] as const
