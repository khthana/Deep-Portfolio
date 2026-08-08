import { describe, expect, it } from "vitest";
import prisma from "../src/config/prisma";
import { BASELINE } from "./seed";

/** The other half of the pair. See isolation.a.test.ts. */

describe("cross-file isolation", () => {
  it("owns its own database", async () => {
    await prisma.roles.create({
      data: { role_id: "SHARED_KEY", role_name: "Also shared", priority: 1 },
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    const roles = await prisma.roles.findMany();

    expect(roles).toHaveLength(BASELINE.roles.length + 1);
    expect(roles.find((role) => role.role_id === "SHARED_KEY")?.role_name).toBe(
      "Also shared",
    );
  });
});
