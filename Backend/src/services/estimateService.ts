import prisma from '../db/prisma.js';

export async function upsertEstimate(
  taskId: string,
  participantId: string,
  estimate: string
): Promise<void> {
  await prisma.estimate.upsert({
    where: {
      taskId_participantId: {
        taskId,
        participantId
      }
    },
    create: {
      taskId,
      participantId,
      estimate
    },
    update: {
      estimate
    }
  });
}

export async function deleteEstimatesByTask(taskId: string): Promise<void> {
  await prisma.estimate.deleteMany({
    where: { taskId }
  });
}

export async function deleteEstimate(taskId: string, participantId: string): Promise<void> {
  await prisma.estimate.delete({
    where: {
      taskId_participantId: {
        taskId,
        participantId
      }
    }
  });
}

