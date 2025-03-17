'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

// 定义API基础URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface MergeOptions {
  includeHeaders: boolean
}

export default function ExcelMergerApp() {
  const [options, setOptions] = useState<MergeOptions>({
    includeHeaders: true
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{success: boolean, message: string, fileName?: string} | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // 过滤出Excel文件
    const excelFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (fileExt === 'xlsx' || fileExt === 'xls') {
        excelFiles.push(file);
      }
    }
    
    setSelectedFiles(excelFiles);
  };

  const handleMergeExcel = async () => {
    if (selectedFiles.length === 0) {
      setResult({
        success: false,
        message: '请先选择Excel文件'
      });
      return;
    }
    
    setIsProcessing(true);
    setResult(null);
    
    try {
      // 创建FormData对象，用于发送到服务器
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      // 确保includeHeaders参数作为字符串传递，与后端期望的格式匹配
      const includeHeadersValue = options.includeHeaders ? 'true' : 'false';
      formData.append('includeHeaders', includeHeadersValue);
      
      const apiUrl = `${API_BASE_URL}/excel/merge`;
      console.log('正在发送请求到:', apiUrl);
      console.log('文件数量:', selectedFiles.length);
      console.log('包含表头选项:', options.includeHeaders);
      console.log('包含表头参数值:', includeHeadersValue);
      
      // 发送到服务器进行处理 - 使用相对路径或环境变量
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        mode: 'cors',
        headers: {
          // 不要设置 Content-Type，让浏览器自动设置，包含 boundary 信息
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('服务器响应错误:', response.status, errorText);
        throw new Error(`服务器处理失败: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('服务器响应:', data);
      
      setResult({
        success: true,
        message: `成功合并 ${selectedFiles.length} 个Excel文件`,
        fileName: data.fileName
      });
      
      // 清空选择的文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSelectedFiles([]);
    } catch (error) {
      console.error('合并Excel文件失败:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : '合并Excel文件失败，请重试'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-2xl font-bold text-primary-600">AppHUB</Link>
              </div>
            </div>
            <div className="flex items-center">
              <Link href="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                返回首页
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Excel文件合并工具
          </h2>
          <p className="mt-3 text-xl text-gray-500">
            将多个Excel文件合并为一个文件
          </p>
        </div>

        <div className="card mb-8">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">合并选项</h3>
            
            <div className="flex items-center mb-4">
              <input
                id="include-headers"
                type="checkbox"
                checked={options.includeHeaders}
                onChange={(e) => setOptions({...options, includeHeaders: e.target.checked})}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="include-headers" className="ml-2 block text-sm text-gray-900">
                包含表头（第一行）
              </label>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择Excel文件
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                multiple
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              {selectedFiles.length > 0 && (
                <div className="mt-2 text-sm text-gray-500">
                  已选择 {selectedFiles.length} 个文件
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
              选择多个Excel文件，所有文件将被合并为一个文件。
              如果选中"包含表头"，则每个文件的第一行将被保留。
              所有xls格式文件将被自动转换为xlsx格式。
            </p>
            
            <button
              onClick={handleMergeExcel}
              disabled={isProcessing || selectedFiles.length === 0}
              className="btn btn-primary w-full"
            >
              {isProcessing ? '处理中...' : '合并Excel文件'}
            </button>
          </div>
          
          {result && (
            <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <p className="font-medium">{result.message}</p>
              {result.success && result.fileName && (
                <a 
                  href={`${API_BASE_URL}/excel/download/${result.fileName}`}
                  download
                  className="inline-block mt-2 text-primary-600 hover:text-primary-800 underline"
                >
                  下载合并后的文件
                </a>
              )}
            </div>
          )}
        </div>
        
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">使用说明</h3>
          <div className="prose text-gray-500">
            <ol className="list-decimal list-inside space-y-2">
              <li>点击"选择Excel文件"按钮，选择多个Excel文件</li>
              <li>选择是否保留每个文件的表头（第一行）</li>
              <li>点击"合并Excel文件"按钮</li>
              <li>合并完成后，点击下载链接获取合并后的文件</li>
            </ol>
            <p className="mt-4">
              <strong>注意：</strong> 此功能要求所有Excel文件具有相同的列结构。所有xls格式文件将被自动转换为xlsx格式。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 