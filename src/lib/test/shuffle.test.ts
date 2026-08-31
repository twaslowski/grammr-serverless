import { shuffle } from "@/lib/shuffle";

describe("shuffle", () => {
  it("preserves all elements", () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    expect(result).toHaveLength(input.length);
    expect(result.sort()).toEqual([...input].sort());
  });

  it("does not mutate the input array", () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    shuffle(input);
    expect(input).toEqual(copy);
  });

  it("handles empty and single-element arrays", () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle([1])).toEqual([1]);
  });

  it("eventually produces a different order than the input", () => {
    const input = Array.from({ length: 20 }, (_, i) => i);
    const orders = new Set<string>();
    for (let i = 0; i < 20; i++) {
      orders.add(shuffle(input).join(","));
    }
    expect(orders.size).toBeGreaterThan(1);
  });
});
