// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  compareMcVersionsDesc,
  doesAssetMatchFilters,
  parseModAssetName,
} from "../src/server/release-matcher";

describe("release-matcher", () => {
  it("parses valid mod asset names by strict regex", () => {
    expect(parseModAssetName("kagurabachicraft-1.20.1-fabric.jar")).toEqual({
      mcVersion: "1.20.1",
      loader: "fabric",
    });

    expect(parseModAssetName("kagurabachicraft-1.21-neoforge.jar")).toEqual({
      mcVersion: "1.21",
      loader: "neoforge",
    });

    expect(parseModAssetName("kagurabachi_craft_neoforge-2.3.2.jar")).toEqual({
      mcVersion: "1.21.1",
      loader: "neoforge",
    });
  });

  it("rejects non-matching asset names", () => {
    expect(parseModAssetName("kagurabachicraft-1.20.1-fabric.zip")).toBeNull();
    expect(parseModAssetName("kagurabachi-1.20.1-fabric.jar")).toBeNull();
    expect(parseModAssetName("kagurabachicraft-1.20.1-fabric-extra.jar")).toBeNull();
  });

  it("matches assets by loader and MC filters", () => {
    const parsed = parseModAssetName("kagurabachicraft-1.20.1-forge.jar");
    expect(parsed).not.toBeNull();

    if (!parsed) {
      throw new Error("Parsing failed");
    }

    expect(doesAssetMatchFilters(parsed, { loader: "forge", mc: "1.20.1" })).toBe(true);
    expect(doesAssetMatchFilters(parsed, { loader: "fabric", mc: "1.20.1" })).toBe(false);
    expect(doesAssetMatchFilters(parsed, { loader: "forge", mc: "1.20.4" })).toBe(false);
  });

  it("sorts MC versions in descending order", () => {
    const versions = ["1.20.1", "1.21", "1.20.6", "1.19.4"];
    const sorted = [...versions].sort(compareMcVersionsDesc);
    expect(sorted).toEqual(["1.21", "1.20.6", "1.20.1", "1.19.4"]);
  });
});
