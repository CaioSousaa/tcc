import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "__tests__" || name === "migrations" ? [] : sourceFiles(path);
    return path.endsWith(".ts") ? [path] : [];
  });
}

/** RF07 N139: `owner_id` never takes part in authorization. */
describe("owner_id review (RF07 N139)", () => {
  it("appears only in the entity and in the board insertion", () => {
    const offenders = sourceFiles(SRC)
      .filter((path) => {
        const code = readFileSync(path, "utf8")
          .split("\n")
          .filter((line) => !/^(\*|\/\*|\/\/)/.test(line.trim()))
          .join("\n");
        return /owner_id|ownerId/.test(code);
      })
      .map((path) => relative(SRC, path).split("\\").join("/"));

    expect(offenders.sort()).toEqual(["entities/Board.ts", "repositories/BoardRepository.ts"]);
    const repository = readFileSync(join(SRC, "repositories/BoardRepository.ts"), "utf8");
    expect(repository.match(/owner_id/g)?.length).toBe(3);
  });
});
