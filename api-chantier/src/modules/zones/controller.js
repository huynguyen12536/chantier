import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import * as service from './service.js';

export const list = asyncHandler(async (req, res) => {
  const zones = await service.listZones(req.user);
  res.json({ zones });
});

export const create = asyncHandler(async (req, res) => {
  const zone = await service.createZone(req.body ?? {}, req.user);
  res.status(201).json({ zone });
});

export const update = asyncHandler(async (req, res) => {
  const zone = await service.updateZone(req.params.id, req.body ?? {}, req.user);
  res.json({ zone });
});

export const remove = asyncHandler(async (req, res) => {
  const zone = await service.deleteZone(req.params.id, req.user);
  res.json({ zone, deleted: true });
});

export const linkChantier = asyncHandler(async (req, res) => {
  const link = await service.linkZoneChantier(
    req.params.id,
    req.body?.chantier_id,
    req.user,
  );
  res.status(201).json({ link });
});

export const unlinkChantier = asyncHandler(async (req, res) => {
  const link = await service.unlinkZoneChantier(
    req.params.id,
    req.params.chantierId,
    req.user,
  );
  res.json({ link, unlinked: true });
});

export const addOuvrier = asyncHandler(async (req, res) => {
  const member = await service.addZoneOuvrier(
    req.params.id,
    req.body?.user_id,
    req.user,
  );
  res.status(201).json({ member });
});

export const softRemoveOuvrier = asyncHandler(async (req, res) => {
  const member = await service.softRemoveZoneOuvrier(
    req.params.id,
    req.params.userId,
    req.user,
  );
  res.json({ member });
});

export const unlinkOuvrier = asyncHandler(async (req, res) => {
  const member = await service.unlinkZoneOuvrier(
    req.params.id,
    req.params.userId,
    req.user,
  );
  res.json({ member, unlinked: true });
});
