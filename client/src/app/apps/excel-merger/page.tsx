'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

// 使用动态API基础URL
const getApiBaseUrl = () => {
  // 如果在浏览器环境中，使用当前页面的主机名
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:5001/api`;
  }
  // 默认值，用于服务器端渲染
  return 'http://localhost:5001/api';
};

interface MergeOptions {
  includeHeaders: boolean
}

interface SplitOptions {
  columnIndex: number
}

// 定义功能模式
type Mode = 'merge' | 'mergeBySheet' | 'split';

export default function ExcelMergerApp() {
  // 添加模式状态
  const [mode, setMode] = useState<Mode>('merge');
  
  const [mergeOptions, setMergeOptions] = useState<MergeOptions>({
    includeHeaders: true
  })
  
  // 添加拆分选项状态
  const [splitOptions, setSplitOptions] = useState<SplitOptions>({
    columnIndex: 0
  })
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{success: boolean, message: string, fileName?: string, fileNames?: string[], zipFileName?: string} | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 添加列名预览状态
  const [columnNames, setColumnNames] = useState<string[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)

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
    
    // 如果是拆分模式且选择了文件，尝试获取列名
    if (mode === 'split' && excelFiles.length > 0) {
      previewExcelColumns(excelFiles[0]);
    }
  };
  
  // 添加预览Excel列名的函数
  const previewExcelColumns = async (file: File) => {
    setPreviewLoading(true);
    setColumnNames([]);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${getApiBaseUrl()}/excel/preview-columns`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`预览失败: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.columns && Array.isArray(data.columns)) {
        setColumnNames(data.columns);
        console.log('获取到的列名:', data.columns);
      }
    } catch (error) {
      console.error('获取列名失败:', error);
      // 如果API不可用，使用默认列名
      setColumnNames(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
    } finally {
      setPreviewLoading(false);
    }
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
      const includeHeadersValue = mergeOptions.includeHeaders ? 'true' : 'false';
      formData.append('includeHeaders', includeHeadersValue);
      
      const apiUrl = `${getApiBaseUrl()}/excel/merge`;
      console.log('正在发送请求到:', apiUrl);
      console.log('文件数量:', selectedFiles.length);
      console.log('包含表头选项:', mergeOptions.includeHeaders);
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
  
  // 添加拆分Excel文件的函数
  const handleSplitExcel = async () => {
    if (selectedFiles.length === 0) {
      setResult({
        success: false,
        message: '请先选择Excel文件'
      });
      return;
    }
    
    if (selectedFiles.length > 1) {
      setResult({
        success: false,
        message: '拆分功能一次只能处理一个文件'
      });
      return;
    }
    
    setIsProcessing(true);
    setResult(null);
    
    try {
      // 创建FormData对象，用于发送到服务器
      const formData = new FormData();
      formData.append('file', selectedFiles[0]);
      formData.append('columnIndex', splitOptions.columnIndex.toString());
      
      const apiUrl = `${getApiBaseUrl()}/excel/split`;
      console.log('正在发送请求到:', apiUrl);
      console.log('文件名:', selectedFiles[0].name);
      console.log('拆分列索引:', splitOptions.columnIndex);
      
      // 发送到服务器进行处理
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        mode: 'cors'
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
        message: `成功将Excel文件拆分为 ${data.fileCount || '多个'} 个文件`,
        fileNames: data.fileNames,
        zipFileName: data.zipFileName
      });
      
      // 清空选择的文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSelectedFiles([]);
    } catch (error) {
      console.error('拆分Excel文件失败:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : '拆分Excel文件失败，请重试'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSplitFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFiles([file]);
      setResult(null);
      // 预览Excel列名
      await previewExcelColumns(file);
    }
  }

  // 合并Excel文件（逐sheet）
  const handleMergeBySheet = async () => {
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
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      const apiUrl = `${getApiBaseUrl()}/excel/merge-by-sheet`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        mode: 'cors',
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`服务器处理失败: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      setResult({
        success: true,
        message: `成功合并 ${selectedFiles.length} 个Excel文件的所有sheet`,
        fileName: data.fileName
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSelectedFiles([]);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : '合并Excel文件（逐sheet）失败，请重试'
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
            Excel处理工具
          </h2>
          <p className="mt-3 text-xl text-gray-500">
            {mode === 'merge' ? '将多个Excel文件合并为一个文件' : '根据指定列拆分Excel文件'}
          </p>
        </div>
        
        {/* 功能选择选项卡 */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setMode('merge')}
            className={`py-2 px-4 font-medium text-sm focus:outline-none ${
              mode === 'merge'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            合并Excel文件（逐行）
          </button>
          <button
            onClick={() => setMode('mergeBySheet')}
            className={`py-2 px-4 font-medium text-sm focus:outline-none ${
              mode === 'mergeBySheet'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            合并Excel文件（逐sheet）
          </button>
          <button
            onClick={() => setMode('split')}
            className={`py-2 px-4 font-medium text-sm focus:outline-none ${
              mode === 'split'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            拆分Excel文件
          </button>
        </div>

        <div className="card mb-8">
          {mode === 'merge' ? (
            // 合并功能界面
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">合并选项</h3>
              
              <div className="flex items-center mb-4">
                <input
                  id="include-headers"
                  type="checkbox"
                  checked={mergeOptions.includeHeaders}
                  onChange={(e) => setMergeOptions({...mergeOptions, includeHeaders: e.target.checked})}
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
          ) : mode === 'mergeBySheet' ? (
            // 合并逐sheet功能界面
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">合并选项（逐sheet）</h3>
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
                选择多个Excel文件，所有文件的每个sheet都将合并到一个新Excel文件中。
              </p>
              <button
                onClick={handleMergeBySheet}
                disabled={isProcessing || selectedFiles.length === 0}
                className="btn btn-primary w-full"
              >
                {isProcessing ? '处理中...' : '合并Excel文件（逐sheet）'}
              </button>
            </div>
          ) : (
            // 拆分功能界面
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">拆分选项</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择Excel文件
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {selectedFiles.length > 0 && (
                  <div className="mt-2 text-sm text-gray-500">
                    已选择文件: {selectedFiles[0].name}
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择拆分列
                </label>
                
                {previewLoading ? (
                  <p className="text-sm text-gray-500">加载列名中...</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {columnNames.map((name, index) => (
                      <div key={index} className="flex items-center">
                        <input
                          id={`column-${index}`}
                          type="radio"
                          name="column-select"
                          value={index}
                          checked={splitOptions.columnIndex === index}
                          onChange={() => setSplitOptions({...splitOptions, columnIndex: index})}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                        />
                        <label htmlFor={`column-${index}`} className="ml-2 block text-sm text-gray-900 truncate">
                          {name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <p className="text-sm text-gray-500 mb-4">
                选择一个Excel文件和一个列，系统将根据该列的值将数据拆分为多个文件。
                每个拆分后的文件将以该列的值命名。
                Excel的第一行将被视为列标题，不会被拆分。
              </p>
              
              <button
                onClick={handleSplitExcel}
                disabled={isProcessing || selectedFiles.length === 0}
                className="btn btn-primary w-full"
              >
                {isProcessing ? '处理中...' : '拆分Excel文件'}
              </button>
            </div>
          )}
          
          {result && (
            <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <p className="font-medium">{result.message}</p>
              {result.success && mode === 'merge' && result.fileName && (
                <a 
                  href={`${getApiBaseUrl()}/excel/download/${result.fileName}`}
                  download
                  className="inline-block mt-2 text-primary-600 hover:text-primary-800 underline"
                >
                  下载合并后的文件
                </a>
              )}
              {result.success && mode === 'mergeBySheet' && result.fileName && (
                <a
                  href={`${getApiBaseUrl()}/excel/download/${result.fileName}`}
                  download
                  className="inline-block mt-2 text-primary-600 hover:text-primary-800 underline"
                >
                  下载合并后的文件（逐sheet）
                </a>
              )}
              {result.success && mode === 'split' && result.fileNames && result.fileNames.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium mb-1">下载拆分后的文件:</p>
                  {result.zipFileName && (
                    <a 
                      href={`${getApiBaseUrl()}/excel/download/${result.zipFileName}`}
                      download
                      className="block mb-3 text-lg font-medium text-primary-600 hover:text-primary-800 underline"
                    >
                      一键下载所有文件 (ZIP压缩包)
                    </a>
                  )}
                  <div className="max-h-40 overflow-y-auto">
                    {result.fileNames.map((fileName, index) => (
                      <a 
                        key={index}
                        href={`${getApiBaseUrl()}/excel/download/${fileName}`}
                        download
                        className="block mt-1 text-primary-600 hover:text-primary-800 underline"
                      >
                        {fileName.replace(/^split_/, '').replace(/\.xlsx$/, '')}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">使用说明</h3>
          <div className="prose text-gray-500">
            {mode === 'merge' ? (
              <ol className="list-decimal list-inside space-y-2">
                <li>点击"选择Excel文件"按钮，选择多个Excel文件</li>
                <li>选择是否保留每个文件的表头（第一行）</li>
                <li>点击"合并Excel文件"按钮</li>
                <li>合并完成后，点击下载链接获取合并后的文件</li>
              </ol>
            ) : (
              <ol className="list-decimal list-inside space-y-2">
                <li>点击"选择Excel文件"按钮，选择一个Excel文件</li>
                <li>选择要作为拆分依据的列</li>
                <li>点击"拆分Excel文件"按钮</li>
                <li>拆分完成后，点击下载链接获取拆分后的文件</li>
              </ol>
            )}
            <p className="mt-4">
              <strong>注意：</strong> 
              {mode === 'merge' 
                ? '此功能要求所有Excel文件具有相同的列结构。所有xls格式文件将被自动转换为xlsx格式。' 
                : '拆分功能会将Excel的第一行视为列标题。拆分后的文件将以选定列的值命名。'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 