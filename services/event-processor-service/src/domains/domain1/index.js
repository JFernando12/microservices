export const proccessEventDomain1 = async (message, deleteMessage) => {
  console.log(`${message.MessageId} - Received`);

  const waitPeriod = Number(message.Body) === NaN ? 1000 : Number(message.Body);

  console.log(`${message.MessageId} - Working for ${waitPeriod} milliseconds`);

  await new Promise(function (done) {
    setTimeout(done, waitPeriod);
  });

  await deleteMessage(message.ReceiptHandle);
  console.log(`${message.MessageId} - Done`);
}
