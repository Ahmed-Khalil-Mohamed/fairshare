import { test } from "node:test";
import assert from "node:assert/strict";
import { projects, findProject } from "../src/projects";
import { DomainError, cash, type Entry } from "../src/contracts";
import { splitCents, balances, settlements } from "../src/settlements";
const now = new Date("2026-10-12T12:00:00Z");
const p = (id: string) => findProject(id)!;
const rejects = (fn: () => unknown, code: string) =>
  assert.throws(
    fn,
    (e: unknown) => e instanceof DomainError && e.code === code,
  );
for (const project of projects) {
  test(`${project.name}: samples yield finite, renderable metrics and recognized states`, () => {
    const entries = project.seed(now).map((data, i) => ({
      id: String(i),
      version: 1,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      data,
    }));
    assert.ok(entries.length);
    assert.equal(project.metrics(entries, now).length, 3);
    for (const e of entries) {
      assert.ok(project.title(e.data));
      assert.ok(project.statuses[project.status(e.data, now)]);
    }
    for (const m of project.metrics(entries, now)) {
      assert.ok(m.label.ar && m.label.en);
      assert.ok(typeof m.value === "string" || Number.isFinite(m.value));
    }
  });
}
test("FairShare preserves every cent across 300 randomized splits", () => {
  for (let i = 1; i <= 300; i++) {
    const amount = i * 17 + 1,
      people = Array.from({ length: (i % 13) + 1 }, (_, n) => `Person ${n}`);
    const split = splitCents(amount, people);
    assert.equal(
      split.reduce((s, x) => s + x.cents, 0),
      amount,
    );
    assert.ok(
      Math.max(...split.map((x) => x.cents)) -
        Math.min(...split.map((x) => x.cents)) <=
        1,
    );
  }
});
test("FairShare proposed transfers zero the entire balance without rounding loss", () => {
  const entries: Entry[] = p("fairshare")
    .seed(now)
    .map((data, i) => ({
      id: String(i),
      version: 1,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      data,
    }));
  const initial = balances(entries);
  assert.equal(
    Object.values(initial).reduce((s, n) => s + n, 0),
    0,
  );
  const proposed = settlements(entries);
  for (const transfer of proposed)
    entries.push({
      id: crypto.randomUUID(),
      version: 1,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      data: {
        kind: "settlement",
        paidBy: transfer.from,
        people: [transfer.to],
        amount: transfer.amount,
      },
    });
  assert.ok(Object.values(balances(entries)).every((n) => n === 0));
  assert.deepEqual(settlements(entries), []);
});
test("FairShare special names cannot mutate the object prototype", () => {
  const rows: any = [
    {
      data: {
        kind: "expense",
        paidBy: "__proto__",
        people: ["__proto__", "constructor"],
        amount: 100,
      },
    },
  ];
  const result = balances(rows);
  assert.equal(result["__proto__"], 50);
  assert.equal(result["constructor"], -50);
  assert.equal(Object.getPrototypeOf(result), null);
});
test("Currency display preserves cents above Number safe integer range", () => {
  assert.equal(cash(200000000000000001n), "EGP 2,000,000,000,000,000.01");
  assert.equal(cash(-1n), "-EGP 0.01");
});
