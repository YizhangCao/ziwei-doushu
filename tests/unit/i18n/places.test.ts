/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview English labels for birthplaces (#59). Every province and city in the
 * picker has one, in Hanyu Pinyin or the established English name. The Chinese name
 * stays the stored value, so only the label changes.
 */

import { describe, it, expect } from 'vitest';
import { PROVINCES } from '@/lib/ziwei/cities';
import { PLACE_EN, placeLabel } from '@/lib/i18n/places-en';

const HAN = /[㐀-鿿豈-﫿]/;
const names = PROVINCES.flatMap((p) => [p.name, ...p.cities.map((c) => c.name)]);

describe('birthplace labels', () => {
  it('cover every province and city in the picker', () => {
    expect(names.filter((n) => !PLACE_EN[n])).toEqual([]);
  });

  it('contain no Chinese characters and no tone marks', () => {
    // Letters, spaces, apostrophes (Xi'an), hyphens, periods and parentheses; the umlaut in Ürümqi is allowed.
    const bad = names.filter((n) => HAN.test(PLACE_EN[n] ?? '') || !/^[A-Za-zÜü' .()-]+$/.test(PLACE_EN[n] ?? ''));
    expect(bad).toEqual([]);
  });

  it('use the established English names where they exist', () => {
    expect(PLACE_EN['北京市']).toBe('Beijing');
    expect(PLACE_EN['内蒙古自治区']).toBe('Inner Mongolia');
    expect(PLACE_EN['陕西省']).toBe('Shaanxi');
    expect(PLACE_EN['山西省']).toBe('Shanxi');
    expect(PLACE_EN['西藏自治区']).toBe('Tibet');
    expect(PLACE_EN['新疆维吾尔自治区']).toBe('Xinjiang');
    expect(PLACE_EN['香港特别行政区']).toBe('Hong Kong');
    expect(PLACE_EN['澳门特别行政区']).toBe('Macao');
    expect(PLACE_EN['台湾省']).toBe('Taiwan');
  });

  it('return the Chinese name unchanged in Chinese and the English label in English', () => {
    expect(placeLabel('北京市', 'zh')).toBe('北京市');
    expect(placeLabel('北京市', 'en')).toBe('Beijing');
  });
});
