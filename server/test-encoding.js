// 测试编码修复功能（专门处理Windows ZIP文件）
function fixChineseEncoding(text) {
  if (!text || !/[\x80-\xFF]/.test(text)) {
    return text;
  }
  
  console.log(`原始文本: ${text}, 字符码: ${text.split('').map(c => c.charCodeAt(0)).join(',')}`);
  
  // 方法1：Windows ZIP文件通常使用GBK编码
  try {
    // 将字符串转换为字节数组（latin1编码）
    const bytes = [];
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      bytes.push(charCode & 0xFF); // 取低8位
    }
    
    console.log(`字节数组: [${bytes.join(',')}]`);
    
    // 尝试用GBK解码
    const gbkBuffer = Buffer.from(bytes);
    const gbkStr = gbkBuffer.toString('gbk');
    console.log(`GBK解码: ${text} -> ${gbkStr}`);
    
    if (/[\u4e00-\u9fff]/.test(gbkStr)) {
      console.log(`GBK解码成功: ${text} -> ${gbkStr}`);
      return gbkStr;
    }
  } catch (e) {
    console.log(`GBK解码失败: ${e.message}`);
  }
  
  // 方法2：尝试其他Windows编码
  const windowsEncodings = ['cp936', 'gb2312', 'big5'];
  
  for (const encoding of windowsEncodings) {
    try {
      const bytes = [];
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        bytes.push(charCode & 0xFF);
      }
      
      const buffer = Buffer.from(bytes);
      const testStr = buffer.toString(encoding);
      console.log(`尝试 ${encoding}: ${text} -> ${testStr}`);
      
      if (/[\u4e00-\u9fff]/.test(testStr)) {
        console.log(`成功修复编码 (${encoding}): ${text} -> ${testStr}`);
        return testStr;
      }
    } catch (e) {
      console.log(`编码 ${encoding} 失败: ${e.message}`);
      continue;
    }
  }
  
  // 方法3：如果以上都失败，尝试UTF-8（适用于Mac创建的ZIP）
  try {
    const utf8Buffer = Buffer.from(text, 'utf8');
    const utf8Str = utf8Buffer.toString('utf8');
    if (/[\u4e00-\u9fff]/.test(utf8Str)) {
      console.log(`UTF-8解码成功: ${text} -> ${utf8Str}`);
      return utf8Str;
    }
  } catch (e) {
    console.log(`UTF-8解码失败: ${e.message}`);
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
  console.log(`\n${'='.repeat(50)}`);
  console.log(`测试 ${index + 1}: ${testCase}`);
  console.log(`${'='.repeat(50)}`);
  const result = fixChineseEncoding(testCase);
  console.log(`最终结果: ${result}`);
});
