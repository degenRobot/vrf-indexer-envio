import {
  VRFCoordinatorV2,
  VrfRequest,
  VrfStats,
} from "generated";

const GLOBAL_STATS_ID = "global";

VRFCoordinatorV2.RequestRaised.handler(async ({ event, context }) => {
  const requestId = event.params.requestId.toString();

  const entity: VrfRequest = {
    id: requestId,
    requester: event.params.requester.toString(),
    numNumbers: Number(event.params.numNumbers),
    clientSeed: event.params.clientSeed.toString(),
    timestamp: event.block.timestamp,
    blockNumber: BigInt(event.block.number),
    transactionHash: event.transaction.hash,
    fulfilled: false,
    fulfilledTimestamp: undefined,
    fulfilledBlockNumber: undefined,
    fulfilledTransactionHash: undefined,
  };

  context.VrfRequest.set(entity);

  // Update global stats
  let stats = await context.VrfStats.get(GLOBAL_STATS_ID);
  if (stats) {
    context.VrfStats.set({
      ...stats,
      totalRequests: stats.totalRequests + 1n,
      totalPending: stats.totalPending + 1n,
      lastRequestTimestamp: event.block.timestamp,
    });
  } else {
    context.VrfStats.set({
      id: GLOBAL_STATS_ID,
      totalRequests: 1n,
      totalFulfilled: 0n,
      totalPending: 1n,
      lastRequestTimestamp: event.block.timestamp,
      lastFulfilledTimestamp: undefined,
    });
  }
});

VRFCoordinatorV2.RequestFulfilled.handler(async ({ event, context }) => {
  const requestId = event.params.requestId.toString();

  const existing = await context.VrfRequest.get(requestId);
  if (existing) {
    context.VrfRequest.set({
      ...existing,
      fulfilled: true,
      fulfilledTimestamp: event.block.timestamp,
      fulfilledBlockNumber: BigInt(event.block.number),
      fulfilledTransactionHash: event.transaction.hash,
    });
  }

  // Update global stats
  let stats = await context.VrfStats.get(GLOBAL_STATS_ID);
  if (stats) {
    context.VrfStats.set({
      ...stats,
      totalFulfilled: stats.totalFulfilled + 1n,
      totalPending: stats.totalPending > 0n ? stats.totalPending - 1n : 0n,
      lastFulfilledTimestamp: event.block.timestamp,
    });
  }
});
