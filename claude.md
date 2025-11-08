# Claude AI Instructions - GothBot Module Marketplace

## Repository Context

This is the **official module marketplace** for [GothomationBot v2.0](https://github.com/GothUncc/gothomationbotV2). It serves as a centralized catalog registry where:

- Module developers submit their creations
- GothBot instances fetch the catalog to display available modules
- Users browse and install modules directly from the bot's admin panel

## Repository Structure

```
gothbot-modules/
├── catalog.json         # Module registry database
├── README.md           # Public-facing marketplace documentation
├── architecture.md     # Module development guide & system architecture
└── claude.md          # This file - AI assistant instructions
```

## Key Files

### catalog.json
The single source of truth for all marketplace modules. Each entry contains:
- Module metadata (id, name, version, description, author)
- Category and tags for discovery
- Download URL and install type
- Requirements (bot version, framework version)
- Documentation links
- Verification status (official/verified flags)

### README.md
User-facing documentation covering:
- Available modules showcase
- Installation instructions
- Module developer submission guidelines
- Module entry format specification

### architecture.md
Technical guide for module developers containing:
- GothBot module system architecture
- Step-by-step module creation instructions
- API reference and event system
- Best practices and security guidelines

## Working with This Repository

### Adding New Modules
1. Review the module submission in detail
2. Validate against the schema in README.md
3. Add entry to catalog.json in alphabetical order by ID
4. Update README.md "Available Modules" section
5. Increment catalog.json version if needed
6. Update lastUpdated timestamp

### Module Entry Requirements
- Valid semver version
- Proper category (overlay|integration|chat|automation|analytics|utility)
- Appropriate tags for discovery
- Accessible downloadUrl
- Documentation links that work
- Correct botVersion requirement format (>=X.Y.Z)
- official: true only for GothBot Team modules
- verified: true only after review process

### Version Management
- catalog.json has its own version (currently 1.0.0)
- Individual modules have independent versions
- Update catalog version on breaking schema changes

## AI Assistant Guidelines

### When Reviewing Module Submissions
1. Verify all required fields are present
2. Check URLs are accessible (documentation, repository, downloadUrl)
3. Validate version formats (semver)
4. Ensure category matches allowed values
5. Verify requirements.botVersion format
6. Check for duplicate module IDs
7. Validate JSON syntax

### When Creating Documentation
- Keep instructions clear and concise
- Include code examples where appropriate
- Reference the main GothomationBot v2 repository for implementation details
- Maintain consistency with existing documentation style

### When Updating catalog.json
- Maintain alphabetical order by module ID
- Update lastUpdated timestamp to current ISO 8601 format
- Preserve JSON formatting (2-space indent)
- Keep modules array well-organized

## Related Repositories

- **GothomationBot v2**: https://github.com/GothUncc/gothomationbotV2
  - Main bot codebase
  - Module system implementation
  - Example modules (modules/ directory)
  - MODULE_SYSTEM.md - Complete module framework documentation

## Current State

- **Catalog Version**: 1.0.0
- **Total Modules**: 1 (Alert System)
- **Last Updated**: 2025-10-16
- **Repository Status**: Newly initialized, ready for expansion

## Next Steps

1. Populate architecture.md with module development guide
2. Prepare for additional module submissions
3. Establish module review and verification process
4. Consider adding CI/CD for catalog validation
