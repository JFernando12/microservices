export const processJobDomain3 = async () => {
  console.log('Processing domain3 job...');
  await new Promise((resolve) => setTimeout(resolve, 20000));
  console.log('Domain3 job completed successfully');
}