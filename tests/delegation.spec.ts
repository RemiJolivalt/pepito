import { expect, test } from "@playwright/test";
import { assessActionRisk, canExecuteAction, requiresHumanApproval } from "../src/lib/delegation-risk";

test("risk rules use action kind only and fail closed for unknown kinds", () => {
  expect(assessActionRisk("piste_croissance").level).toBe("faible");
  expect(assessActionRisk("prospect").level).toBe("modere");
  for (const kind of ["gbp_update", "review_reply", "social_post", "site_web_content", "prospecting_email", "gmail_email"]) {
    expect(assessActionRisk(kind).level, kind).toBe("eleve");
    expect(requiresHumanApproval(kind), kind).toBe(true);
  }
  expect(assessActionRisk("future_unregistered_kind").level).toBe("eleve");
  expect(requiresHumanApproval("future_unregistered_kind")).toBe(true);
  expect(assessActionRisk("prospect").factors.thirdPartyData).toBe(true);
  expect(requiresHumanApproval("piste_croissance", "accompagner")).toBe(true);
  expect(requiresHumanApproval("piste_croissance", "deleguer")).toBe(false);
  expect(requiresHumanApproval("prospect", "deleguer")).toBe(true);
  expect(requiresHumanApproval("piste_croissance", "deleguer", { spending: true })).toBe(true);
  expect(requiresHumanApproval("piste_croissance", "deleguer", { irreversible: true })).toBe(true);
  expect(requiresHumanApproval("piste_croissance", "deleguer", { publicExposure: true })).toBe(true);
  expect(requiresHumanApproval("piste_croissance", "deleguer", { externalCommunication: true })).toBe(true);
  expect(requiresHumanApproval("piste_croissance", "deleguer", { thirdPartyData: true })).toBe(true);
  expect(canExecuteAction("social_post", "deleguer", false)).toBe(false);
  expect(canExecuteAction("future_unregistered_kind", "deleguer", false)).toBe(false);
  expect(canExecuteAction("piste_croissance", "deleguer", false)).toBe(true);
  expect(canExecuteAction("piste_croissance", "conseiller", true)).toBe(false);
  expect(canExecuteAction("piste_croissance", "accompagner", false)).toBe(false);
  expect(canExecuteAction("piste_croissance", "accompagner", true)).toBe(true);
});