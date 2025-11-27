# Learnings

Patterns and insights discovered while working on this project.
Claude updates this file when corrected or when discovering project-specific behavior.

## Format

- [YYYY-MM-DD] **Category**: Description of learning

---

## Learnings

<!-- Add new learnings below this line -->

- [2025-11-26] **Documentation vs Reality**: BullMQ is installed in package.json but never imported or used. The "10-minute auto-generation" mentioned in old docs was aspirational, not implemented. Generation is manual-only via API.

- [2025-11-26] **Unused Code**: `backend/src/lib/claude.ts` existed but was completely unused - replaced by `aiProvider.ts` which has its own internal Claude implementation. Always check imports before assuming a file is used.

- [2025-11-26] **Migration Numbering**: Multiple migrations share the same number prefix (e.g., three `006_*.sql` files). This works because migrations are tracked by filename, not number. But avoid creating new duplicates.

- [2025-11-26] **research-system Folder**: This folder was pre-build planning material, not part of the running application. It has been archived to `_archive/research-system/`.

- [2025-11-26] **Config Profiles**: Configuration is hybrid - metadata in database (`configuration_profiles` table) but actual YAML files in `backend/configs/{folder_name}/`. The `folder_name` links them.

- [2025-11-26] **Deprecated Template vs Framework**: The codebase has `template` properties marked `@deprecated` - always use `framework` instead. Old routes `/api/config/templates` still exist for backwards compatibility but prefer `/api/config/frameworks`.

- [2025-11-26] **Score Range**: Documentation mentioned "0-80 scale" but actual code uses 0-100 scale for weighted total scores.

- [2025-11-26] **No jobs/ Folder**: Despite old docs showing `backend/src/jobs/` in the structure, this folder does not exist. Job queue functionality was never fully implemented.

- [2025-11-26] **Ports**: Backend runs on port 5000, frontend on port 6001. These are non-standard ports - don't assume 3000/3001.

- [2025-11-26] **API Key Selection**: API key for generation comes from `settings.yaml` → `api_key_id` field, which references `api_keys.id` in database. Falls back to `is_active` flag if not set.