import type { CommandItem } from '../types.d';

export interface HarvestableRouteCommandMeta extends Partial<CommandItem> {
  readonly id?: string;
  readonly title: string;
}

export interface HarvestableRouteMeta {
  readonly title?: string;
  readonly name?: string;
  readonly description?: string;
  readonly icon?: string;
  readonly color?: string;
  readonly hideFromNav?: boolean;
  readonly keywords?: readonly string[];
  readonly commands?: readonly HarvestableRouteCommandMeta[];
}

export interface HarvestableRoute {
  readonly path: string;
  readonly name?: string | symbol;
  readonly redirect?: unknown;
  readonly meta?: HarvestableRouteMeta;
  readonly children?: readonly HarvestableRoute[];
}

export interface HarvestRouteOptions {
  readonly appSlug: string;
  readonly appTitle: string;
  readonly appIcon?: string;
  readonly category?: string;
  readonly defaultIconColor?: string;
  readonly extraKeywords?: readonly string[];
}

const NAMED_COLOR_HEX: Record<string, string> = {
  cyan: '#26c6da',
  blue: '#42a5f5',
  green: '#66bb6a',
  orange: '#ffa726',
  teal: '#26a69a',
  purple: '#ab47bc',
  yellow: '#ffd54f',
  pink: '#ec4899',
  red: '#ef5350',
  indigo: '#5c6bc0',
  primary: '#62c9ff'
};

const GENERIC_ROOT_TITLES = new Set(['dashboard', 'overview', 'index', 'home']);
const OPTIONAL_PARAM_PATTERN = /\/:[a-zA-Z0-9_]+\?/g;
const REQUIRED_PARAM_PATTERN = /\/:[a-zA-Z0-9_]+(?!\?)/;
const BARE_PARAM_PATTERN = /^:[a-zA-Z0-9_]+$/;
const FA_PREFIX_PATTERN = /^(fa[srlbd]?|fa)\s+/;

function normalizeRouteColor(rawColor: string | undefined, fallbackColor: string): string {
  if (!rawColor) return fallbackColor;
  const trimmed = rawColor.trim();
  const named = NAMED_COLOR_HEX[trimmed.toLowerCase()];
  if (named) return named;

  const isCssColorValue =
    trimmed.startsWith('#') || trimmed.startsWith('rgb') || trimmed.startsWith('var(');
  if (isCssColorValue) return trimmed;
  return fallbackColor;
}

function normalizeFontAwesomeIcon(rawIcon: string | undefined, fallbackIcon: string): string {
  if (!rawIcon) return fallbackIcon;
  const trimmed = rawIcon.trim();
  if (!trimmed) return fallbackIcon;

  const hasPrefix = FA_PREFIX_PATTERN.test(trimmed);
  if (hasPrefix) return trimmed;

  const hasFaStem = trimmed.startsWith('fa-');
  if (hasFaStem) return `fad ${trimmed}`;
  return `fad fa-${trimmed}`;
}

function cleanRoutePathSegment(rawSegment: string): string | null {
  const withoutOptional = rawSegment.replace(OPTIONAL_PARAM_PATTERN, '');
  const trimmed = withoutOptional.replace(/^\/+|\/+$/g, '');
  const isCatchAll = trimmed.includes('*') || trimmed.includes('(.*)');
  if (isCatchAll) return null;
  if (!trimmed) return '';

  const isBareParam = BARE_PARAM_PATTERN.test(trimmed);
  const hasRequiredParam = REQUIRED_PARAM_PATTERN.test(`/${trimmed}`);
  if (isBareParam || hasRequiredParam) return null;
  return trimmed;
}

function resolveFullRoutePath(parentPath: string, rawChildPath: string): string | null {
  const cleanedSegment = cleanRoutePathSegment(rawChildPath);
  if (cleanedSegment === null) return null;
  const normalizedBase = parentPath.replace(/\/+$/, '');
  if (!cleanedSegment) return normalizedBase || '/';
  return `${normalizedBase}/${cleanedSegment}`.replace(/\/+/g, '/');
}

function toHumanTitle(rawName: string, appTitle: string): string {
  const stripped = rawName
    .replace(/^route-/i, '')
    .replace(/^xophz-compass-/i, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!stripped) return '';
  const appLower = appTitle.toLowerCase();
  const strippedLower = stripped.toLowerCase();
  const hasRedundantAppPrefix =
    strippedLower.startsWith(`${appLower} `) && stripped.length > appTitle.length + 1;
  if (hasRedundantAppPrefix) {
    return stripped.slice(appTitle.length).trim();
  }
  return stripped.replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function deriveRouteTitle(route: HarvestableRoute, appTitle: string): string {
  const metaTitle = route.meta?.title || route.meta?.name;
  const hasMetaTitle = Boolean(metaTitle && metaTitle.trim());
  if (hasMetaTitle) return metaTitle!.trim();

  const hasStringName = typeof route.name === 'string' && Boolean(route.name.trim());
  if (hasStringName) {
    return toHumanTitle(route.name as string, appTitle);
  }
  return '';
}

function slugifyId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function collectMetaCommands(
  route: HarvestableRoute,
  fullPath: string,
  options: HarvestRouteOptions,
  fallbackIcon: string,
  fallbackColor: string
): CommandItem[] {
  const declared = route.meta?.commands;
  const hasDeclared = Boolean(declared && declared.length > 0);
  if (!hasDeclared) return [];

  return declared!.map((cmd, idx) => ({
    id: cmd.id || `route-cmd-${options.appSlug}-${slugifyId(cmd.title)}-${idx}`,
    title: cmd.title,
    subtitle: cmd.subtitle,
    category: cmd.category || 'actions',
    categoryLabel: cmd.categoryLabel || options.appTitle,
    icon: normalizeFontAwesomeIcon(cmd.icon, fallbackIcon),
    iconColor: normalizeRouteColor(cmd.iconColor, fallbackColor),
    route: cmd.route || fullPath,
    action: cmd.action,
    badge: cmd.badge,
    keywords: [
      options.appSlug,
      options.appTitle,
      cmd.title,
      ...(cmd.keywords || []),
      ...(options.extraKeywords || [])
    ]
  }));
}

function isGenericRootTitle(title: string, appTitle: string): boolean {
  const lower = title.trim().toLowerCase();
  return GENERIC_ROOT_TITLES.has(lower) || lower === appTitle.trim().toLowerCase();
}

function buildKeywords(
  fullPath: string,
  title: string,
  options: HarvestRouteOptions,
  metaKeywords?: readonly string[]
): string[] {
  const pathParts = fullPath.split('/').filter(Boolean);
  const combined = [
    options.appSlug,
    options.appTitle,
    title,
    ...pathParts,
    ...(metaKeywords || []),
    ...(options.extraKeywords || [])
  ];
  return Array.from(new Set(combined.map((item) => item.trim()).filter(Boolean)));
}

/**
 * Recursively extracts searchable CommandItems from a sub-app route config tree.
 * Skips required dynamic `:id` detail routes and deduplicates by normalized route path.
 */
export function harvestRouteCommands(
  routes: readonly HarvestableRoute[],
  options: HarvestRouteOptions
): CommandItem[] {
  const defaultColor = options.defaultIconColor || '#62c9ff';
  const defaultIcon = normalizeFontAwesomeIcon(options.appIcon, 'fad fa-compass');
  const rootPath = `/${options.appSlug.replace(/^\/+|\/+$/g, '')}`;
  const collectedByRoute = new Map<string, CommandItem>();
  const extraCommands: CommandItem[] = [];

  const registerRouteEntry = (
    route: HarvestableRoute,
    resolvedPath: string,
    icon: string,
    iconColor: string
  ) => {
    const title = deriveRouteTitle(route, options.appTitle);
    const isAtRootPath = resolvedPath === rootPath;
    const shouldSkipGenericRoot = isAtRootPath && isGenericRootTitle(title, options.appTitle);
    const canRegister = Boolean(title) && !shouldSkipGenericRoot;
    if (!canRegister) return;

    const customDescription = route.meta?.description?.trim();
    const subtitle = customDescription || `${options.appTitle} workspace view (${resolvedPath})`;
    const candidate: CommandItem = {
      id: `harvest-${options.appSlug}-${slugifyId(resolvedPath)}`,
      title,
      subtitle,
      category: options.category || 'views',
      categoryLabel: options.appTitle,
      icon,
      iconColor,
      route: resolvedPath,
      keywords: buildKeywords(resolvedPath, title, options, route.meta?.keywords)
    };

    const existing = collectedByRoute.get(resolvedPath);
    if (!existing) {
      collectedByRoute.set(resolvedPath, candidate);
      return;
    }

    const mergedKeywords = Array.from(
      new Set([...(existing.keywords || []), ...(candidate.keywords || [])])
    );
    collectedByRoute.set(resolvedPath, {
      ...existing,
      subtitle: customDescription ? candidate.subtitle : existing.subtitle,
      keywords: mergedKeywords
    });
  };

  const visit = (route: HarvestableRoute, parentPath: string, isRootWrapper: boolean) => {
    const resolvedPath = isRootWrapper ? rootPath : resolveFullRoutePath(parentPath, route.path);
    if (!resolvedPath) return;

    const icon = normalizeFontAwesomeIcon(route.meta?.icon, defaultIcon);
    const iconColor = normalizeRouteColor(route.meta?.color, defaultColor);

    extraCommands.push(...collectMetaCommands(route, resolvedPath, options, icon, iconColor));

    const shouldEmitSelf = !isRootWrapper && !route.meta?.hideFromNav;
    if (shouldEmitSelf) {
      registerRouteEntry(route, resolvedPath, icon, iconColor);
    }

    const hasChildren = Boolean(route.children && route.children.length > 0);
    if (!hasChildren) return;

    for (const child of route.children!) {
      visit(child, resolvedPath, false);
    }
  };

  for (const rootRoute of routes) {
    visit(rootRoute, rootPath, true);
  }

  return [...collectedByRoute.values(), ...extraCommands];
}
