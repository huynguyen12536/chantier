--
-- PostgreSQL database dump
--

\restrict WO2g6HhpUEzXz6WvMcP6ct2fQfFEoke7L77VkpNrHcaYtWf2Wmzz2Frsd0lP2iY

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: auto_approve_if_matches_latest_validated_shift(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_approve_if_matches_latest_validated_shift() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$DECLARE
v_current_count       int;
v_current_heure_debut time;
v_current_heure_fin   time;
v_current_panier      boolean;
v_current_deplacement boolean;

v_prev_chantier       uuid;
v_prev_heure_debut    time;
v_prev_heure_fin      time;
v_prev_panier         boolean;
v_prev_deplacement    boolean;
BEGIN
-- Only evaluate pending declarations.
IF NEW.statut <> 'soumise' THEN
RETURN NEW;
END IF;

-- Current declaration must represent exactly one active period with valid times.
SELECT
COUNT(*),
MIN(p.heure_debut),
MIN(p.heure_fin),
BOOL_AND(COALESCE(p.panier_repas, false)),
BOOL_AND(COALESCE(p.deplacement, false))
INTO
v_current_count,
v_current_heure_debut,
v_current_heure_fin,
v_current_panier,
v_current_deplacement
FROM public.periodes_travail p
WHERE p.user_id    = NEW.user_id
AND p.chantier_id = NEW.chantier_id
AND p.date        = NEW.date
AND p.statut     <> 'rejetee';

IF v_current_count <> 1 OR v_current_heure_debut IS NULL OR v_current_heure_fin IS NULL THEN
RETURN NEW;
END IF;

-- Find the worker's most recent previously validated period
-- (strictly before this date, or same date but different shift).
SELECT
p.chantier_id,
p.heure_debut,
p.heure_fin,
COALESCE(p.panier_repas, false),
COALESCE(p.deplacement, false)
INTO
v_prev_chantier,
v_prev_heure_debut,
v_prev_heure_fin,
v_prev_panier,
v_prev_deplacement
FROM public.periodes_travail p
WHERE p.user_id = NEW.user_id
AND p.statut  = 'validee'
AND (
p.date < NEW.date
OR (p.date = NEW.date AND (p.chantier_id <> NEW.chantier_id OR p.heure_debut <> v_current_heure_debut))
)
ORDER BY p.date DESC, p.heure_debut DESC
LIMIT 1;

-- No prior validated shift — cannot auto-approve.
IF v_prev_chantier IS NULL THEN
RETURN NEW;
END IF;

-- Exact match required: same worksite, same hours, same allowances.
IF v_prev_chantier       = NEW.chantier_id
AND v_prev_heure_debut = v_current_heure_debut
AND v_prev_heure_fin   = v_current_heure_fin
AND v_prev_panier      = COALESCE(v_current_panier, false)
AND v_prev_deplacement = COALESCE(v_current_deplacement, false) THEN

UPDATE public.declarations_heures
SET
statut       = 'validee',
validated_at = NOW(),
updated_at   = NOW()
WHERE id     = NEW.id
AND statut = 'soumise';

END IF;

RETURN NEW;
END;$$;


--
-- Name: calculer_duree_periode(time without time zone, time without time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculer_duree_periode(heure_debut time without time zone, heure_fin time without time zone) RETURNS numeric
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
  IF heure_fin IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calcul de la différence en heures (avec décimales)
  RETURN EXTRACT(EPOCH FROM (heure_fin - heure_debut)) / 3600.0;
END;
$$;


--
-- Name: delete_chantier_cascade(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_chantier_cascade(p_chantier_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$BEGIN
-- Verify caller is admin
IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'admin' THEN
RAISE EXCEPTION 'Accès refusé';
END IF;

DELETE FROM zones_chantiers WHERE chantier_id = p_chantier_id;
DELETE FROM affectations_chantiers WHERE chantier_id = p_chantier_id;
DELETE FROM periodes_travail WHERE chantier_id = p_chantier_id;
DELETE FROM declarations_heures WHERE chantier_id = p_chantier_id;
DELETE FROM chantiers WHERE id = p_chantier_id;
END;$$;


--
-- Name: get_chef_chantier_ids(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_chef_chantier_ids(chef_id uuid) RETURNS TABLE(chantier_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ac.chantier_id
  FROM public.affectations_chantiers ac
  WHERE ac.user_id = chef_id
    AND ac.date_fin IS NULL;
END;
$$;


--
-- Name: get_my_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_my_role() RETURNS text
    LANGUAGE sql SECURITY DEFINER
    AS $$SELECT role FROM public.profiles WHERE id = auth.uid();$$;


--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    AS $$SELECT EXISTS (
SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
);$$;


--
-- Name: is_zone_owner(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_zone_owner(p_zone_id uuid) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    AS $$SELECT EXISTS (
SELECT 1 FROM zones_equipe
WHERE id = p_zone_id
AND chef_equipe_id = auth.uid()
);$$;


--
-- Name: rls_auto_enable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


--
-- Name: sync_declarations_from_periods(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_declarations_from_periods() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$DECLARE
v_user_id    uuid;
v_chantier   uuid;
v_date       date;
v_count      int;
BEGIN
v_user_id  := COALESCE(NEW.user_id,    OLD.user_id);
v_chantier := COALESCE(NEW.chantier_id, OLD.chantier_id);
v_date     := COALESCE(NEW.date,        OLD.date);

SELECT COUNT(*) INTO v_count
FROM periodes_travail
WHERE user_id    = v_user_id
AND chantier_id = v_chantier
AND date        = v_date
AND statut     != 'rejetee';

IF v_count = 0 THEN
DELETE FROM declarations_heures
WHERE user_id    = v_user_id
AND chantier_id = v_chantier
AND date        = v_date;
ELSE
INSERT INTO declarations_heures (
user_id,
chantier_id,
date,
heures_normales,
heures_supplementaires,
nb_paniers,
statut,
from_suggestion,
updated_at
)
SELECT
s.user_id,
s.chantier_id,
s.date,
s.heures_normales,
s.heures_supplementaires,
s.nb_paniers,
s.statut,
-- true if any active period in this group came from a suggestion
EXISTS (
SELECT 1 FROM periodes_travail p2
WHERE p2.user_id    = v_user_id
AND p2.chantier_id = v_chantier
AND p2.date        = v_date
AND p2.from_suggestion = true
AND p2.statut     != 'rejetee'
),
NOW()
FROM synthese_heures_journalieres s
WHERE s.user_id    = v_user_id
AND s.chantier_id = v_chantier
AND s.date        = v_date
ON CONFLICT (user_id, chantier_id, date)
DO UPDATE SET
heures_normales        = EXCLUDED.heures_normales,
heures_supplementaires = EXCLUDED.heures_supplementaires,
nb_paniers             = EXCLUDED.nb_paniers,
statut                 = EXCLUDED.statut,
from_suggestion        = EXCLUDED.from_suggestion,
updated_at             = NOW();
END IF;

RETURN COALESCE(NEW, OLD);
END;$$;


--
-- Name: sync_periods_from_declaration(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_periods_from_declaration() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$BEGIN
IF NEW.statut IN ('validee', 'rejetee')
AND (OLD.statut IS NULL OR OLD.statut IS DISTINCT FROM NEW.statut) THEN
UPDATE periodes_travail
SET
statut       = NEW.statut,
validated_by = NEW.validated_by,
validated_at = NEW.validated_at,
updated_at   = NOW()
WHERE user_id    = NEW.user_id
AND chantier_id = NEW.chantier_id
AND date        = NEW.date
AND statut IN ('terminee', 'en_cours');
END IF;
RETURN NEW;
END;$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: affectations_chantiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.affectations_chantiers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    chantier_id uuid NOT NULL,
    chef_equipe_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    date_debut date DEFAULT CURRENT_DATE NOT NULL,
    date_fin date,
    CONSTRAINT valid_affectation_date_range CHECK (((date_fin IS NULL) OR (date_fin >= date_debut)))
);


--
-- Name: chantiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chantiers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nom text NOT NULL,
    code text NOT NULL,
    adresse text NOT NULL,
    actif boolean DEFAULT true,
    date_debut date DEFAULT CURRENT_DATE NOT NULL,
    date_fin date,
    created_at timestamp with time zone DEFAULT now(),
    heure_debut time without time zone,
    heure_fin time without time zone
);


--
-- Name: declarations_heures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.declarations_heures (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    chantier_id uuid NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    heures_normales numeric(4,2) DEFAULT 0,
    heures_supplementaires numeric(4,2) DEFAULT 0,
    nb_paniers integer DEFAULT 0,
    statut text DEFAULT 'brouillon'::text,
    commentaire text,
    validated_by uuid,
    validated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    nb_deplacements integer DEFAULT 0,
    from_suggestion boolean DEFAULT false NOT NULL,
    CONSTRAINT declarations_heures_heures_normales_check CHECK (((heures_normales >= (0)::numeric) AND (heures_normales <= (24)::numeric))),
    CONSTRAINT declarations_heures_heures_supplementaires_check CHECK (((heures_supplementaires >= (0)::numeric) AND (heures_supplementaires <= (24)::numeric))),
    CONSTRAINT declarations_heures_nb_paniers_check CHECK (((nb_paniers >= 0) AND (nb_paniers <= 2))),
    CONSTRAINT declarations_heures_statut_check CHECK ((statut = ANY (ARRAY['brouillon'::text, 'soumise'::text, 'validee'::text, 'rejetee'::text, 'annulee'::text])))
);


--
-- Name: periodes_travail; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.periodes_travail (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    chantier_id uuid NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    heure_debut time without time zone NOT NULL,
    heure_fin time without time zone,
    latitude_debut numeric(10,8) NOT NULL,
    longitude_debut numeric(11,8) NOT NULL,
    latitude_fin numeric(10,8),
    longitude_fin numeric(11,8),
    statut text DEFAULT 'en_cours'::text,
    commentaire text,
    validated_by uuid,
    validated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    panier_repas boolean DEFAULT false,
    deplacement boolean DEFAULT false,
    from_suggestion boolean DEFAULT false NOT NULL,
    CONSTRAINT periodes_travail_check CHECK ((((heure_fin IS NULL) AND (statut = 'en_cours'::text)) OR ((heure_fin IS NOT NULL) AND (statut <> 'en_cours'::text)))),
    CONSTRAINT periodes_travail_check1 CHECK ((((latitude_fin IS NULL) AND (longitude_fin IS NULL) AND (heure_fin IS NULL)) OR ((latitude_fin IS NOT NULL) AND (longitude_fin IS NOT NULL) AND (heure_fin IS NOT NULL)))),
    CONSTRAINT periodes_travail_statut_check CHECK ((statut = ANY (ARRAY['en_cours'::text, 'terminee'::text, 'validee'::text, 'rejetee'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    nom text NOT NULL,
    prenom text NOT NULL,
    matricule text DEFAULT ''::text,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    phone text DEFAULT ''::text,
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['ouvrier'::text, 'chef_equipe'::text, 'administratif'::text, 'admin'::text])))
);


--
-- Name: synthese_heures_journalieres; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.synthese_heures_journalieres AS
 SELECT user_id,
    chantier_id,
    date,
    sum(public.calculer_duree_periode(heure_debut, heure_fin)) AS total_heures,
    LEAST(sum(public.calculer_duree_periode(heure_debut, heure_fin)), 7.0) AS heures_normales,
    GREATEST((sum(public.calculer_duree_periode(heure_debut, heure_fin)) - 7.0), 0.0) AS heures_supplementaires,
        CASE
            WHEN bool_or(panier_repas) THEN 1
            ELSE 0
        END AS nb_paniers,
        CASE
            WHEN bool_or(deplacement) THEN 1
            ELSE 0
        END AS nb_deplacements,
        CASE
            WHEN bool_and((statut = 'validee'::text)) THEN 'validee'::text
            WHEN bool_or((statut = 'en_cours'::text)) THEN 'brouillon'::text
            ELSE 'soumise'::text
        END AS statut,
    max(updated_at) AS updated_at
   FROM public.periodes_travail
  WHERE (statut <> 'rejetee'::text)
  GROUP BY user_id, chantier_id, date;


--
-- Name: zones_chantiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zones_chantiers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    zone_id uuid NOT NULL,
    chantier_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: zones_equipe; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zones_equipe (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chef_equipe_id uuid NOT NULL,
    nom text DEFAULT ''::text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: zones_ouvriers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zones_ouvriers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    zone_id uuid NOT NULL,
    user_id uuid NOT NULL,
    date_debut date DEFAULT CURRENT_DATE NOT NULL,
    date_fin date,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: affectations_chantiers affectations_chantiers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations_chantiers
    ADD CONSTRAINT affectations_chantiers_pkey PRIMARY KEY (id);


--
-- Name: affectations_chantiers affectations_chantiers_user_id_chantier_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations_chantiers
    ADD CONSTRAINT affectations_chantiers_user_id_chantier_id_key UNIQUE (user_id, chantier_id);


--
-- Name: chantiers chantiers_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chantiers
    ADD CONSTRAINT chantiers_code_key UNIQUE (code);


--
-- Name: chantiers chantiers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chantiers
    ADD CONSTRAINT chantiers_pkey PRIMARY KEY (id);


--
-- Name: declarations_heures declarations_heures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.declarations_heures
    ADD CONSTRAINT declarations_heures_pkey PRIMARY KEY (id);


--
-- Name: declarations_heures declarations_heures_user_id_chantier_id_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.declarations_heures
    ADD CONSTRAINT declarations_heures_user_id_chantier_id_date_key UNIQUE (user_id, chantier_id, date);


--
-- Name: periodes_travail periodes_travail_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.periodes_travail
    ADD CONSTRAINT periodes_travail_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_matricule_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_matricule_key UNIQUE (matricule);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: zones_chantiers zones_chantiers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zones_chantiers
    ADD CONSTRAINT zones_chantiers_pkey PRIMARY KEY (id);


--
-- Name: zones_chantiers zones_chantiers_zone_id_chantier_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zones_chantiers
    ADD CONSTRAINT zones_chantiers_zone_id_chantier_id_key UNIQUE (zone_id, chantier_id);


--
-- Name: zones_equipe zones_equipe_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zones_equipe
    ADD CONSTRAINT zones_equipe_pkey PRIMARY KEY (id);


--
-- Name: zones_ouvriers zones_ouvriers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zones_ouvriers
    ADD CONSTRAINT zones_ouvriers_pkey PRIMARY KEY (id);


--
-- Name: idx_affectations_chantier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_affectations_chantier ON public.affectations_chantiers USING btree (chantier_id);


--
-- Name: idx_affectations_chef; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_affectations_chef ON public.affectations_chantiers USING btree (chef_equipe_id);


--
-- Name: idx_affectations_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_affectations_dates ON public.affectations_chantiers USING btree (user_id, date_debut, date_fin);


--
-- Name: idx_affectations_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_affectations_user ON public.affectations_chantiers USING btree (user_id);


--
-- Name: idx_chantiers_actif; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chantiers_actif ON public.chantiers USING btree (actif);


--
-- Name: idx_chantiers_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chantiers_code ON public.chantiers USING btree (code);


--
-- Name: idx_declarations_chantier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_declarations_chantier ON public.declarations_heures USING btree (chantier_id);


--
-- Name: idx_declarations_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_declarations_date ON public.declarations_heures USING btree (date);


--
-- Name: idx_declarations_statut; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_declarations_statut ON public.declarations_heures USING btree (statut);


--
-- Name: idx_declarations_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_declarations_user ON public.declarations_heures USING btree (user_id);


--
-- Name: idx_periodes_chantier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_periodes_chantier ON public.periodes_travail USING btree (chantier_id);


--
-- Name: idx_periodes_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_periodes_date ON public.periodes_travail USING btree (date);


--
-- Name: idx_periodes_statut; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_periodes_statut ON public.periodes_travail USING btree (statut);


--
-- Name: idx_periodes_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_periodes_user_date ON public.periodes_travail USING btree (user_id, date);


--
-- Name: idx_profiles_matricule; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_matricule ON public.profiles USING btree (matricule);


--
-- Name: idx_profiles_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);


--
-- Name: declarations_heures trigger_auto_approve_matching_latest_validated_shift; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_auto_approve_matching_latest_validated_shift AFTER INSERT OR UPDATE ON public.declarations_heures FOR EACH ROW EXECUTE FUNCTION public.auto_approve_if_matches_latest_validated_shift();


--
-- Name: periodes_travail trigger_sync_declarations; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_sync_declarations AFTER INSERT OR DELETE OR UPDATE ON public.periodes_travail FOR EACH ROW EXECUTE FUNCTION public.sync_declarations_from_periods();


--
-- Name: declarations_heures trigger_sync_periods_from_declaration; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_sync_periods_from_declaration AFTER UPDATE OF statut, validated_by, validated_at ON public.declarations_heures FOR EACH ROW EXECUTE FUNCTION public.sync_periods_from_declaration();


--
-- Name: affectations_chantiers affectations_chantiers_chantier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations_chantiers
    ADD CONSTRAINT affectations_chantiers_chantier_id_fkey FOREIGN KEY (chantier_id) REFERENCES public.chantiers(id) ON DELETE CASCADE;


--
-- Name: affectations_chantiers affectations_chantiers_chef_equipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations_chantiers
    ADD CONSTRAINT affectations_chantiers_chef_equipe_id_fkey FOREIGN KEY (chef_equipe_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: affectations_chantiers affectations_chantiers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations_chantiers
    ADD CONSTRAINT affectations_chantiers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: declarations_heures declarations_heures_chantier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.declarations_heures
    ADD CONSTRAINT declarations_heures_chantier_id_fkey FOREIGN KEY (chantier_id) REFERENCES public.chantiers(id) ON DELETE CASCADE;


--
-- Name: declarations_heures declarations_heures_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.declarations_heures
    ADD CONSTRAINT declarations_heures_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: declarations_heures declarations_heures_validated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.declarations_heures
    ADD CONSTRAINT declarations_heures_validated_by_fkey FOREIGN KEY (validated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: periodes_travail periodes_travail_chantier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.periodes_travail
    ADD CONSTRAINT periodes_travail_chantier_id_fkey FOREIGN KEY (chantier_id) REFERENCES public.chantiers(id) ON DELETE CASCADE;


--
-- Name: periodes_travail periodes_travail_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.periodes_travail
    ADD CONSTRAINT periodes_travail_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: periodes_travail periodes_travail_validated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.periodes_travail
    ADD CONSTRAINT periodes_travail_validated_by_fkey FOREIGN KEY (validated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: zones_chantiers zones_chantiers_chantier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zones_chantiers
    ADD CONSTRAINT zones_chantiers_chantier_id_fkey FOREIGN KEY (chantier_id) REFERENCES public.chantiers(id) ON DELETE CASCADE;


--
-- Name: zones_chantiers zones_chantiers_zone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zones_chantiers
    ADD CONSTRAINT zones_chantiers_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.zones_equipe(id) ON DELETE CASCADE;


--
-- Name: zones_equipe zones_equipe_chef_equipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zones_equipe
    ADD CONSTRAINT zones_equipe_chef_equipe_id_fkey FOREIGN KEY (chef_equipe_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: zones_ouvriers zones_ouvriers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zones_ouvriers
    ADD CONSTRAINT zones_ouvriers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: zones_ouvriers zones_ouvriers_zone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zones_ouvriers
    ADD CONSTRAINT zones_ouvriers_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.zones_equipe(id) ON DELETE CASCADE;


--
-- Name: zones_chantiers Admin can delete zone chantiers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can delete zone chantiers" ON public.zones_chantiers FOR DELETE TO authenticated USING (public.is_admin());


--
-- Name: zones_ouvriers Admin can delete zone ouvriers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can delete zone ouvriers" ON public.zones_ouvriers FOR DELETE TO authenticated USING (public.is_admin());


--
-- Name: zones_equipe Admin can delete zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can delete zones" ON public.zones_equipe FOR DELETE TO authenticated USING (public.is_admin());


--
-- Name: zones_chantiers Admin can insert zone chantiers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can insert zone chantiers" ON public.zones_chantiers FOR INSERT TO authenticated WITH CHECK (public.is_admin());


--
-- Name: zones_ouvriers Admin can insert zone ouvriers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can insert zone ouvriers" ON public.zones_ouvriers FOR SELECT TO authenticated USING (public.is_admin());


--
-- Name: zones_equipe Admin can insert zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can insert zones" ON public.zones_equipe FOR INSERT TO authenticated WITH CHECK (public.is_admin());


--
-- Name: zones_ouvriers Admin can update zone ouvriers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can update zone ouvriers" ON public.zones_ouvriers FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: zones_equipe Admin can update zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can update zones" ON public.zones_equipe FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: zones_chantiers Admin can view all zone chantiers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can view all zone chantiers" ON public.zones_chantiers FOR SELECT TO authenticated USING (public.is_admin());


--
-- Name: zones_ouvriers Admin can view all zone ouvriers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can view all zone ouvriers" ON public.zones_ouvriers FOR SELECT TO authenticated USING (public.is_admin());


--
-- Name: zones_equipe Admin can view all zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can view all zones" ON public.zones_equipe FOR SELECT TO authenticated USING (public.is_admin());


--
-- Name: declarations_heures Admins can delete any declaration; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete any declaration" ON public.declarations_heures FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'administratif'::text]))))));


--
-- Name: periodes_travail Admins can delete any period; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete any period" ON public.periodes_travail FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'administratif'::text]))))));


--
-- Name: affectations_chantiers Admins can insert affectations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert affectations" ON public.affectations_chantiers FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'administratif'::text, 'chef_equipe'::text]))))));


--
-- Name: profiles Admins can insert any profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert any profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((public.get_my_role() = 'admin'::text));


--
-- Name: chantiers Admins can insert chantiers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert chantiers" ON public.chantiers FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'administratif'::text]))))));


--
-- Name: affectations_chantiers Admins can update affectations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update affectations" ON public.affectations_chantiers FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'administratif'::text, 'chef_equipe'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'administratif'::text, 'chef_equipe'::text]))))));


--
-- Name: declarations_heures Admins can update all declarations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all declarations" ON public.declarations_heures FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'administratif'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'administratif'::text]))))));


--
-- Name: periodes_travail Admins can update all periods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all periods" ON public.periodes_travail FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'administratif'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'administratif'::text]))))));


--
-- Name: profiles Admins can update any profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE TO authenticated USING ((public.get_my_role() = 'admin'::text)) WITH CHECK ((public.get_my_role() = 'admin'::text));


--
-- Name: chantiers Admins can update chantiers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update chantiers" ON public.chantiers FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'administratif'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'administratif'::text]))))));


--
-- Name: affectations_chantiers Admins can view all affectations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all affectations" ON public.affectations_chantiers FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'administratif'::text]))))));


--
-- Name: declarations_heures Admins can view all declarations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all declarations" ON public.declarations_heures FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'administratif'::text]))))));


--
-- Name: periodes_travail Admins can view all periods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all periods" ON public.periodes_travail FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'administratif'::text]))))));


--
-- Name: chantiers Authenticated users can view active chantiers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view active chantiers" ON public.chantiers FOR SELECT TO authenticated USING (true);


--
-- Name: profiles Authenticated users can view profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);


--
-- Name: zones_equipe Chef can delete own zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Chef can delete own zones" ON public.zones_equipe FOR DELETE TO authenticated USING ((chef_equipe_id = auth.uid()));


--
-- Name: zones_chantiers Chef can delete zone chantiers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Chef can delete zone chantiers" ON public.zones_chantiers FOR DELETE TO authenticated USING (public.is_zone_owner(zone_id));


--
-- Name: zones_ouvriers Chef can delete zone ouvriers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Chef can delete zone ouvriers" ON public.zones_ouvriers FOR DELETE TO authenticated USING (public.is_zone_owner(zone_id));


--
-- Name: zones_equipe Chef can insert own zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Chef can insert own zones" ON public.zones_equipe FOR INSERT TO authenticated WITH CHECK ((chef_equipe_id = auth.uid()));


--
-- Name: zones_chantiers Chef can insert zone chantiers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Chef can insert zone chantiers" ON public.zones_chantiers FOR INSERT TO authenticated WITH CHECK (public.is_zone_owner(zone_id));


--
-- Name: zones_ouvriers Chef can insert zone ouvriers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Chef can insert zone ouvriers" ON public.zones_ouvriers FOR INSERT TO authenticated WITH CHECK (public.is_zone_owner(zone_id));


--
-- Name: zones_equipe Chef can update own zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Chef can update own zones" ON public.zones_equipe FOR UPDATE TO authenticated USING ((chef_equipe_id = auth.uid())) WITH CHECK ((chef_equipe_id = auth.uid()));


--
-- Name: zones_ouvriers Chef can update zone ouvriers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Chef can update zone ouvriers" ON public.zones_ouvriers FOR UPDATE TO authenticated USING (public.is_zone_owner(zone_id)) WITH CHECK (public.is_zone_owner(zone_id));


--
-- Name: zones_equipe Chef can view own zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Chef can view own zones" ON public.zones_equipe FOR SELECT TO authenticated USING ((chef_equipe_id = auth.uid()));


--
-- Name: zones_chantiers Chef can view zone chantiers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Chef can view zone chantiers" ON public.zones_chantiers FOR SELECT TO authenticated USING (public.is_zone_owner(zone_id));


--
-- Name: zones_ouvriers Chef can view zone ouvriers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Chef can view zone ouvriers" ON public.zones_ouvriers FOR SELECT TO authenticated USING (public.is_zone_owner(zone_id));


--
-- Name: declarations_heures Chefs can delete team declarations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Chefs can delete team declarations" ON public.declarations_heures FOR DELETE TO authenticated USING ((chantier_id IN ( SELECT c.chantier_id
   FROM public.get_chef_chantier_ids(auth.uid()) c(chantier_id))));


--
-- Name: periodes_travail Chefs can delete team periods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Chefs can delete team periods" ON public.periodes_travail FOR DELETE TO authenticated USING (((chantier_id IN ( SELECT c.chantier_id
   FROM public.get_chef_chantier_ids(auth.uid()) c(chantier_id))) OR (EXISTS ( SELECT 1
   FROM (public.zones_ouvriers zo
     JOIN public.zones_equipe ze ON ((ze.id = zo.zone_id)))
  WHERE ((zo.user_id = periodes_travail.user_id) AND (ze.chef_equipe_id = auth.uid()) AND (zo.date_fin IS NULL))))));


--
-- Name: declarations_heures Chefs can update team declarations for validation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Chefs can update team declarations for validation" ON public.declarations_heures FOR UPDATE TO authenticated USING (((chantier_id IN ( SELECT c.chantier_id
   FROM public.get_chef_chantier_ids(auth.uid()) c(chantier_id))) AND (statut = ANY (ARRAY['soumise'::text, 'validee'::text])))) WITH CHECK ((chantier_id IN ( SELECT c.chantier_id
   FROM public.get_chef_chantier_ids(auth.uid()) c(chantier_id))));


--
-- Name: periodes_travail Chefs can update team periods for validation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Chefs can update team periods for validation" ON public.periodes_travail FOR UPDATE TO authenticated USING (((EXISTS ( SELECT 1
   FROM public.affectations_chantiers a
  WHERE ((a.user_id = periodes_travail.user_id) AND (a.chantier_id = periodes_travail.chantier_id) AND (a.chef_equipe_id = auth.uid())))) AND (statut = ANY (ARRAY['terminee'::text, 'validee'::text])))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.affectations_chantiers a
  WHERE ((a.user_id = periodes_travail.user_id) AND (a.chantier_id = periodes_travail.chantier_id) AND (a.chef_equipe_id = auth.uid())))));


--
-- Name: affectations_chantiers Chefs can view their team affectations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Chefs can view their team affectations" ON public.affectations_chantiers FOR SELECT TO authenticated USING ((chef_equipe_id = auth.uid()));


--
-- Name: declarations_heures Chefs can view their team declarations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Chefs can view their team declarations" ON public.declarations_heures FOR SELECT TO authenticated USING ((chantier_id IN ( SELECT c.chantier_id
   FROM public.get_chef_chantier_ids(auth.uid()) c(chantier_id))));


--
-- Name: periodes_travail Chefs can view their team periods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Chefs can view their team periods" ON public.periodes_travail FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.affectations_chantiers a
  WHERE ((a.user_id = periodes_travail.user_id) AND (a.chantier_id = periodes_travail.chantier_id) AND (a.chef_equipe_id = auth.uid())))));


--
-- Name: zones_equipe Ouvrier can view assigned zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ouvrier can view assigned zones" ON public.zones_equipe FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.zones_ouvriers zo
  WHERE ((zo.zone_id = zones_equipe.id) AND (zo.user_id = auth.uid()) AND (zo.date_fin IS NULL)))));


--
-- Name: zones_chantiers Ouvrier can view chantiers in assigned zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ouvrier can view chantiers in assigned zones" ON public.zones_chantiers FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.zones_ouvriers zo
  WHERE ((zo.zone_id = zones_chantiers.zone_id) AND (zo.user_id = auth.uid()) AND (zo.date_fin IS NULL)))));


--
-- Name: zones_ouvriers Ouvrier can view own zone assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ouvrier can view own zone assignments" ON public.zones_ouvriers FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: declarations_heures Users can delete own draft declarations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own draft declarations" ON public.declarations_heures FOR DELETE TO authenticated USING (((user_id = auth.uid()) AND (statut = 'brouillon'::text)));


--
-- Name: periodes_travail Users can delete own non-validated periods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own non-validated periods" ON public.periodes_travail FOR DELETE TO authenticated USING (((user_id = auth.uid()) AND (statut = ANY (ARRAY['en_cours'::text, 'terminee'::text]))));


--
-- Name: declarations_heures Users can delete own rejected declarations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own rejected declarations" ON public.declarations_heures FOR DELETE TO authenticated USING (((user_id = auth.uid()) AND (statut = 'rejetee'::text)));


--
-- Name: periodes_travail Users can delete own rejected periods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own rejected periods" ON public.periodes_travail FOR DELETE TO authenticated USING (((user_id = auth.uid()) AND (statut = 'rejetee'::text)));


--
-- Name: declarations_heures Users can insert own declarations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own declarations" ON public.declarations_heures FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: periodes_travail Users can insert own periods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own periods" ON public.periodes_travail FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: declarations_heures Users can update own draft declarations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own draft declarations" ON public.declarations_heures FOR UPDATE TO authenticated USING (((user_id = auth.uid()) AND (statut = 'brouillon'::text))) WITH CHECK ((user_id = auth.uid()));


--
-- Name: periodes_travail Users can update own non-validated periods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own non-validated periods" ON public.periodes_travail FOR UPDATE TO authenticated USING (((user_id = auth.uid()) AND (statut = ANY (ARRAY['en_cours'::text, 'terminee'::text])))) WITH CHECK ((user_id = auth.uid()));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));


--
-- Name: periodes_travail Users can update own rejected periods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own rejected periods" ON public.periodes_travail FOR UPDATE TO authenticated USING (((user_id = auth.uid()) AND (statut = 'rejetee'::text))) WITH CHECK (((user_id = auth.uid()) AND (statut = 'terminee'::text)));


--
-- Name: affectations_chantiers Users can view own affectations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own affectations" ON public.affectations_chantiers FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: declarations_heures Users can view own declarations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own declarations" ON public.declarations_heures FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: periodes_travail Users can view own periods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own periods" ON public.periodes_travail FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id));


--
-- Name: affectations_chantiers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.affectations_chantiers ENABLE ROW LEVEL SECURITY;

--
-- Name: chantiers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chantiers ENABLE ROW LEVEL SECURITY;

--
-- Name: declarations_heures; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.declarations_heures ENABLE ROW LEVEL SECURITY;

--
-- Name: periodes_travail; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.periodes_travail ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: zones_chantiers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.zones_chantiers ENABLE ROW LEVEL SECURITY;

--
-- Name: zones_equipe; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.zones_equipe ENABLE ROW LEVEL SECURITY;

--
-- Name: zones_ouvriers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.zones_ouvriers ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict WO2g6HhpUEzXz6WvMcP6ct2fQfFEoke7L77VkpNrHcaYtWf2Wmzz2Frsd0lP2iY

