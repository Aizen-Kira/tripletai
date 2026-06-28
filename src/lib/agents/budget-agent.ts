import type { BudgetPlan } from "@/lib/types";
import { assertContext, type PlannerAgent } from "@/lib/agents/types";

export const budgetAgent: PlannerAgent = {
  name: "budget",
  label: "Budget Agent",
  async execute(context) {
    const intent = assertContext(context.structuredIntent, "Budget Agent requires structured intent.");
    const stopCount = intent.duration === "full-day" ? 4 : intent.duration === "2-3 hours" ? 2 : 3;
    const budget = intent.budget;
    const buffer = Math.max(Math.round(budget * 0.12), 3);
    const spendable = Math.max(budget - buffer, 0);
    const perStopTarget = Math.max(Math.floor(spendable / stopCount), 0);

    const baseCategories = ["Coffee", "Culture", "Food", "Flex stop"].slice(0, stopCount);
    const allocations = baseCategories.map((category, index) => ({
      category,
      amount:
        index === 0
          ? Math.min(6, perStopTarget)
          : index === 1
            ? Math.min(Math.max(perStopTarget + 3, 0), spendable)
            : perStopTarget,
      note: `${category} target for a ${intent.energy}-energy ${intent.duration} outing.`
    }));

    const used = allocations.reduce((sum, allocation) => sum + allocation.amount, 0);
    const plan: BudgetPlan = {
      allocations,
      remainingBudget: Math.max(budget - used, 0),
      perStopTarget,
      currency: context.input.budget.currency
    };

    return {
      ...context,
      budgetPlan: plan
    };
  }
};
