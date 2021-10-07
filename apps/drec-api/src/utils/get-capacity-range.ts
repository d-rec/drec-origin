import { CapacityRange } from './enums';

export const getCapacityRange = (aggregatedCapacity: number): CapacityRange => {
  const aggregatedCapacityKw = Math.round(aggregatedCapacity * 10 ** -3);
  const aggregatedCapacityMw = Math.round(aggregatedCapacityKw * 10 ** -3);
  if (aggregatedCapacity <= 50) {
    return CapacityRange.Between_0_50_w;
  } else if (aggregatedCapacity > 50 && aggregatedCapacity <= 500) {
    return CapacityRange.Between_51_500_w;
  } else if (aggregatedCapacity > 501 && aggregatedCapacityKw <= 1) {
    return CapacityRange.Between_501w_1kw;
  } else if (aggregatedCapacityKw > 1 && aggregatedCapacityKw <= 50) {
    return CapacityRange.Between_1kw_50kw;
  } else if (aggregatedCapacityKw > 50 && aggregatedCapacityKw <= 100) {
    return CapacityRange.Between_50kw_100kw;
  } else if (aggregatedCapacityKw > 100 && aggregatedCapacityMw <= 1) {
    return CapacityRange.Between_101kw_1mw;
  } else if (aggregatedCapacityMw > 1) {
    return CapacityRange.Above_1mw;
  } else {
    return CapacityRange.Above_1mw;
  }
};
