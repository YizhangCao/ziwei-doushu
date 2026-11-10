import type { ZiweiChart } from '@/lib/ziwei/types';

// Chart -> prompt text for AI readings (#2). Sends only what a reading uses (AGENTS.md):
// palaces, stars, brightness, 四化, 五行局, 命主/身主, age and 大限 ranges. Never birthInfo or lunarInfo.
export function serializeChartForInterpretation(chart: ZiweiChart): string {
  const palaces = chart.palaces.map((palace) => ({
    name: palace.name,
    branch: palace.branch,
    stars: palace.stars.map((star) => ({
      name: star.name,
      type: star.type,
      brightness: star.brightnessRaw ?? star.brightness,
      siHua: star.siHua,
    })),
    selfSihua: palace.selfSihua,
    daXianAge: palace.daXianAge,
    isMingGong: palace.isMingGong,
    isShenGong: palace.isShenGong,
  }));

  return JSON.stringify({
    wuxingJuName: chart.wuxingJuName,
    mingZhu: chart.mingZhu,
    shenZhu: chart.shenZhu,
    currentAge: chart.currentAge,
    palaces,
    daXians: chart.daXians.map((daXian) => ({
      startAge: daXian.startAge,
      endAge: daXian.endAge,
      palaceName: daXian.palaceName,
      siHua: daXian.siHua,
    })),
  });
}
