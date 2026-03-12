export function saveAuth(
  client_hash: string,
  is_active: boolean,
  jurisdiction: string
) {
  localStorage.setItem("sv_client_hash", client_hash);
  localStorage.setItem("sv_is_active", String(is_active));
  localStorage.setItem("sv_jurisdiction", jurisdiction || "uk");
  document.cookie = "sv_auth=1; path=/; SameSite=Lax";
}

export function getAuth() {
  return {
    client_hash: localStorage.getItem("sv_client_hash"),
    is_active: localStorage.getItem("sv_is_active") === "true",
    jurisdiction: localStorage.getItem("sv_jurisdiction") || "uk"
  };
}

export function clearAuth() {
  localStorage.removeItem("sv_client_hash");
  localStorage.removeItem("sv_is_active");
  localStorage.removeItem("sv_jurisdiction");
  document.cookie = "sv_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

