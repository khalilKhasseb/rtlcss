const { validationError } = require('../utils/errors');

/**
 * Validation service
 */
module.exports = {
  /**
   * Validate RTLCSS options
   * 
   * @param {Object} options - RTLCSS options to validate
   * @returns {Object} Validated and sanitized options
   * @throws {AppError} If validation fails
   */
  validateRtlcssOptions: (options) => {
    // If options is not an object or is null, return empty object
    if (!options || typeof options !== 'object') {
      return {};
    }
    
    const validatedOptions = {};
    const allowedOptions = [
      'autoRename',
      'autoRenameStrict',
      'blacklist',
      'clean',
      'greedy',
      'processUrls',
      'stringMap',
      'useCalc',
    ];
    
    // Check for invalid option names
    const invalidOptions = Object.keys(options).filter(key => !allowedOptions.includes(key));
    if (invalidOptions.length > 0) {
      throw validationError(
        `Invalid RTLCSS options: ${invalidOptions.join(', ')}`,
        'INVALID_OPTIONS'
      );
    }
    
    // Validate boolean options
    for (const boolOption of ['autoRename', 'autoRenameStrict', 'clean', 'greedy', 'processUrls', 'useCalc']) {
      if (boolOption in options) {
        if (typeof options[boolOption] !== 'boolean') {
          throw validationError(
            `Option '${boolOption}' must be a boolean`,
            'INVALID_OPTION_TYPE'
          );
        }
        validatedOptions[boolOption] = options[boolOption];
      }
    }
    
    // Validate blacklist (object)
    if ('blacklist' in options) {
      if (!options.blacklist || typeof options.blacklist !== 'object') {
        throw validationError(
          'Option \'blacklist\' must be an object',
          'INVALID_OPTION_TYPE'
        );
      }
      validatedOptions.blacklist = options.blacklist;
    }
    
    // Validate stringMap (array)
    if ('stringMap' in options) {
      if (!Array.isArray(options.stringMap)) {
        throw validationError(
          'Option \'stringMap\' must be an array',
          'INVALID_OPTION_TYPE'
        );
      }
      validatedOptions.stringMap = options.stringMap;
    }
    
    return validatedOptions;
  },
  
  /**
   * Validate CSS content
   * 
   * @param {string} css - CSS content to validate
   * @returns {boolean} True if the CSS is valid, false otherwise
   */
  validateCss: (css) => {
    // Basic validation - in a real app, use a proper CSS parser
    if (!css || typeof css !== 'string') {
      return false;
    }
    
    // Check for some basic CSS structure
    const hasValidSyntax = /[a-z-]+\s*:.+;/i.test(css);
    
    // Check for balanced braces
    let braces = 0;
    for (let i = 0; i < css.length; i++) {
      if (css[i] === '{') braces++;
      if (css[i] === '}') braces--;
      if (braces < 0) return false; // Unbalanced braces
    }
    
    return braces === 0 && hasValidSyntax;
  }
};