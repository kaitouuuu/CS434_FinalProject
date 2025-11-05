import { send } from './messaging.js';

async function handleGeneratePassword() {
  const length = parseInt(document.getElementById('pw-length').value);
  const lowercase = document.getElementById('include-lowercase').checked;
  const special = document.getElementById('include-special').checked;
  const uppercase = document.getElementById('include-uppercase').checked;
  const digits = document.getElementById('include-digits').checked;
  const avoidSimilar = document.getElementById('include-similar').checked;
  const requireEachSelected =
    document.getElementById('include-require').checked;

  const options = {
    length,
    lowercase,
    special,
    uppercase,
    digits,
    avoidSimilar,
    requireEachSelected
  };
  const res = await send({ type: 'GENERATE_PASSWORD', options });

  if (res && res.password) {
    const passwordInput = document.getElementById('generated-password');
    passwordInput.value = res.password;
    document.getElementById('copy-password-btn').disabled = false;
  }
}

export { handleGeneratePassword };
