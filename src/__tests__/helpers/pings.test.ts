// https://stackoverflow.com/a/55193363/2603230
// https://github.com/typeorm/typeorm/issues/1774#issuecomment-374744550
import { BaseEntity } from "typeorm";

import { PingEntity } from "../../entities/PingEntity";
import { getPingsAsync } from "../../helpers/pings";

function mockPingEntityCreateQueryBuilder(chains: {
  [functionName: string]: () => any;
}) {
  const spy = jest.spyOn(BaseEntity, "createQueryBuilder");
  spy.mockReturnValue(chains as any);
  return spy;
}

describe("getPingsAsync", () => {
  test("basic test", async () => {
    const mockResults: PingEntity[] = [];

    const orderBySpy = jest.fn().mockReturnThis();
    const getManySpy = jest.fn().mockReturnValueOnce(mockResults);

    const createQueryBuilderSpy = mockPingEntityCreateQueryBuilder({
      orderBy: orderBySpy,
      getMany: getManySpy,
    });

    const results = await getPingsAsync();

    expect(orderBySpy).toHaveBeenCalledWith("startTime", "ASC");
    expect(results).toBe(mockResults);

    createQueryBuilderSpy.mockRestore();
  });
});
