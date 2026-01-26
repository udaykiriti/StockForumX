# Contributing Guidelines

Thank you for considering contributing to StockForumX! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards others

## How to Contribute

### Reporting Bugs

**Before submitting a bug report:**
- Check existing issues to avoid duplicates
- Verify the bug exists in the latest version
- Collect relevant information (OS, browser, Node version)

**Bug Report Template:**
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 120]
- Node version: [e.g., 18.17.0]
```

### Suggesting Features

**Feature Request Template:**
```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features.

**Additional context**
Any other context or screenshots.
```

### Pull Requests

#### Process

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub
   git clone https://github.com/YOUR_USERNAME/StockForumX.git
   cd StockForumX
   ```

2. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make your changes**
   - Follow code style guidelines
   - Add tests if applicable
   - Update documentation

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Go to original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill in PR template

#### PR Template

```markdown
**Description**
Brief description of changes.

**Type of change**
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

**How Has This Been Tested?**
Describe the tests you ran.

**Checklist:**
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where needed
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
```

## Development Guidelines

### Code Style

#### JavaScript/React

**Formatting:**
- Use 4 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Max line length: 100 characters

**Naming:**
- Components: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: Match component name

**Example:**
```javascript
import React, { useState } from 'react';

const API_BASE_URL = 'http://localhost:5000';

function UserProfile({ userId }) {
    const [user, setUser] = useState(null);
    
    const fetchUser = async () => {
        // Implementation
    };
    
    return (
        <div className="user-profile">
            {/* JSX */}
        </div>
    );
}

export default UserProfile;
```

#### CSS

**Naming:** Use BEM methodology
```css
.block {}
.block__element {}
.block--modifier {}
```

**Example:**
```css
.user-profile {}
.user-profile__header {}
.user-profile__header--highlighted {}
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

**Examples:**
```bash
feat(predictions): add timeframe filter
fix(auth): resolve token expiration issue
docs(api): update endpoint documentation
style(navbar): improve responsive layout
refactor(utils): simplify reputation calculation
test(questions): add unit tests for Q&A
chore(deps): update dependencies
```

### Testing

#### Manual Testing

Before submitting PR:
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on mobile (responsive)
- [ ] Test all affected features
- [ ] Check console for errors
- [ ] Verify API calls succeed

#### Writing Tests

**Frontend (if applicable):**
```javascript
import { render, screen } from '@testing-library/react';
import UserProfile from './UserProfile';

test('renders user profile', () => {
    render(<UserProfile userId="123" />);
    expect(screen.getByText(/profile/i)).toBeInTheDocument();
});
```

**Backend (if applicable):**
```javascript
import request from 'supertest';
import app from '../index';

describe('GET /api/stocks', () => {
    it('should return stocks', async () => {
        const res = await request(app).get('/api/stocks');
        expect(res.statusCode).toBe(200);
        expect(res.body.stocks).toBeDefined();
    });
});
```

### Documentation

When adding features:
- Update relevant `.md` files in `docs/`
- Add JSDoc comments for functions
- Update API documentation if endpoints change
- Add examples where helpful

**JSDoc Example:**
```javascript
/**
 * Calculate user reputation based on prediction accuracy
 * @param {number} accuratePredictions - Number of accurate predictions
 * @param {number} totalPredictions - Total number of predictions
 * @returns {number} Calculated reputation score
 */
export const calculateReputation = (accuratePredictions, totalPredictions) => {
    // Implementation
};
```

## Project-Specific Guidelines

### Adding New Features

1. **Discuss first** - Open an issue to discuss major changes
2. **Plan** - Design the feature before coding
3. **Implement** - Follow existing patterns
4. **Test** - Ensure it works
5. **Document** - Update docs

### Backend Changes

- Add input validation
- Handle errors properly
- Add appropriate indexes
- Update API documentation
- Consider performance impact

### Frontend Changes

- Ensure responsive design
- Add loading states
- Handle errors gracefully
- Follow existing UI patterns
- Optimize performance

### Database Changes

- Create migration if needed
- Update seeders
- Add indexes
- Document schema changes
- Consider backward compatibility

## Review Process

### What We Look For

**Good:**
- Clear, focused changes
- Follows code style
- Includes tests
- Updates documentation
- No breaking changes (or clearly marked)

**Needs Work:**
- Unrelated changes mixed in
- No description
- Breaking changes without notice
- Missing tests
- Undocumented

### Getting Your PR Merged

1. **Pass CI checks** (when implemented)
2. **Address review comments**
3. **Keep PR updated** with main branch
4. **Be patient** - reviews take time
5. **Be responsive** to feedback

## Community

### Getting Help

- **Documentation**: Check `docs/` folder
- **Issues**: Search existing issues
- **Discussions**: Use GitHub Discussions
- **Questions**: Open an issue with `question` label

### Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to StockForumX!**
