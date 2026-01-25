export function getUserId() {
  return localStorage.getItem("userId");
}

export function createUserId() {
  const newId = generateUserId();
  localStorage.setItem("userId", newId);
  return newId;
}

function generateUserId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
