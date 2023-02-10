import LZString from "lz-string";

/**
 *
 * @param {string} s
 * @return {string}
 */
export const compress = (s) => LZString.compress(s);

/**
 *
 * @param {string} s
 * @returns {string}
 */
export const deCompress = (s) => LZString.decompress(s);

/**
 *
 * @param {string} s
 * @param {string} k
 */
export const store = (s, k) => {
  const zip = compress(s);
  localStorage.setItem(k, zip);
};

/**
 * @returns {string}
 * @param {string} k
 */
export const retrieve = (k) => deCompress(localStorage.getItem(k) || "");
