// Define and export your global state object
export let globalState = 'All';

// Optional helper to modify state
export function setGlobalState(newState) {
    globalState = newState;
}
