import { NODE_ENV } from "./config/envs.js";
import { microservices } from "./config/microservices.js";
import { pollEvents } from "./events/poll-events.js";


const main = async () => {
  if (NODE_ENV === 'development') {
    console.log('Running in development mode');
    const microservice = microservices.find((microservice) => microservice.development);
    if (microservice) await microservice.fn(microservice.devData);
    return;
  }

  setImmediate(pollEvents);
}

main();