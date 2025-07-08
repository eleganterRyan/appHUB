"use client";
import React, { useState } from "react";
import Link from "next/link";

const modes = [
  { key: 'fullTime', label: '全职流程', subtitle: '上传校内博导（全职博导）申请数据，系统将自动分析并生成结果' },
  { key: 'partTime', label: '兼职流程', subtitle: '上传兼职相关Excel文件，系统将自动分析并生成结果' },
];

export default function DegreeWorkflowPage() {
  const [mode, setMode] = useState<'fullTime' | 'partTime'>('fullTime');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultFile, setResultFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rawCount, setRawCount] = useState<number | null>(null);
  const [normalizedCount, setNormalizedCount] = useState<number | null>(null);

  // 获取API基础URL
  const getApiBaseUrl = () => {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      return `${protocol}//${hostname}:5001/api`;
    }
    return 'http://localhost:5001/api';
  };

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setResultFile(null);
      setError(null);
      setRawCount(null);
      setNormalizedCount(null);
    }
  };

  // 上传并处理Excel
  const handleProcess = async () => {
    if (!selectedFile) {
      setError('请先选择Excel文件');
      return;
    }
    setIsProcessing(true);
    setError(null);
    setResultFile(null);
    setRawCount(null);
    setNormalizedCount(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const response = await fetch(`${getApiBaseUrl()}/degree-workflow/fulltime`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = await response.json();
      setResultFile(data.fileName);
      setRawCount(data.raw_count ?? null);
      setNormalizedCount(data.normalized_count ?? null);
    } catch (err: any) {
      setError(err.message || '处理失败');
    } finally {
      setIsProcessing(false);
    }
  };

  // 下载处理结果
  const handleDownload = () => {
    if (!resultFile) return;
    window.open(`${getApiBaseUrl()}/degree-workflow/download?file=${encodeURIComponent(resultFile)}`);
  };

  const fullTimeInstructions = (
    <ol className="list-decimal list-inside text-gray-700 space-y-1">
      <li>请从j系统中下载本年度博导申请数据并上传，系统将实现如下处理：</li>
      <li>一位导师最多有3个招生专业（2学术型、1专业型）</li>
      <li>工作流将自动将某导师的数据整合为一条规范化数据</li>
      <li><span className="font-bold">数据结构：学术型1，分委会1，院系1；学术型2，分委会2，院系2；专业型，分委会3，院系3</span></li>
      <li>同一学术型的招生专业的多个招生院系将被合并为一个字符串</li>
      <li>同一专业型的招生专业的多个分委会与招生院系将被合并为一个字符串</li>
      <li>如有疑问请联系管理员。</li>
    </ol>
  );

  const partTimeInstructions = (
    <ol className="list-decimal list-inside text-gray-700 space-y-1">
      <li>请上传兼职博导相关Excel文件</li>
      <li>系统将自动分析并生成结果</li>
      <li>如有疑问请联系管理员。</li>
    </ol>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
          <Link href="/" className="text-2xl font-bold text-primary-600 hover:opacity-80 transition-opacity">AppHUB</Link>
          <a href="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">返回首页</a>
        </div>
      </nav>

      {/* 主体内容 */}
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-2">学位会工作流</h2>
          <p className="text-lg text-gray-500">{modes.find(m => m.key === mode)?.subtitle}</p>
        </div>

        {/* 顶部栏 */}
        <div className="flex border-b mb-8 justify-center">
          {modes.map((m) => (
            <button
              key={m.key}
              className={`px-6 py-2 font-medium focus:outline-none transition-colors ${mode === m.key ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}
              onClick={() => setMode(m.key as 'fullTime' | 'partTime')}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* 卡片式操作区 */}
        <div className="bg-white rounded-lg shadow p-8 mb-10">
          {mode === 'fullTime' ? (
            <>
              <h3 className="text-xl font-semibold mb-4">校内博导（全职博导）数据分析</h3>
              <div className="mb-4">
                <label className="block mb-2 font-medium">选择Excel文件</label>
                <input type="file" accept=".xlsx,.xls" className="block" onChange={handleFileChange} />
                {selectedFile && (
                  <div className="mt-2 text-sm text-gray-600">已选择文件：{selectedFile.name}</div>
                )}
              </div>
              <button
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-60"
                onClick={handleProcess}
                disabled={isProcessing || !selectedFile}
              >
                {isProcessing ? '正在分析...' : '分析Excel文件'}
              </button>
              {error && <div className="mt-4 text-red-500">{error}</div>}
              {resultFile && (
                <>
                  <div className="mt-4">
                    <button
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
                      onClick={handleDownload}
                    >
                      下载分析结果
                    </button>
                  </div>
                  {(rawCount !== null || normalizedCount !== null) && (
                    <div className="mt-4 text-gray-700 text-center">
                      <div>原数据共有 <span className="font-bold">{rawCount ?? '-'}</span> 条，规范化处理后本年度共有 <span className="font-bold">{normalizedCount ?? '-'}</span> 位博导申请</div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="text-gray-400 text-center py-12">兼职流程开发中...</div>
          )}
        </div>

        {/* 使用说明 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold mb-2">使用说明</h4>
          {mode === 'fullTime' ? fullTimeInstructions : partTimeInstructions}
        </div>
      </div>
    </div>
  );
} 