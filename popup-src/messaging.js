async function send(msg) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, (response) => {
      if (chrome.runtime.lastError) {
        console.error(
          'Error sending message:',
          chrome.runtime.lastError.message
        );
        resolve({ ok: false, error: chrome.runtime.lastError.message });
      } else resolve(response);
    });
  });
}

function queryTabs(queryInfo) {
  return new Promise((resolve) =>
    chrome.tabs.query(queryInfo, (tabs) => resolve(tabs))
  );
}

export { send, queryTabs };
