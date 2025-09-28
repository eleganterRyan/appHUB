// 测试编码修复功能
function fixChineseEncoding(text) {
  if (!text || !/[\x80-\xFF]/.test(text)) {
    return text;
  }
  
  // 首先尝试直接UTF-8解码
  try {
    const utf8Buffer = Buffer.from(text, 'utf8');
    const utf8Str = utf8Buffer.toString('utf8');
    if (/[\u4e00-\u9fff]/.test(utf8Str) && !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(utf8Str)) {
      console.log(`UTF-8直接解码成功: ${text} -> ${utf8Str}`);
      return utf8Str;
    }
  } catch (e) {
    // 忽略错误
  }
  
  // 尝试从latin1重新编码
  const encodings = ['latin1', 'gbk', 'gb2312', 'big5', 'cp936'];
  
  for (const encoding of encodings) {
    try {
      let testStr;
      
      if (encoding === 'latin1') {
        const buffer = Buffer.from(text, 'latin1');
        testStr = buffer.toString('utf8');
      } else {
        const buffer = Buffer.from(text, encoding);
        testStr = buffer.toString('utf8');
      }
      
      if (/[\u4e00-\u9fff]/.test(testStr) && !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(testStr)) {
        console.log(`成功修复编码 (${encoding}): ${text} -> ${testStr}`);
        return testStr;
      }
    } catch (e) {
      continue;
    }
  }
  
  console.warn(`无法修复编码: ${text}`);
  return text.replace(/[^\w\u4e00-\u9fff\s.-]/g, '_');
}

// 测试用例
const testCases = [
  'Ԭ',
  'ڼ',
  '',
  'ʿ',
  'ǲ',
  'Ӻ',
  'ٷ',
  '',
  'S',
  'ǿ',
  'ޱ',
  ''
];

console.log('开始测试编码修复...');
testCases.forEach((testCase, index) => {
  console.log(`\n测试 ${index + 1}: ${testCase}`);
  const result = fixChineseEncoding(testCase);
  console.log(`结果: ${result}`);
});
