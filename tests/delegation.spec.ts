import { expect, test } from "@playwright/test";
import { assessActionRisk, requiresHumanApproval } from "../src/lib/delegation-risk";

test("risk rules use action kind only and fail closed for unknown kinds", () => {
  expect(assessActionRisk("piste_croissance").level).toBe("faible");
  expect(assessActionRisk("prospect").level).toBe("modere");
  for (const kind of ["gbp_update", "review_reply", "social_post", "site_web_content", "prospecting_email", "gmail_email"]) {
    expect(assessActionRisk(kind).level, kind).toBe("eleve");
    expect(requiresHumanApproval(kind), kind).toBe(true);
  }
  expect(assessActionRisk("future_unregistered_kind").level).toBe("eleve");
  expect(requiresHumanApproval("future_unregistered_kind")).toBe(true);
  expect(requiresHumanApproval("prospect")).toBe(true);
  expect(requiresHumanApproval("piste_croissance")).toBe(false);
});