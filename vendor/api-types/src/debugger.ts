import debugFactory from 'debug';

const debug: debugFactory.Debugger = debugFactory('md-oss:api-types');

export const debugRoute: debugFactory.Debugger = debug.extend('route');
export const debugPerformance: debugFactory.Debugger =
	debug.extend('performance');
export const debugErrors: debugFactory.Debugger = debug.extend('errors');

export { debug };
