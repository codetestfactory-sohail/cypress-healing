# Migration Guide: healGet → smartGet

## 🎯 Command Renamed for Better Clarity

We've renamed `cy.healGet()` to `cy.smartGet()` to create a cohesive "smart" command family alongside `cy.smartWait()`.

## Why the Change?

- **Consistency**: Creates a unified "smart" command suite (`smartWait`, `smartGet`)
- **Clarity**: "Smart" immediately conveys intelligent behavior
- **Discoverability**: Easier to find related commands with common prefix

## Migration Steps

### 1. Find and Replace

Replace all occurrences in your test files:

```javascript
// Old
cy.healGet('.selector').click();

// New
cy.smartGet('.selector').click();
```

### 2. Update Custom Commands

If you have custom commands using healGet:

```javascript
// Old
Cypress.Commands.add('myCommand', () => {
  return cy.healGet('[data-cy=element]');
});

// New
Cypress.Commands.add('myCommand', () => {
  return cy.smartGet('[data-cy=element]');
});
```

### 3. Update Page Objects

```javascript
// Old
class LoginPage {
  get submitBtn() { 
    return cy.healGet('.submit'); 
  }
}

// New
class LoginPage {
  get submitBtn() { 
    return cy.smartGet('.submit'); 
  }
}
```

### 4. Update TypeScript Imports

If you're importing types:

```typescript
// Old
import { healGet } from 'cypress-healing';

// New
import { smartGet } from 'cypress-healing';
```

## Quick Find & Replace

### VS Code
- Press `Ctrl+Shift+H` (Windows) or `Cmd+Shift+H` (Mac)
- Find: `healGet`
- Replace: `smartGet`
- Click "Replace All"

### Command Line (Unix/Mac/Git Bash)
```bash
# Find all occurrences
grep -r "healGet" cypress/

# Replace in all .js/.ts files
find cypress -name "*.js" -o -name "*.ts" | xargs sed -i 's/healGet/smartGet/g'
```

### PowerShell (Windows)
```powershell
# Find all occurrences
Get-ChildItem -Path cypress -Recurse -Filter *.js,*.ts | Select-String -Pattern "healGet"

# Replace in all files
Get-ChildItem -Path cypress -Recurse -Include *.js,*.ts | ForEach-Object {
  (Get-Content $_.FullName) -replace 'healGet', 'smartGet' | Set-Content $_.FullName
}
```

## Complete Command Family

You now have a consistent set of smart commands:

```javascript
// Smart waiting
cy.smartWait('.loading');
cy.smartWait('@api');
cy.smartWait(1000);

// Smart element selection with healing
cy.smartGet('.button').click();
cy.smartGet('#form').type('text');
cy.smartGet('[data-cy=submit]').should('be.visible');
```

## Backwards Compatibility

Note: `healGet` is no longer available. All code must be updated to use `smartGet`.

## Need Help?

If you encounter any issues during migration:
1. Check the [README](README.md) for updated documentation
2. Review the [example tests](example/usage.spec.js)
3. Open an issue on GitHub

## Summary

- ✅ Replace all `cy.healGet()` with `cy.smartGet()`
- ✅ No functionality changes - only the name
- ✅ All options and behavior remain the same
- ✅ Creates consistent "smart" command naming