import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import * as service from './services/reviewDecision.js';

export const listQueue = asyncHandler(async (req, res) => {
  const declarations = await service.listQueue(req.user);
  res.json({ declarations });
});

export const approve = asyncHandler(async (req, res) => {
  const result = await service.approveDeclaration(req.params.id, req.user, {
    body: req.body ?? {},
    correlationId: req.correlationId,
  });
  res.json(result);
});

export const reject = asyncHandler(async (req, res) => {
  const result = await service.rejectDeclaration(req.params.id, req.user, {
    body: req.body ?? {},
    correlationId: req.correlationId,
  });
  res.json(result);
});

export const returnToWorker = asyncHandler(async (req, res) => {
  const result = await service.returnDeclaration(req.params.id, req.user, {
    body: req.body ?? {},
    correlationId: req.correlationId,
  });
  res.json(result);
});

export const cancel = asyncHandler(async (req, res) => {
  const result = await service.cancelDeclaration(req.params.id, req.user, {
    body: req.body ?? {},
    correlationId: req.correlationId,
  });
  res.json(result);
});

export const history = asyncHandler(async (req, res) => {
  const result = await service.getDeclarationHistory(req.params.id, req.user);
  res.json(result);
});

export const decidePeriod = asyncHandler(async (req, res) => {
  const result = await service.decidePeriod(req.params.id, req.body ?? {}, req.user, {
    correlationId: req.correlationId,
  });
  res.json(result);
});
