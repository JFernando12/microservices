import { NODE_ENV } from "./config/envs.js";
import { microservices } from "./config/microservices.js";
import { client } from "./db/mongodb.js";
import { pollEvents } from "./events/poll-events.js";


const main = async () => {
  console.log('Starting event processor...');
  await client.connect();
  console.log('Connected to MongoDB');

  if (NODE_ENV === 'development') {
    console.log('Running in development mode');
    const microservice = microservices.find((microservice) => microservice.development);
    if (microservice) await microservice.fn(microservice.devData);
  } else {
    console.log('Running in production mode');
    await pollEvents();
  }

  await client.close();
}

main().then(() => {
  console.log('Event processor finished');
}).catch((error) => {
  console.error('Event processor failed:', error);
});