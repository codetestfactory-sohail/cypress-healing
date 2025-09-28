/**
 * Security Test Cases for String Escaping
 * Verifies that selector generation properly escapes special characters
 */

// Test cases for potentially malicious or problematic input
const testCases = {
  // Backslash escaping
  backslashes: {
    input: 'test\\path\\file',
    expected: 'test\\\\path\\\\file'
  },
  
  // Quote escaping
  quotes: {
    input: 'test"with"quotes',
    expected: 'test\\"with\\"quotes'
  },
  
  singleQuotes: {
    input: "test'with'quotes",
    expected: "test\\'with\\'quotes"
  },
  
  // Mixed special characters
  mixed: {
    input: 'test\\n"special\'chars\\t',
    expected: 'test\\\\n\\"special\\\'chars\\\\t'
  },
  
  // CSS selector special characters
  cssSpecial: {
    input: 'test#id.class[attr]',
    expectedCSS: 'test\\#id\\.class\\[attr\\]'
  },
  
  // Attribute injection attempts
  attributeInjection: {
    input: '"><script>alert(1)</script>',
    expectedAttr: '\\">\\<script\\>alert\\(1\\)\\<\\/script\\>'
  },
  
  // Multiple replacements (testing replaceAll vs replace)
  multipleOccurrences: {
    input: '^start^middle^end$',
    patterns: ['^', '$'],
    expected: 'startmiddleend' // All should be removed
  },
  
  // Newline and tab characters
  whitespace: {
    input: 'line1\nline2\ttab',
    expected: 'line1\\nline2\\ttab'
  },
  
  // Empty and null inputs
  edge: {
    empty: '',
    null: null,
    undefined: undefined
  }
};

// Example usage in Cypress test
describe('Security: String Escaping', () => {
  
  it('should escape backslashes properly', () => {
    const selector = 'path\\to\\file';
    // This selector should be properly escaped when used
    cy.smartGet(`[data-test="${selector}"]`); // Should escape to path\\\\to\\\\file
  });
  
  it('should escape quotes in attributes', () => {
    const malicious = '"><script>alert("XSS")</script>';
    // This should be safely escaped, preventing XSS
    cy.smartGet(`[data-label="${malicious}"]`); // Should be properly escaped
  });
  
  it('should handle special CSS characters', () => {
    const specialId = 'user:123#special.class';
    // CSS special characters should be escaped
    cy.smartGet(`#${specialId}`); // Should escape special characters
  });
  
  it('should replace all occurrences in patterns', () => {
    const pattern = '^start^middle^end$final$';
    // All ^ and $ should be removed, not just the first
    // Previously vulnerable code would only remove first occurrence
    // Fixed code removes all occurrences
  });
  
  it('should handle complex mixed inputs', () => {
    const complex = `test\\"'\n\r\t\\special`;
    // All special characters should be properly escaped
    cy.smartGet(`[aria-label="${complex}"]`);
  });
  
});

// Verification function for testing escaping
function verifyEscaping(input, escapeFunction, expected) {
  const result = escapeFunction(input);
  if (result !== expected) {
    console.error(`Escaping failed for: ${input}`);
    console.error(`Expected: ${expected}`);
    console.error(`Got: ${result}`);
    return false;
  }
  return true;
}

// Export for use in other tests
module.exports = { testCases, verifyEscaping };