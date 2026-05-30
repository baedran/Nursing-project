import { describe, expect, test } from "vitest";
import { toSummaryData, type SummaryRow } from "@/lib/portal/summary";

const base: SummaryRow = {
  status: "published",
  vitals: { bp: "128/82", hr: "74", spo2: "97", temp: "36.6" },
  done_body: "IV hydration.",
  observations_body: "Alert and comfortable.",
  meds_administered: ["Vancomycin 1 g IV"],
  watch_items: ["Fever above 38°C"],
  next_visit_body: "Thu 18:30.",
  coordinator_note: "Supplies on hand.",
  written_at: "2026-05-14T16:12:00Z",
  published_at: "2026-05-14T17:00:00Z",
  patientLabel: "Mariam",
  district: "Achrafieh",
  caseRef: "Case 2026-051",
  visitScheduledAt: "2026-05-14T15:30:00Z",
};

describe("toSummaryData", () => {
  test("maps vitals object into ordered label/value pairs", () => {
    const d = toSummaryData(base, []);
    expect(d.vitals).toEqual([
      { label: "BP", value: "128/82" },
      { label: "HR", value: "74" },
      { label: "SpO₂", value: "97" },
      { label: "Temp", value: "36.6" },
    ]);
  });

  test("passes through bodies and lists", () => {
    const d = toSummaryData(base, []);
    expect(d.doneBody).toBe("IV hydration.");
    expect(d.meds).toEqual(["Vancomycin 1 g IV"]);
    expect(d.watchItems).toEqual(["Fever above 38°C"]);
    expect(d.caseRef).toBe("Case 2026-051");
  });

  test("omits vitals with empty values", () => {
    const d = toSummaryData({ ...base, vitals: { bp: "120/80", hr: "", spo2: "", temp: "37" } }, []);
    expect(d.vitals.map((v) => v.label)).toEqual(["BP", "Temp"]);
  });

  test("maps photos with their signed urls", () => {
    const d = toSummaryData(base, [{ caption: "Pre-dressing", url: "https://signed/1" }]);
    expect(d.photos).toEqual([{ caption: "Pre-dressing", url: "https://signed/1" }]);
  });

  test("status drives the live label", () => {
    expect(toSummaryData({ ...base, status: "published" }, []).liveLabel).toBe("Published");
    expect(toSummaryData({ ...base, status: "draft" }, []).liveLabel).toBe("Draft");
    expect(toSummaryData({ ...base, status: "in_review" }, []).liveLabel).toBe("In review");
  });
});
