export class AccountNotFoundError extends Error {
  readonly code = 'ACCOUNT_NOT_FOUND';

  constructor() {
    super('ACCOUNT_NOT_FOUND');
    this.name = 'AccountNotFoundError';
  }
}

export function isAccountNotFoundError(error: unknown): boolean {
  return error instanceof AccountNotFoundError || (error as { code?: string })?.code === 'ACCOUNT_NOT_FOUND';
}
