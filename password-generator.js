(function (global) {
  const SETS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    digits: '0123456789',
    special: '`~!@#$%^&*()-_=+[]{}|;:,.<>?'
  };

  function getRandomBytes(len) {
    const g =
      typeof globalThis !== 'undefined'
        ? globalThis
        : typeof self !== 'undefined'
        ? self
        : typeof window !== 'undefined'
        ? window
        : {};

    if (g.crypto && typeof g.crypto.getRandomValues === 'function') {
      const buf = new Uint8Array(len);
      g.crypto.getRandomValues(buf);
      return buf;
    }

    throw new Error('Secure crypto not available in this environment');
  }

  function randIndex(n) {
    if (n <= 0) throw new Error('randIndex n must be >0');
    const max = 0xffffffff;
    const threshold = max - (max % n);
    while (true) {
      const buf = new Uint32Array(1);
      const bytes = getRandomBytes(4);
      buf[0] = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
      const val = buf[0] >>> 0;
      if (val < threshold) return val % n;
    }
  }

  function secureShuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = randIndex(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function generatePassword({
    length = 12,
    uppercase = true,
    lowercase = true,
    digits = true,
    special = false,
    avoidSimilar = true,
    requireEachSelected = true
  } = {}) {
    if (!Number.isInteger(length) || length <= 0)
      throw new Error('length must be a positive integer');

    const chosenSets = [];
    if (uppercase) chosenSets.push(SETS.upper);
    if (lowercase) chosenSets.push(SETS.lower);
    if (digits) chosenSets.push(SETS.digits);
    if (special) chosenSets.push(SETS.special);

    if (chosenSets.length === 0) chosenSets.push(SETS.upper, SETS.lower);

    let excludeSet = '';
    if (avoidSimilar) excludeSet += 'O0oIl1|`\'"~;:.,{}[]()<>\\/';

    const excludeMap = new Set(excludeSet.split(''));
    const filteredSets = chosenSets
      .map((set) => set.split('').filter((ch) => !excludeMap.has(ch)))
      .filter((arr) => arr.length > 0);

    if (filteredSets.length === 0 || filteredSets.every((s) => s.length === 0))
      throw new Error(
        'All candidate characters were excluded. Loosen exclusions.'
      );

    const pool = [...new Set(filteredSets.flat())];
    if (pool.length === 0)
      throw new Error('Character pool is empty after filtering.');

    const requiredChars = [];
    if (requireEachSelected)
      for (const set of filteredSets)
        requiredChars.push(set[randIndex(set.length)]);

    if (length < requiredChars.length)
      throw new Error(
        `length must be >= number of required character groups (${requiredChars.length}).`
      );

    const result = [];

    for (let i = 0; i < length - requiredChars.length; i++)
      result.push(pool[randIndex(pool.length)]);

    const passwordArr = secureShuffle(result.concat(requiredChars));
    return passwordArr.join('');
  }

  if (typeof module !== 'undefined' && module.exports)
    module.exports = { generatePassword };
  else global.generatePassword = generatePassword;
})(typeof globalThis !== 'undefined' ? globalThis : window);
