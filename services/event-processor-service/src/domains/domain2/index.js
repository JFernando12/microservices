export const processEventDomain2 = async (message) => {
  const waitPeriod = Number(message.Body) === NaN ? 1000 : Number(message.Body);

  console.log(`${message.MessageId} - Working for ${waitPeriod} milliseconds`);

  await new Promise(function (done) {
    setTimeout(done, waitPeriod);
  });

  console.log(`${message.MessageId} - Done`);
}
