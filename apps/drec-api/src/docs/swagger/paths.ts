const paths: {
  endpoint: string;
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  summary: string;
  description: string;
  tag?: string;
}[] = [
  {
    endpoint: '/api/blockchain-properties',
    method: 'get',
    summary: 'Properties',
    description:
      'Returns the blockchain properties including issuer details and registry information.',
    tag: 'Blockchain Properties',
  },
];

export default paths;
