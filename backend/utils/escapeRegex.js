/**
 * Escapes all regular expression metacharacters in a string.
 * Helps prevent ReDoS (Regular Expression Denial of Service) attacks.
 * @param {string} str
 * @returns {string}
 */
export default function escapeRegex(str) {
    if (typeof str !== "string") return "";
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}
