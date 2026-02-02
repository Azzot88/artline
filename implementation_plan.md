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
- Create/Update tests to verify the new structure.
- Ensure `ReplicateService` continues to work (it seemingly uses `ReplicateRequestNormalizer` effectively via the registry or direct import, but we need to check if it depends on the legacy `normalization.py`).

## Implementation Steps

1.  **Create `type_normalizers.py`**: Implement the unified normalizer base.
2.  **Create `resolution_strategy.py`**: Implement the resolution strategy pattern.
3.  **Update `replicate/request_normalizer.py`**: Refactor to use the new components.
4.  **Verify Usage**: Check `replicate_service.py` to ensure it uses the correct class.
5.  **Delete Legacy**: Remove `normalization.py` and `request_normalizer.py` (RequestNormalizerAuth) - *Wait, RequestNormalizerAuth is the current shared util. I will replace its content or redirect it to the new file to avoid breaking imports immediately, OR just refactor it in place if it's the right location.*
    - *Decision*: The user specifically asked for `app/domain/providers/normalization/type_normalizers.py` in the "Solution 2" description ("Create core/normalization/type_normalizers.py"). I will follow that.

6.  **Run Tests**: Run `verify_refactor.py` (if available) or create new tests.

## Verification Plan

### Automated Tests
- Run `pytest app/domain/providers/replicate/test_replicate_normalization.py` (if exists) or create a new test file for the unified normalizer.
- Validating the extracted "Cinema Resolution" logic works independently.

### Manual Verification
- N/A (Backend logic refactor).
