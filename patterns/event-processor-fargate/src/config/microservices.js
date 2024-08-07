import { processChallenges } from '../microservices/index.js';

export const microservices = [
  {
    domain: 'process-challenges',
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 20,
    VisibilityTimeout: 60 * 60,
    fn: processChallenges,
    development: true,
    devData: [
      '298965f3-e25b-4728-af47-638aed2e0cf4',
      '2dea7196-9a0e-418a-94d7-ccabe251684c',
      '44c54e30-88f7-4f78-8e35-13a4c260a19b',
      '03ccbbbc-ad01-4379-8921-812c5969e4e1',
      '210b1eb6-344d-417c-af90-bdfa804bb9f4',
    ],
  },
];
