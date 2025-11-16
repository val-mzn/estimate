import prisma from '../db/prisma.js';
import { Task } from '../types.js';

export async function createTask(
  id: string,
  title: string,
  description: string | null,
  roomCode: string
): Promise<Task> {
  const task = await prisma.task.create({
    data: {
      id,
      title,
      description,
      roomCode
    },
    include: {
      estimates: true
    }
  });

  const estimatesMap = new Map<string, string>();
  for (const e of task.estimates) {
    estimatesMap.set(e.participantId, e.estimate);
  }

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    createdAt: task.createdAt,
    estimates: estimatesMap,
    finalEstimate: task.finalEstimate ? (task.finalEstimate === '?' ? '?' : Number(task.finalEstimate)) : null
  };
}

export async function getTask(taskId: string): Promise<Task | null> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      estimates: true
    }
  });

  if (!task) return null;

  const estimatesMap = new Map<string, string>();
  for (const e of task.estimates) {
    estimatesMap.set(e.participantId, e.estimate);
  }

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    createdAt: task.createdAt,
    estimates: estimatesMap,
    finalEstimate: task.finalEstimate ? (task.finalEstimate === '?' ? '?' : Number(task.finalEstimate)) : null
  };
}

export async function updateTask(
  taskId: string,
  data: {
    finalEstimate?: number | '?' | null;
  }
): Promise<void> {
  await prisma.task.update({
    where: { id: taskId },
    data: {
      finalEstimate: data.finalEstimate !== undefined 
        ? (data.finalEstimate === null ? null : data.finalEstimate === '?' ? '?' : String(data.finalEstimate))
        : undefined
    }
  });
}

export async function deleteTask(taskId: string): Promise<void> {
  await prisma.task.delete({
    where: { id: taskId }
  });
}

export async function getTasksByRoom(roomCode: string): Promise<Task[]> {
  const tasks = await prisma.task.findMany({
    where: { roomCode },
    include: {
      estimates: true
    },
    orderBy: { createdAt: 'asc' }
  });

  return tasks.map(task => {
    const estimatesMap = new Map<string, string>();
    for (const e of task.estimates) {
      estimatesMap.set(e.participantId, e.estimate);
    }
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      createdAt: task.createdAt,
      estimates: estimatesMap,
      finalEstimate: task.finalEstimate ? (task.finalEstimate === '?' ? '?' : Number(task.finalEstimate)) : null
    };
  });
}

