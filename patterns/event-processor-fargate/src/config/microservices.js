import { processChallenges } from "../microservices/index.js";

export const microservices = [
  {
    domain: 'process-challenges',
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 20,
    VisibilityTimeout: 60 * 60,
    fn: processChallenges,
  },
];