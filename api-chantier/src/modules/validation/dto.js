import { mapDeclaration, mapPeriod } from '../timesheet/dto.js';

export { mapDeclaration, mapPeriod };

export function mapQueueItem(row) {
  return mapDeclaration(row);
}
