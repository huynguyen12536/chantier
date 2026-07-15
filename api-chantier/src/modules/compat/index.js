import edgeRoutes from './edge/routes.js';
import rpcRoutes from './rpc/routes.js';
import profilesTableRoutes from './tables/profiles.routes.js';
import chantiersTableRoutes from './tables/chantiers.routes.js';
import affectationsTableRoutes from './tables/affectations.routes.js';
import zonesTableRoutes from './tables/zones.routes.js';
import periodesTableRoutes from './tables/periodes.routes.js';
import authCompatRoutes from './auth/routes.js';

/**
 * Imp-12 compatibility mounts.
 * Wave A: Edge dual, RPC dual, profiles /tables.
 * Wave B (DR-B-002=A): same table handlers on /tables and /rest/v1.
 * Wave B (DR-B-004=A): thin /auth/v1 → Imp-02.
 */
function mountTableRouters(app, router) {
  app.use('/tables', router);
  app.use('/rest/v1', router);
}

export function mountCompat(app) {
  app.use('/functions', edgeRoutes);
  app.use('/functions/v1', edgeRoutes);

  // More specific RPC path before /rest/v1 table stack
  app.use('/rpc', rpcRoutes);
  app.use('/rest/v1/rpc', rpcRoutes);

  mountTableRouters(app, profilesTableRoutes);
  mountTableRouters(app, chantiersTableRoutes);
  mountTableRouters(app, affectationsTableRoutes);
  mountTableRouters(app, zonesTableRoutes);
  mountTableRouters(app, periodesTableRoutes);

  app.use('/auth/v1', authCompatRoutes);
}

export default mountCompat;
