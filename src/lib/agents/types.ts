import type { PlanningContext } from "@/lib/types";

export type PlannerAgent = {
  name: string;
  label: string;
  execute(context: PlanningContext): Promise<PlanningContext>;
};

export function assertContext<T>(
  value: T | undefined | null,
  message: string
): T {
  if (value === undefined || value === null) {
    throw new Error(message);
  }

  return value;
}
