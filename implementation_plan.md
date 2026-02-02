# Implementation Plan - Phase 1: Normalizer Consolidation

Refactor the normalization logic to remove duplication, centralization type handling, and extract business logic (resolution strategies) into a separate component.

## User Review Required

> [!IMPORTANT]
> This refactoring involves deleting the legacy `ReplicateNormalizer` class. Ensure no other parts of the system are directly instantiating `app.domain.providers.replicate.normalization.ReplicateNormalizer` without going through the service layer.

## Proposed Changes

### 1. Unified Type Normalization
**New File:** `app/domain/providers/normalization/type_normalizers.py`
- Create `BaseTypeNormalizer` class.
- Move logic from `RequestNormalizerAuth` (shared utilities) and `ReplicateNormalizer` (legacy) into this class.
- Methods:
  - `normalize_string`
  - `normalize_integer` (with seed handling or generic hooks)
  - `normalize_float`
  - `normalize_boolean`
  - `validate_enum`
  - `normalize_array`
  - `normalize_file_input` (basic validation)

### 2. Extract Resolution Strategy
**New File:** `app/domain/providers/normalization/resolution_strategy.py`
- Create `ResolutionStrategy` abstract base class.
- Create `CinemaResolutionStrategy` implementation.
- Move logic from `ReplicateRequestNormalizer` (lines 26-65) to `CinemaResolutionStrategy`.

### 3. Refactor ReplicateRequestNormalizer
**Target:** `app/domain/providers/replicate/request_normalizer.py`
- Inherit from `BaseTypeNormalizer`.
- Use `CinemaResolutionStrategy` for resolution logic.
- Remove duplicate specific type logic if covered by base class.
- Ensure `_normalize_field` properly dispatches to base methods.

### 4. Cleanup
**Delete:** `app/domain/providers/replicate/normalization.py`
- This file is redundant after the refactor.

### 5. Verification
- **Status**: Ready for Verification
- Created `verify_refactor_lite.py` to run tests without `pytest` dependency (since production env lacks it).
- **Action**: Run `python scripts/verify_refactor_lite.py`

## Implementation Steps

1.  **Create `type_normalizers.py`**: [x] Implemented unified normalizer.
2.  **Create `resolution_strategy.py`**: [x] Implemented resolution strategy.
3.  **Update `replicate/request_normalizer.py`**: [x] Refactored to use new components.
4.  **Verify Usage**: [x] Verified `replicate_service.py` is compatible.
5.  **Delete Legacy**: [x] Removed `normalization.py` and old `request_normalizer.py`.
### 6. Phase 2: Access Control (Current)
- **Status**: Ready for Verification
- Created `verify_access_control.py`

## Implementation Steps (Phase 2)

1.  **Create AccessControlService**: [x] Implemented in `app/domain/catalog/access_control.py`.
2.  **Refactor CatalogService**: [x] Updated to use new service.
3.  **Verify**: [ ] User to run `scripts/verify_access_control.py`.

## Verification Plan

### Automated Tests
- Run `pytest app/domain/providers/replicate/test_replicate_normalization.py` (if exists) or create a new test file for the unified normalizer.
- Validating the extracted "Cinema Resolution" logic works independently.

### Manual Verification
- Run: `docker compose exec web python scripts/verify_refactor_lite.py`
- Run: `docker compose exec web python scripts/verify_access_control.py`
