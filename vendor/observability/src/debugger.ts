import _debug from 'debug';

export const createDebugger = (namespace: string) => _debug(namespace);
