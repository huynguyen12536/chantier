import { z } from 'zod';

const timeRe = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export const periodCreateSchema = z.object({
  user_id: z.string().uuid().optional(),
  chantier_id: z.string().uuid(),
  date: z.string().min(8),
  heure_debut: z.string().regex(timeRe),
  heure_fin: z.string().regex(timeRe).optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  panier: z.boolean().optional(),
  deplacement: z.boolean().optional(),
  from_suggestion: z.boolean().optional(),
  statut: z.enum(['en_cours', 'terminee', 'validee', 'rejetee']).optional(),
});

export const periodUpdateSchema = periodCreateSchema.partial().extend({
  statut: z.enum(['en_cours', 'terminee', 'validee', 'rejetee']).optional(),
});

export const decideSchema = z.object({
  statut: z.enum(['validee', 'rejetee', 'annulee']),
});
