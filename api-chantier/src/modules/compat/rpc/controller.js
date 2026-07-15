import { asyncHandler } from '../../../shared/utils/asyncHandler.js';
import { AppError } from '../../../shared/errors/AppError.js';
import * as chantiersService from '../../chantiers/service.js';
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
