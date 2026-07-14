import { z } from 'zod';

const timeRe = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

/** Accept FE aliases (panier_repas, latitude_debut, …) and internal names. */
export const periodCreateSchema = z
  .object({
    user_id: z.string().uuid().optional(),
    chantier_id: z.string().uuid(),
    date: z.string().min(8),
    heure_debut: z.string().regex(timeRe),
    heure_fin: z.string().regex(timeRe).optional().nullable(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    latitude_debut: z.number().optional().nullable(),
    longitude_debut: z.number().optional().nullable(),
    latitude_fin: z.number().optional().nullable(),
    longitude_fin: z.number().optional().nullable(),
    panier: z.boolean().optional(),
    panier_repas: z.boolean().optional(),
    deplacement: z.boolean().optional(),
    from_suggestion: z.boolean().optional(),
    commentaire: z.string().optional().nullable(),
    statut: z.enum(['en_cours', 'terminee', 'validee', 'rejetee']).optional(),
  })
  .passthrough();

export const periodUpdateSchema = periodCreateSchema.partial().extend({
  statut: z.enum(['en_cours', 'terminee', 'validee', 'rejetee']).optional(),
});

export const decideSchema = z.object({
  statut: z.enum(['validee', 'rejetee', 'annulee']),
});
