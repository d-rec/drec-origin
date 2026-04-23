import {
  validateBlockchainEnv,
  assertValidBlockchainEnv,
} from './validate-blockchain-env';

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const REAL_ADDRESS = '0xffcf8fdee72ac11b5c542428b35eef5769c409f0';

describe('validateBlockchainEnv', () => {
  it('returns no violations for fully-set real addresses', () => {
    const { violations } = validateBlockchainEnv({
      DREC_BLOCKCHAIN_ADDRESS: REAL_ADDRESS,
      REACT_APP_ISSUER_ADDRESS: REAL_ADDRESS,
    });
    expect(violations).toHaveLength(0);
  });

  it('treats unset / empty vars as OK (local dev case)', () => {
    const { violations } = validateBlockchainEnv({});
    expect(violations).toHaveLength(0);
  });

  it('flags the null address on DREC_BLOCKCHAIN_ADDRESS', () => {
    const { violations } = validateBlockchainEnv({
      DREC_BLOCKCHAIN_ADDRESS: NULL_ADDRESS,
      REACT_APP_ISSUER_ADDRESS: REAL_ADDRESS,
    });
    expect(violations).toEqual([
      { name: 'DREC_BLOCKCHAIN_ADDRESS', value: NULL_ADDRESS },
    ]);
  });

  it('flags the null address regardless of casing or leading whitespace', () => {
    const { violations } = validateBlockchainEnv({
      DREC_BLOCKCHAIN_ADDRESS: '  0x0000000000000000000000000000000000000000  ',
      REACT_APP_ISSUER_ADDRESS: '0x0000000000000000000000000000000000000000',
    });
    expect(violations).toHaveLength(2);
  });

  it('does not flag other all-hex values', () => {
    // Real-looking addresses that happen to have many zeros should still pass.
    const { violations } = validateBlockchainEnv({
      DREC_BLOCKCHAIN_ADDRESS: '0x1000000000000000000000000000000000000000',
    });
    expect(violations).toHaveLength(0);
  });
});

describe('assertValidBlockchainEnv', () => {
  it('throws and includes both env var name and value when violated', () => {
    expect(() =>
      assertValidBlockchainEnv({
        DREC_BLOCKCHAIN_ADDRESS: NULL_ADDRESS,
      }),
    ).toThrow(/DREC_BLOCKCHAIN_ADDRESS/);
    expect(() =>
      assertValidBlockchainEnv({
        DREC_BLOCKCHAIN_ADDRESS: NULL_ADDRESS,
      }),
    ).toThrow(/0x0000000000000000000000000000000000000000/);
  });

  it('does not throw for a clean env', () => {
    expect(() =>
      assertValidBlockchainEnv({
        DREC_BLOCKCHAIN_ADDRESS: REAL_ADDRESS,
        REACT_APP_ISSUER_ADDRESS: REAL_ADDRESS,
      }),
    ).not.toThrow();
  });
});
