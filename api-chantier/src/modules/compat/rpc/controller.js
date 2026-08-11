import { asyncHandler } from '../../../shared/utils/asyncHandler.js';
import { AppError } from '../../../shared/errors/AppError.js';
import * as chantiersService from '../../chantiers/service.js';
import * as diversService from '../../chantiers/diversService.js';
import * as reviewDecision from '../../validation/services/reviewDecision.js';
import * as chantierMapper from '../mappers/chantierMapper.js';

export const deleteChantierCascade = asyncHandler(async (req, res) => {
  try {
    const { chantierId } = chantierMapper.fromCascadeRequest(req.body);
    if (!chantierId) {
      throw new AppError('p_chantier_id requis', 400, { code: 'VALIDATION_ERROR' });
    }
    await chantiersService.deleteChantierCascade(chantierId, req.user);
    const mapped = chantierMapper.toCascadeResponse();
    res.status(mapped.status).json(mapped.body);
  } catch (err) {
    const mapped = chantierMapper.toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
});

async function handleRpc(name, req, res) {
  try {
    let result;
    switch (name) {
      case 'create_chantier_divers':
        result = await diversService.createChantierDivers(req.user, req.body ?? {});
        break;
      case 'approve_chantier_divers':
        result = await diversService.approveChantierDivers(req.user, req.body ?? {});
        break;
      case 'reject_chantier_divers':
        await diversService.rejectChantierDivers(req.user, req.body ?? {});
        result = null;
        break;
      case 'get_collaborator_divers_notifications':
        result = await diversService.getCollaboratorDiversNotifications(
          req.user,
          req.body ?? {},
        );
        break;
      case 'validate_declaration_unlock_divers':
        result = await reviewDecision.validateDeclarationUnlockDivers(
          req.body?.p_declaration_id ?? req.body?.declaration_id,
          req.user,
        );
        break;
      default:
        throw new AppError(`RPC not supported: ${name}`, 400);
    }
    res.status(200).json(result);
  } catch (err) {
    const mapped = chantierMapper.toErrorResponse(err);
    res.status(mapped.status).json(mapped.body);
  }
}

export const rpcDispatch = asyncHandler(async (req, res) => {
  const name = req.params.name ?? req.body?.rpc ?? req.path.split('/').pop();
  await handleRpc(name, req, res);
});
