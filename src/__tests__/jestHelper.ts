export type FunctionSpyInstance<T extends (any: any) => any> = jest.SpyInstance<
  ReturnType<T>,
  Parameters<T>
>;
