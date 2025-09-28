# Security Policy & Improvements

## Security Fixes in v0.2.1

### Vulnerabilities Fixed

#### 1. Incomplete String Escaping (HIGH)
- **Location**: `src/selectorUtils.ts:158`
- **Issue**: Used `.replace()` which only replaces first occurrence
- **Fix**: Now uses global regex replacement `/pattern/g`
- **Impact**: Prevented potential bypass of exclusion filters

#### 2. Missing Backslash Escaping (HIGH)  
- **Location**: `src/selectorUtils.ts:169`
- **Issue**: Did not escape backslashes in selector text
- **Fix**: Now escapes backslashes before other characters
- **Impact**: Prevented selector breaking and injection attacks

### New Security Features

1. **CSS Selector Escaping**: Properly escapes special CSS characters
2. **Attribute Value Escaping**: Safely handles attribute values
3. **Comprehensive Protection**: All selector generation now uses proper escaping

## Supported Versions

| Version | Supported | Security Status |
| ------- | --------- | --------------- |
| 0.2.1   | ✅ | All known vulnerabilities fixed |
| 0.2.0   | ❌ | Contains string escaping vulnerabilities |
| 0.1.x   | ❌ | Legacy version, upgrade recommended |

## Reporting Vulnerabilities

If you discover a vulnerability:
1. **DO NOT** create a public GitHub issue
2. Open a SECURITY advisory or email the maintainer
3. Do not disclose publicly until a fix is available

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)
