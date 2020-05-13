
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