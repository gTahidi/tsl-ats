import { prisma } from './src/utils/db/prisma'

async function main() {
  const jobs = await prisma.jobPosting.findMany()
  console.log(JSON.stringify(jobs, null, 2))
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
