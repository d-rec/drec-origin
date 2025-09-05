import {
  recoverTypedSignature,
  SignTypedDataVersion,
  TypedMessage,
} from '@metamask/eth-sig-util';

type TextInformationTypes = {
  EIP712Domain: { name: string; type: string }[];
  TextInformation: { name: string; type: string }[];
};

const getData = (text: string): TypedMessage<TextInformationTypes> => {
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
  return recoverTypedSignature({
    data: getData(text),
    signature: signedMessage,
    version: SignTypedDataVersion.V4,
  });
}
