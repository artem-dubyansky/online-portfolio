
#include <algorithm>

extern "C" {

// Расчёт индекса соответствия профиля ученика выбранному направлению.
// trackMatch: 1 — профиль совпадает, 0 — не совпадает.
// matchedSkills: количество совпавших навыков (0–3).
// hasAchievement: 1 — есть достижения, 0 — нет.

int calculateMatchScore(
    int trackMatch,
    int matchedSkills,
    int hasAchievement
) {
    trackMatch = std::clamp(trackMatch, 0, 1);
    matchedSkills = std::clamp(matchedSkills, 0, 3);
    hasAchievement = std::clamp(hasAchievement, 0, 1);

    int score = 40;

    if (trackMatch == 1) {
        score += 25;
    }

    score += matchedSkills * 10;
    score += hasAchievement * 5;

    return std::clamp(score, 0, 100);
}

}
