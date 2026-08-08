import { describe, expect, it } from "vitest";
import prisma from "../src/config/prisma";
import { BASELINE } from "./seed";

/**
 * Half of a pair. isolation.b.test.ts is identical apart from the name, and
 * both insert the same primary key. If the two files ever shared a database,
 * one of them would fail on the unique constraint — or, worse, pass while
 * seeing the other's row.
 *
 * The count assertion matters as much as the insert: it is what catches a
 * database that is shared but happens not to collide.
 */

describe("cross-file isolation", () => {
  it("owns its own database", async () => {
    await prisma.roles.create({
      data: { role_id: "SHARED_KEY", role_name: "Shared", priority: 1 },
    });

    // Long enough for the other file to have inserted its row, if it were
    // going to land here.
    await new Promise((resolve) => setTimeout(resolve, 500));

    const roles = await prisma.roles.findMany();

    // The baseline seed and this file's row, and nothing else. Counting rather
    // than looking SHARED_KEY up is the part that catches a shared database in
    // which the other file's row happened not to collide.
    expect(roles).toHaveLength(BASELINE.roles.length + 1);
    expect(roles.find((role) => role.role_id === "SHARED_KEY")?.role_name).toBe(
      "Shared",
    );
  });
});
