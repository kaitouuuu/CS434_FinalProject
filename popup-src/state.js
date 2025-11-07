// Define and export your global state object
export let globalState = 'All';

// Optional helper to modify state
export function setGlobalState(newState) {
    globalState = newState;
}

export let hostname = '';
export async function setHostname(newHostname) {
    hostname = newHostname;
    console.log('Hostname set to:', hostname);
}
export function getHostname() {
    console.log('Getting hostname:', hostname);
    return hostname;
}
