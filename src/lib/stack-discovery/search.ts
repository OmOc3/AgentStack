import {
  stackCategoryLabels,
  stackDifficultyLabels,
  type StackCategory,
  type StackCategoryFilterValue,
  type StackDifficulty,
  type StackDifficultyFilterValue,
  type StackDiscoveryItem,
} from "./types";

const DEFAULT_RECOMMENDATION_LIMIT = 3;
const DIACRITIC_MARKS_PATTERN = /[\u0300-\u036f]/g;
const TOKEN_SPLIT_PATTERN = /[\s,;:/()[\]{}|]+/;

type WeightedField = {
  values: readonly string[];
  weight: number;
};

type RankedItem<TItem extends StackDiscoveryItem = StackDiscoveryItem> = {
  index: number;
  item: TItem;
  score: number;
};

export function searchStacks<TItem extends StackDiscoveryItem>(
  items: readonly TItem[],
  query: string,
): TItem[] {
  const normalizedQuery = normalizeSearchText(query);
  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) {
    return [...items];
  }

  return items
    .map((item, index): RankedItem<TItem> | null => {
      const score = scoreSearchItem(item, queryTokens, normalizedQuery);

      return score === null ? null : { index, item, score };
    })
    .filter(isRankedItem)
    .sort(sortRankedItems)
    .map(({ item }) => item);
}

export function filterStacksByCategory<TItem extends StackDiscoveryItem>(
  items: readonly TItem[],
  category: StackCategoryFilterValue,
): TItem[] {
  if (category === "all") {
    return [...items];
  }

  return items.filter((item) => item.metadata.category === category);
}

export function filterStacksByDifficulty<TItem extends StackDiscoveryItem>(
  items: readonly TItem[],
  difficulty: StackDifficultyFilterValue,
): TItem[] {
  if (difficulty === "all") {
    return [...items];
  }

  return items.filter((item) => item.metadata.difficulty === difficulty);
}

export function getRecommendedStacks<TItem extends StackDiscoveryItem>(
  items: readonly TItem[],
  userIntent: string,
): TItem[] {
  const intentTokens = tokenize(userIntent);
  const ranked = items.map((item, index): RankedItem<TItem> => {
    const score =
      intentTokens.length === 0
        ? getBaselineRecommendationScore(item)
        : scoreRecommendationItem(item, intentTokens);

    return { index, item, score };
  });
  const matchingItems =
    intentTokens.length === 0
      ? ranked
      : ranked.filter(({ score }) => score > 0);
  const sourceItems =
    matchingItems.length > 0 ? matchingItems : getBaselineRankedItems(items);

  return sourceItems
    .sort(sortRankedItems)
    .slice(0, DEFAULT_RECOMMENDATION_LIMIT)
    .map(({ item }) => item);
}

function scoreSearchItem(
  item: StackDiscoveryItem,
  queryTokens: readonly string[],
  normalizedQuery: string,
) {
  let totalScore = getPhraseScore(item, normalizedQuery);
  const fields = getSearchFields(item);

  for (const token of queryTokens) {
    const tokenScore = getBestTokenScore(fields, token);

    if (tokenScore === 0) {
      return null;
    }

    totalScore += tokenScore;
  }

  return totalScore;
}

function scoreRecommendationItem(
  item: StackDiscoveryItem,
  intentTokens: readonly string[],
) {
  const fields = getSearchFields(item);
  let matchedTokens = 0;
  let score = getBaselineRecommendationScore(item);

  for (const token of intentTokens) {
    const tokenScore = getBestTokenScore(fields, token);

    if (tokenScore > 0) {
      matchedTokens += 1;
      score += tokenScore;
    }
  }

  return matchedTokens === 0 ? 0 : score + matchedTokens * 2;
}

function getPhraseScore(item: StackDiscoveryItem, normalizedQuery: string) {
  if (!normalizedQuery) {
    return 0;
  }

  const haystack = getSearchFields(item)
    .flatMap(({ values }) => values)
    .map(normalizeSearchText)
    .join(" ");

  return haystack.includes(normalizedQuery) ? 6 : 0;
}

function getSearchFields(item: StackDiscoveryItem): WeightedField[] {
  const { metadata } = item;

  return [
    {
      values: [item.id, item.name, ...(metadata.aliases ?? [])],
      weight: 12,
    },
    {
      values: metadata.tags,
      weight: 8,
    },
    {
      values: [
        metadata.category,
        getCategoryLabel(metadata.category),
        metadata.difficulty,
        getDifficultyLabel(metadata.difficulty),
        ...(metadata.recommendedFor ?? []),
        ...(metadata.searchKeywords ?? []),
      ],
      weight: 6,
    },
    {
      values: [item.description],
      weight: 3,
    },
  ];
}

function getBestTokenScore(fields: readonly WeightedField[], token: string) {
  return fields.reduce((bestScore, field) => {
    const fieldScore = getFieldTokenScore(field, token);

    return Math.max(bestScore, fieldScore);
  }, 0);
}

function getFieldTokenScore(field: WeightedField, token: string) {
  return field.values.reduce((bestScore, value) => {
    const normalizedValue = normalizeSearchText(value);

    if (!normalizedValue) {
      return bestScore;
    }

    const valueTokens = splitTokens(normalizedValue);

    if (normalizedValue === token || valueTokens.includes(token)) {
      return Math.max(bestScore, field.weight + 4);
    }

    if (normalizedValue.startsWith(token)) {
      return Math.max(bestScore, field.weight + 2);
    }

    if (normalizedValue.includes(token)) {
      return Math.max(bestScore, field.weight);
    }

    return bestScore;
  }, 0);
}

function getBaselineRecommendationScore(item: StackDiscoveryItem) {
  return item.metadata.recommendationWeight ?? 1;
}

function getBaselineRankedItems<TItem extends StackDiscoveryItem>(
  items: readonly TItem[],
): RankedItem<TItem>[] {
  return items.map((item, index) => ({
    index,
    item,
    score: getBaselineRecommendationScore(item),
  }));
}

function getCategoryLabel(category: StackCategory) {
  return stackCategoryLabels[category];
}

function getDifficultyLabel(difficulty: StackDifficulty) {
  return stackDifficultyLabels[difficulty];
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFKD")
    .replace(DIACRITIC_MARKS_PATTERN, "")
    .toLowerCase()
    .trim();
}

function tokenize(value: string) {
  return splitTokens(normalizeSearchText(value));
}

function splitTokens(value: string) {
  return value.split(TOKEN_SPLIT_PATTERN).filter(Boolean);
}

function isRankedItem<TItem extends StackDiscoveryItem>(
  value: RankedItem<TItem> | null,
): value is RankedItem<TItem> {
  return value !== null;
}

function sortRankedItems(first: RankedItem, second: RankedItem) {
  if (first.score !== second.score) {
    return second.score - first.score;
  }

  return first.index - second.index;
}
