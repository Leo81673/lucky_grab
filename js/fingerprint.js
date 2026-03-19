// Lucky Grab — Device Fingerprinting
// Uses FingerprintJS open-source with localStorage fallback

let _fingerprint = null;

export async function getFingerprint() {
  if (_fingerprint) return _fingerprint;

  try {
    // Try FingerprintJS
    const FingerprintJS = await import('https://openfpcdn.io/fingerprintjs/v4');
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    _fingerprint = result.visitorId;
  } catch {
    // Fallback: localStorage UUID
    _fingerprint = localStorage.getItem('lg_device_id');
    if (!_fingerprint) {
      _fingerprint = crypto.randomUUID();
      localStorage.setItem('lg_device_id', _fingerprint);
    }
  }

  return _fingerprint;
}
