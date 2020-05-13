
/**
 * Returns if a value is a string
 * @author Webbjocke: https://webbjocke.com/javascript-check-data-types/
 * @param value value to check
 * @returns {boolean} true if a string, false otherwise
 */
export function isString (value) {
    return typeof value === 'string' || value instanceof String;
}

/**
 * Returns if a value is a function
 * @author Webbjocke: https://webbjocke.com/javascript-check-data-types/
 * @param value value to check
 * @returns {boolean} true if a function, false otherwise
 */
export function isFunction (value) {
    return typeof value === 'function';
}

/**
 * Returns if a value is an integer
 * @param value value to check
 * @returns {boolean} true if a integer, false otherwise
 */
export function isInteger(value) {
    return Number.isInteger(value);
}

/**
 * Returns if a value is an array
 * @param value value to check
 * @returns {boolean} true if an array, false otherwise
 */
export function isArray(value) {
    return Array.isArray(value);
}

/**
 * Returns if a value is an array of a specific type
 * @param value value to check
 * @param fnTypeCheck function that checks the type
 * @param maxSize optional, maximum size of the array to be valid
 */
export function isArrayOf(value, fnTypeCheck, maxSize) {
    if (!isArray(value))
        return false;

    if (maxSize && value.length > maxSize)
        return false;

    return value.every((v) => fnTypeCheck(v));
}
