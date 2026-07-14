import { z } from 'zod';

export const periodDecisionSchema = z.object({
  statut: z.enum(['validee', 'rejetee']),
  reason: z.string().max(2000).optional().nullable(),
});

/** Body for decide / approve / reject / return / cancel (optional reason). */
export const reviewDecisionBodySchema = z.object({
  statut: z.enum(['validee', 'rejetee', 'annulee']).optional(),
  reason: z.string().max(2000).optional().nullable(),
});
