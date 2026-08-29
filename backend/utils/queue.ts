import { Queue } from 'bullmq';

export const deployQueue = new Queue('deploy-queue', {
  connection: {
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: null,
  },
});

