import { z } from 'zod';

export const periodDecisionSchema = z.object({
  statut: z.enum(['validee', 'rejetee']),
});
