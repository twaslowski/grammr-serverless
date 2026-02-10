// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const takeUniqueOrThrow = <T extends any[]>(values: T): T[number] => {
  if (values.length !== 1)
    throw new Error(
      "expected exactly one value, query returned " + values.length,
    );
  return values[0]!;
};
