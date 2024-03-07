import { CapacityRange } from './enums';
import { getCapacityRange } from './get-capacity-range';

describe('getCapacityRange function', () => {
    it('capacityRange', async()=> {
        const capacityRange1 = getCapacityRange(1500);
        const capacityRange2 = getCapacityRange(2300000);
        const capacityRange3 = getCapacityRange(150);
        const capacityRange4 = getCapacityRange(15);
        const capacityRange5 = getCapacityRange(1);

        expect(capacityRange1).toEqual(CapacityRange.fourthRange);
        expect(capacityRange2).toEqual(CapacityRange.fifthRange);
        expect(capacityRange3).toEqual(CapacityRange.thirdRange);
        expect(capacityRange4).toEqual(CapacityRange.secondRange);
        expect(capacityRange5).toEqual(CapacityRange.firstRange);
    });
});
