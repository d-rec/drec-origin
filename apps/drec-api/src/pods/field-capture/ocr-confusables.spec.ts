import {
  ocrShapeKey,
  boundedEditDistance,
  rankSerialCandidates,
} from './ocr-confusables';

describe('ocrShapeKey', () => {
  it('folds the glyph pairs a camera cannot distinguish', () => {
    expect(ocrShapeKey('ABC0123')).toBe(ocrShapeKey('ABCO1Z3'));
    expect(ocrShapeKey('SN-8B51')).toBe(ocrShapeKey('SN-B851'));
    expect(ocrShapeKey('ill1I')).toBe('11111');
  });

  it('ignores separators and case', () => {
    expect(ocrShapeKey(' sn_44-71.a ')).toBe(ocrShapeKey('SN4471A'));
  });

  it('keeps genuinely different serials apart', () => {
    expect(ocrShapeKey('ABC123')).not.toBe(ocrShapeKey('ABC124'));
  });
});

describe('boundedEditDistance', () => {
  it('returns the real distance below the cap', () => {
    expect(boundedEditDistance('abc', 'abc', 2)).toBe(0);
    expect(boundedEditDistance('abc', 'abd', 2)).toBe(1);
    expect(boundedEditDistance('abc', 'axd', 2)).toBe(2);
  });

  it('bails out past the cap rather than computing the true distance', () => {
    expect(boundedEditDistance('abcdef', 'uvwxyz', 2)).toBe(3);
    expect(boundedEditDistance('a', 'abcdefgh', 2)).toBe(3);
  });
});

describe('rankSerialCandidates', () => {
  const known = [
    {
      id: 1,
      serialNumber: 'SN-4471B',
      externalId: 'EXT-1',
      siteName: 'Jalil A',
    },
    {
      id: 2,
      serialNumber: 'SN-9900',
      externalId: 'EXT-2',
      siteName: 'Jalil B',
    },
    { id: 3, serialNumber: null, externalId: 'EXT-3', siteName: 'Jalil C' },
  ];

  it('calls a confusable-only difference an exact match', () => {
    const [match] = rankSerialCandidates('SN-447I8', known);
    expect(match).toMatchObject({ deviceId: 1, kind: 'exact', distance: 0 });
  });

  it('offers a near match when one real character differs', () => {
    const [match] = rankSerialCandidates('SN-4472B', known);
    expect(match).toMatchObject({ deviceId: 1, kind: 'near' });
    expect(match.distance).toBe(1);
  });

  it('returns nothing for a serial we do not hold — the useful signal', () => {
    expect(rankSerialCandidates('XYZ-0001', known)).toEqual([]);
  });

  it('matches on externalId when the serial is missing', () => {
    const [match] = rankSerialCandidates('EXT3', known);
    expect(match?.deviceId).toBe(3);
  });

  it('ranks closer candidates first', () => {
    const matches = rankSerialCandidates('SN-9901', known);
    expect(matches[0].deviceId).toBe(2);
  });

  it('handles an empty scan without throwing', () => {
    expect(rankSerialCandidates('', known)).toEqual([]);
    expect(rankSerialCandidates('   ', known)).toEqual([]);
  });
});
