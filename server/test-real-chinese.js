// 测试真实的中文编码问题
const iconv = require('iconv-lite');

function testChineseEncoding() {
  // 模拟Windows ZIP文件中的中文文件名编码问题
  const testCases = [
    '周士超',  // 真实的中文姓名
    '李海悦',
    '袁杰',
    '陈亚博',
    '张宸鸣'
  ];
  
  console.log('测试真实中文编码问题...\n');
  
  testCases.forEach((chineseName, index) => {
    console.log(`${'='.repeat(50)}`);
    console.log(`测试 ${index + 1}: ${chineseName}`);
    console.log(`${'='.repeat(50)}`);
    
    // 模拟Windows ZIP文件的编码过程
    try {
      // 1. 将中文转换为GBK字节
      const gbkBytes = iconv.encode(chineseName, 'gbk');
      console.log(`GBK字节: [${Array.from(gbkBytes).join(',')}]`);
      
      // 2. 将GBK字节错误地解释为latin1字符串（这是问题所在）
      const wrongString = iconv.decode(gbkBytes, 'latin1');
      console.log(`错误解释为latin1: ${wrongString}`);
      console.log(`错误字符串的字符码: ${wrongString.split('').map(c => c.charCodeAt(0)).join(',')}`);
      
      // 3. 尝试修复
      const fixed = fixChineseEncoding(wrongString);
      console.log(`修复结果: ${fixed}`);
      console.log(`修复成功: ${fixed === chineseName ? '是' : '否'}`);
      
    } catch (e) {
      console.log(`测试失败: ${e.message}`);
    }
    
    console.log('');
  });
}

// 修复函数
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
    const gbkStr = iconv.decode(gbkBuffer, 'gbk');
    console.log(`GBK解码: ${text} -> ${gbkStr}`);
    
    if (/[\u4e00-\u9fff]/.test(gbkStr)) {
      console.log(`GBK解码成功: ${text} -> ${gbkStr}`);
      return gbkStr;
    }
  } catch (e) {
    console.log(`GBK解码失败: ${e.message}`);
  }
  
  console.warn(`无法修复编码: ${text}`);
  return text.replace(/[^\w\u4e00-\u9fff\s.-]/g, '_');
}

// 运行测试
testChineseEncoding();
