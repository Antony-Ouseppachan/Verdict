export async function hasRequiredPermissions(): Promise<boolean> {
  if (typeof chrome === 'undefined' || !chrome.permissions) {
    return true; // Test environment or fallback
  }

  try {
    return await chrome.permissions.contains({
      permissions: ['storage', 'tabs'],
      origins: ['http://*/*', 'https://*/*'],
    });
  } catch {
    return false;
  }
}
