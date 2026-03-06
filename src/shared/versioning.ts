export const compareMcVersionsDesc = (a: string, b: string): number => {
  const aParts = a.split(".").map((part) => Number.parseInt(part, 10));
  const bParts = b.split(".").map((part) => Number.parseInt(part, 10));

  const maxLength = Math.max(aParts.length, bParts.length);
  for (let index = 0; index < maxLength; index += 1) {
    const aValue = aParts[index] ?? 0;
    const bValue = bParts[index] ?? 0;
    if (aValue !== bValue) {
      return bValue - aValue;
    }
  }

  return 0;
};
