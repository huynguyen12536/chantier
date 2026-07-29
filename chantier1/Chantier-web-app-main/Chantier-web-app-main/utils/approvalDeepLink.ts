import { routeParam } from '@/utils/routeParams';

export type ApprovalDeepLinkParams = {
  filter?: string | string[];
  tab?: string | string[];
  worksiteView?: string | string[];
  expandedUserId?: string | string[];
  highlightChantierId?: string | string[];
  highlightDeclId?: string | string[];
  _focus?: string | string[];
};

export type ParsedApprovalDeepLink = {
  focusKey?: string;
  filter?: 'pending' | 'all';
  tab?: 'users' | 'worksites';
  worksiteView?: 'pending' | 'list' | 'rejected';
  expandedUserId?: string;
  highlightChantierId?: string;
  highlightDeclId?: string;
};

export function parseApprovalDeepLink(params: ApprovalDeepLinkParams): ParsedApprovalDeepLink {
  const focusKey = routeParam(params._focus);
  const filterRaw = routeParam(params.filter);
  const tabRaw = routeParam(params.tab);
  const worksiteViewRaw = routeParam(params.worksiteView);
  const expandedUserId = routeParam(params.expandedUserId);
  const highlightChantierId = routeParam(params.highlightChantierId);
  const highlightDeclId = routeParam(params.highlightDeclId);

  const filter =
    filterRaw === 'pending' || filterRaw === 'all' ? filterRaw : undefined;
  const tab = tabRaw === 'users' || tabRaw === 'worksites' ? tabRaw : undefined;
  const worksiteView =
    worksiteViewRaw === 'pending' || worksiteViewRaw === 'list' || worksiteViewRaw === 'rejected'
      ? worksiteViewRaw
      : undefined;

  return {
    focusKey,
    filter,
    tab,
    worksiteView,
    expandedUserId,
    highlightChantierId,
    highlightDeclId,
  };
}

/** Remove notification deep-link params from the current route (one-shot navigation). */
export function clearApprovalDeepLinkParams(
  setParams: (params: Record<string, string>) => void,
): void {
  setParams({
    _focus: '',
    filter: '',
    tab: '',
    worksiteView: '',
    expandedUserId: '',
    highlightChantierId: '',
    highlightDeclId: '',
  });
}
