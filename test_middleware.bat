@echo off
echo Testing HTML middleware...

echo.
echo Testing API route (should return JSON):
curl -s http://localhost:5000/api/health

echo.
echo Testing static JSON file (should return JSON):
curl -s http://localhost:5000/llms.json

echo.
echo Testing HTML route (should return HTML with DOCTYPE):
curl -s http://localhost:5000/about | findstr "<!DOCTYPE html>"

echo.
echo Testing codex HTML route (should return HTML with DOCTYPE):
curl -s http://localhost:5000/codex/codex-of-mythos-102 | findstr "<!DOCTYPE html>"

echo.
echo Testing non-existent route (should return HTML fallback):
curl -s http://localhost:5000/nonexistent | findstr "<!DOCTYPE html>"

echo.
echo Tests complete.