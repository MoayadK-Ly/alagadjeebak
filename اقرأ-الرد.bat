@echo off
chcp 65001 > nul
title على قد جيبك رقيب — استعراض التقرير والرد
cd /d "%~dp0"

echo ======================================================================
echo  استعراض تقرير رقيب ورد الذكاء الاصطناعي (Antigravity)
echo ======================================================================

if exist "results-repo\latest\answer.md" (
    echo.
    echo [رد الذكاء الاصطناعي الأخير]:
    type "results-repo\latest\answer.md"
    echo.
) else (
    echo.
    echo لم يتم العثور على رد جديد في answer.md بعد.
)

if exist "report.html" (
    echo جاري فتح صفحة التقرير المرئي في المتصفح...
    start "" "report.html"
) else (
    echo لم يتم العثور على ملف report.html. يرجى تشغيل الفحص أولاً.
)

pause
