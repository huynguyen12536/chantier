import edgeRoutes from './edge/routes.js';
import rpcRoutes from './rpc/routes.js';
import profilesTableRoutes from './tables/profiles.routes.js';

/**
 * Imp-12 Wave A — compatibility mounts only.
 * Dual Edge prefixes per DR-IMP12-001=A.
 * Optional /rest/v1/rpc alias for frozen FE supabase.rpc.
 */
export function mountCompat(app) {
  app.use('/functions', edgeRoutes);
  app.use('/functions/v1', edgeRoutes);

  app.use('/rpc', rpcRoutes);
  app.use('/rest/v1/rpc', rpcRoutes);

  app.use('/tables', profilesTableRoutes);
}

export default mountCompat;
