export const processEventDomain1 = async (message) => {
  console.log('Domain 2 processing message:', message);

  const waitPeriod = Number(message) === NaN ? 1000 : Number(message);

  console.log(`${message} - Working for ${waitPeriod} milliseconds`);

  await new Promise(function (done) {
    setTimeout(done, waitPeriod);
  });

  console.log(`${message.MessageId} - Done`);
}
