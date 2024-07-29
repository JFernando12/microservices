import { processJobDomain3 } from './domain3/index.js';
import { processJobDomain4 } from './domain4/index.js';

const domainsConfig = [
  {
    domain: 'domain3',
    fn: processJobDomain3,
  },
  {
    domain: 'domain4',
    fn: processJobDomain4,
  },
];

export const processJob = async (currentDomain) => {
  const domain = domainsConfig.find((d) => d.domain === currentDomain);

  if (!domain) {
    throw new Error('Invalid domain');
  }

  await domain.fn();
}