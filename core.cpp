#include <algorithm>

// Экспорт функции в WebAssembly (без искажения имени функции компилятором)
extern "C" {

/**
 * Расчет индекса совместимости (в процентах от 0 до 100)
 * 
 * @param trackMatch      1, если выбранный профиль совпадает с профилем школы, иначе 0
 * @param matchedSkills   Количество совпавших навыков и дисциплин из стека (от 0 до 3+)
 * @param hasAchievement  1, если у ученика есть олимпиадные достижения (победитель/призер), иначе 0
 * @param scoreDelta      Разница между прогнозируемым баллом ученика и проходным порогом
 * 
 * @return Итоговый процент совместимости (int)
 */
int calculateMatchScore(int trackMatch, int matchedSkills, int hasAchievement, int scoreDelta) {
    // Базовый уровень совместимости
    int baseScore = 55;

    // Вклад совпадения профильного направления: +18% при точном совпадении, +5% при смежном
    int trackBonus = trackMatch ? 18 : 5;

    // Вклад практических навыков (до 3 навыков по 6% каждый)
    int skillsClamped = std::min(matchedSkills, 3);
    int skillsBonus = skillsClamped * 6;

    // Вклад дипломов олимпиад и конкурсов (+7% при наличии побед/призовых мест)
    int achievementBonus = hasAchievement ? 7 : 0;

    // Корректировка по успеваемости и проходному баллу
    int deltaBonus = 0;
    if (scoreDelta >= 5) {
        deltaBonus = 8;
    } else if (scoreDelta >= 0) {
        deltaBonus = 4;
    } else if (scoreDelta >= -5) {
        deltaBonus = -4;
    } else {
        deltaBonus = -10;
    }

    // Итоговая сумма
    int total = baseScore + trackBonus + skillsBonus + achievementBonus + deltaBonus;

    // Ограничение диапазона от 45% до 99%
    if (total < 45) total = 45;
    if (total > 99) total = 99;

    return total;
}

}
