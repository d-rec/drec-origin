import ethSigUtil from 'eth-sig-util';

type EIP712TypedData = any;

const getData = (text: string): EIP712TypedData => {
  return {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
      ],
      TextInformation: [{ name: 'text', type: 'string' }],
    },
    domain: {
      name: 'Origin',
      version: '2',
    },
    primaryType: 'TextInformation',
    message: {
      text,
    },
  };
};

export async function recoverTypedSignatureAddress(
  text: string,
  signedMessage: string,
) {
  return ethSigUtil.recoverTypedSignature({
    sig: signedMessage,
    data: getData(text),
  });
}
