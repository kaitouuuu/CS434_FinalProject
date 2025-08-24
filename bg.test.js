import * as idbKeyval from "idb-keyval";
import * as nanoId from "nanoid";
import cryptoHelper from "./crypto-helper.js";
import { StateManager } from "./state-manager.js";

async function runTests() {
  const stateManager = new StateManager();

  // Test 1: Set Master
  let result = await stateManager.setMaster("testpassword");
  console.log("Set Master:", result); // Expect { ok: true }

  // Test 2: Unlock with correct password
  result = await stateManager.unlock("testpassword");
  console.log("Unlock (correct):", result); // Expect { ok: true }

  // Test 3: Unlock with wrong password
  result = await stateManager.unlock("wrongpassword");
  console.log("Unlock (wrong):", result); // Expect { ok: false }

  // Test 4: Add Login
  result = await stateManager.addLogin({
    domain: "example.com",
    title: "Example",
    u: "user",
    p: "pass",
  });
  console.log("Add Login:", result); // Expect { ok: true }

  // Test 5: Match Login
  result = await stateManager.match("example.com");
  console.log("Match Login:", result); // Expect decrypted { u: "user", p: "pass" }

  // Test 6: Lock
  result = stateManager.lock();
  console.log("Lock:", result); // Expect { ok: true }

  // Test 7: Match after lock
  result = await stateManager.match("example.com");
  console.log("Match after lock:", result); // Expect null
}

runTests();
