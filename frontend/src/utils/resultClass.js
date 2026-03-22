export function getResultClass(result) {
  if (!result) return "";
  return result.startsWith("✅")
    ? "result-box correct"
    : "result-box incorrect";
}