/**
 * Global module context shared between Node.js module and SvelteKit server
 * This allows API routes and WebSocket handlers to access the module's state
 * 
 * Dual export for CommonJS and ES Module compatibility
 */

let globalModuleContext = null;
let globalObsServices = null;
let globalAlertEngine = null;
let globalAutomationEngine = null;

function setModuleContext(context, obsServices, alertEngine, automationEngine) {
	globalModuleContext = context;
	globalObsServices = obsServices;
	globalAlertEngine = alertEngine;
	globalAutomationEngine = automationEngine;
}

function getModuleContext() {
	return {
		context: globalModuleContext,
		obsServices: globalObsServices,
		alertEngine: globalAlertEngine,
		automationEngine: globalAutomationEngine
	};
}

function clearModuleContext() {
	globalModuleContext = null;
	globalObsServices = null;
	globalAlertEngine = null;
	globalAutomationEngine = null;
}

// CommonJS exports
if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		setModuleContext,
		getModuleContext,
		clearModuleContext
	};
}

// ES Module exports
export { setModuleContext, getModuleContext, clearModuleContext };
