#!/bin/bash
ERRORS=0
FORBIDDEN_WORDS=("optional" "maybe" "reserved" "can be")
JS_FILES=("server.js" "eventProcessor.js" "eventRegistry.js" "lockManager.js" "deterministicSerializer.js")
echo "[RULE 1] No TODO/FIXME..."
for f in "${JS_FILES[@]}"; do if [ -f "$f" ]; then if grep -q -E "TODO|FIXME" "$f"; then echo "  [FAIL] $f contains TODO/FIXME"; ((ERRORS++)); fi; fi; done
echo "[RULE 2] JSON.stringify only in deterministicSerializer.js..."
for f in "${JS_FILES[@]}"; do if [ "$f" != "deterministicSerializer.js" ] && [ -f "$f" ]; then if grep -q "JSON.stringify" "$f"; then echo "  [FAIL] $f uses JSON.stringify"; ((ERRORS++)); fi; fi; done
echo "[RULE 5] Forbidden words..."
for f in "${JS_FILES[@]}"; do if [ -f "$f" ]; then for w in "${FORBIDDEN_WORDS[@]}"; do if grep -qiw "$w" "$f"; then echo "  [FAIL] $f contains forbidden word: $w"; ((ERRORS++)); fi; done; fi; done
if [ $ERRORS -gt 0 ]; then echo "Validation FAILED"; exit 1; else echo "Validation PASSED"; exit 0; fi
