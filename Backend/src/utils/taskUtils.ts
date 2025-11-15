import { Task } from '../types.js';

export function createTask(title: string, description?: string): Task {
  return {
    id: Date.now().toString(),
    title,
    description: description || null,
    createdAt: new Date(),
    estimates: new Map<string, string>(),
    finalEstimate: null
  };
}

