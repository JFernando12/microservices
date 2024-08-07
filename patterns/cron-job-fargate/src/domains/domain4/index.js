export const processJobDomain4 = async () => {
  console.log('Processing domain4 job...');
  await new Promise((resolve) => setTimeout(resolve, 20000));
  console.log('Domain4 job completed successfully');
}