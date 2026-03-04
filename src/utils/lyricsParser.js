// src/utils/lyricsParser.js

export const processLyricsForGame = (rawLyrics, maxGaps = 7) => {
  const lines = rawLyrics.split('\n');
  
  const processedLines = [];
  const validGapIndices = [];

  // 整理所有可用的行
  lines.forEach((line, index) => {
    const text = line.trim();
    if (text.length > 3 && !text.startsWith('（') && !text.startsWith('＝＝')) {
      validGapIndices.push(index);
    }
    processedLines.push({ id: `line-${index}`, text: text, isGap: false });
  });

  // ★ 智慧演算法：隨機抽取，且絕對避開連續相鄰的行
  const selectedIndices = [];
  const shuffledValidIndices = validGapIndices.sort(() => 0.5 - Math.random());

  for (let i = 0; i < shuffledValidIndices.length; i++) {
    const idx = shuffledValidIndices[i];
    // 檢查它的上一行與下一行是否已經在候選名單中
    if (!selectedIndices.includes(idx - 1) && !selectedIndices.includes(idx + 1)) {
      selectedIndices.push(idx);
    }
    if (selectedIndices.length >= maxGaps) break;
  }
  
  const stickers = [];
  selectedIndices.forEach(idx => {
    processedLines[idx].isGap = true;
    stickers.push({
      id: `line-${idx}`, 
      text: processedLines[idx].text
    });
  });

  return {
    lines: processedLines,
    stickers: stickers.sort(() => 0.5 - Math.random()) // 再次打亂作為選項
  };
};