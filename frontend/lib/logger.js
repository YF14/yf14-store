/**
 * Client-side logger: debug/info only in development; warn/error always.
 * Use instead of raw console.* so logs can be gated or forwarded later (e.g. Sentry).
 */

const isDev = process.env.NODE_ENV === 'development';

function formatArgs(args) {
  return args.map((a) => (typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a))).join(' ');
}

export const logger = {
  debug: (...args) => {
    if (isDev) console.debug(`[app] ${formatArgs(args)}`);
  },
  info: (...args) => {
    if (isDev) console.info(`[app] ${formatArgs(args)}`);
  },
  warn: (...args) => {
    console.warn(`[app] ${formatArgs(args)}`);
  },
  error: (...args) => {
    console.error(`[app] ${formatArgs(args)}`);
  },
};

export default logger;
