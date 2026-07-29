-- Ensure UPDATE events carry full row data (SSE / logical replication friendly).
ALTER TABLE public.declarations_heures REPLICA IDENTITY FULL;
ALTER TABLE public.periodes_travail REPLICA IDENTITY FULL;
