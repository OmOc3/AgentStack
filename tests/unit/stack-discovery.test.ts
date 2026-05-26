import assert from "node:assert/strict";
import test from "node:test";

import {
  getRecommendedStacks,
  toStackDiscoveryItems,
} from "../../src/lib/stack-discovery";
import { stackDefinitions } from "../../src/lib/stacks";

const discoveryStacks = toStackDiscoveryItems(stackDefinitions);

test("recommends the AI chatbot starter for chatbot briefs", () => {
  const recommendations = getRecommendedStacks(
    discoveryStacks,
    "customer support chatbot with model provider",
  );

  assert.equal(recommendations[0]?.id, "ai-chatbot-starter");
});

test("recommends Expo Firebase for mobile and push-heavy briefs", () => {
  const recommendations = getRecommendedStacks(
    discoveryStacks,
    "expo router mobile app with push-ready prototype",
  );

  assert.equal(recommendations[0]?.id, "expo-firebase");
});

test("falls back to weighted starter picks when the brief is empty", () => {
  const recommendationIds = getRecommendedStacks(discoveryStacks, "").map(
    (stack) => stack.id,
  );

  assert.deepEqual(recommendationIds, [
    "next-tailwind",
    "next-supabase",
    "next-firebase",
  ]);
});
