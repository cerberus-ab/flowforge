type RuntimeClass = typeof import('./Runtime').Runtime;

let runtimePromise: Promise<RuntimeClass> | null = null;

function loadFlowForge(): Promise<RuntimeClass> {
    if (!runtimePromise) {
        runtimePromise = import('./Runtime').then(({ Runtime }) => Runtime);
    }
    return runtimePromise;
}

window.loadFlowForge = loadFlowForge;

export default loadFlowForge;
