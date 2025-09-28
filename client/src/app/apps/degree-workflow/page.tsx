"use client";
import React, { useState } from "react";
import Link from "next/link";

const modes = [
  { key: 'fullTime', label: '全职博导流程', subtitle: '上传校内博导（全职博导）申请数据，系统将自动分析并生成结果' },
  { key: 'partTime', label: '兼职博导流程', subtitle: '上传兼职相关Excel文件，系统将自动分析并生成结果' },
  { key: 'fullTimeMaster', label: '全职硕导流程', subtitle: '上传校内硕导（全职硕导）申请数据，系统将自动分析并生成结果' },
  { key: 'crucial', label: '重点审议', subtitle: '上传多个学生文件夹，自动生成合并PDF' },
];

export default function DegreeWorkflowPage() {
  const [mode, setMode] = useState<'fullTime' | 'partTime' | 'fullTimeMaster' | 'crucial'>('fullTime');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [lastYearFile, setLastYearFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentResult, setCurrentResult] = useState<{fileName: string|null, rawCount: number|null, normalizedCount: number|null}|null>(null);
  const [lastResult, setLastResult] = useState<{fileName: string|null, rawCount: number|null, normalizedCount: number|null}|null>(null);
  const [compareResult, setCompareResult] = useState<{inDb: string, curOnly: string, exitFile: string}|null>(null);
  const [error, setError] = useState<string | null>(null);

  // 兼职博导相关 state
  const [ptCurrentFile, setPtCurrentFile] = useState<File | null>(null);
  const [ptLastYearFile, setPtLastYearFile] = useState<File | null>(null);
  const [ptIsProcessing, setPtIsProcessing] = useState(false);
  const [ptCompareResult, setPtCompareResult] = useState<{inDb: string, curOnly: string, exitFile: string, stats?: any}|null>(null);
  const [ptError, setPtError] = useState<string | null>(null);
  const [ptRepeatInfo, setPtRepeatInfo] = useState<any>(null);

  // 全职硕导相关 state
  const [masterFile, setMasterFile] = useState<File | null>(null);
  const [masterIsProcessing, setMasterIsProcessing] = useState(false);
  const [masterResult, setMasterResult] = useState<{fileName: string|null, rawCount: number|null, normalizedCount: number|null}|null>(null);
  const [masterError, setMasterError] = useState<string | null>(null);

  // 重点审议相关 state
  const [crucialZip, setCrucialZip] = useState<File | null>(null);
  const [crucialExcel, setCrucialExcel] = useState<File | null>(null);
  const [crucialIsProcessing, setCrucialIsProcessing] = useState(false);
  const [crucialResult, setCrucialResult] = useState<{success: boolean, message: string, zipFileName?: string} | null>(null);
  const [crucialError, setCrucialError] = useState<string | null>(null);

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
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, which: 'current' | 'last') => {
    if (e.target.files && e.target.files.length > 0) {
      if (which === 'current') {
        setSelectedFile(e.target.files[0]);
        setCurrentResult(null);
        setError(null);
      } else {
        setLastYearFile(e.target.files[0]);
        setLastResult(null);
        setError(null);
      }
    }
  };

  // 分析本年度数据
  const handleProcessCurrent = async () => {
    if (!selectedFile) {
      setError('请先选择本年度校内博导申请数据');
      return;
    }
    setIsProcessing(true);
    setError(null);
    setCurrentResult(null);
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
      setCurrentResult({
        fileName: data.fileName ?? null,
        rawCount: data.raw_count ?? null,
        normalizedCount: data.normalized_count ?? null
      });
    } catch (err: any) {
      setError(err.message || '处理失败');
    } finally {
      setIsProcessing(false);
    }
  };

  // 分析去年数据
  const handleProcessLast = async () => {
    if (!lastYearFile) {
      setError('请先选择去年博导申请数据');
      return;
    }
    setIsProcessing(true);
    setError(null);
    setLastResult(null);
    try {
      const formData = new FormData();
      formData.append('file', lastYearFile);
      const response = await fetch(`${getApiBaseUrl()}/degree-workflow/fulltime`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = await response.json();
      setLastResult({
        fileName: data.fileName ?? null,
        rawCount: data.raw_count ?? null,
        normalizedCount: data.normalized_count ?? null
      });
    } catch (err: any) {
      setError(err.message || '处理失败');
    } finally {
      setIsProcessing(false);
    }
  };

  // 对比按钮处理
  const handleCompare = async () => {
    if (!selectedFile || !lastYearFile) {
      setError('请先选择本年度和去年博导申请数据');
      return;
    }
    setIsProcessing(true);
    setError(null);
    setCompareResult(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/degree-workflow/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentFileName: selectedFile.name,
          lastYearFileName: lastYearFile.name
        }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = await response.json();
      setCompareResult(data);
    } catch (err: any) {
      setError(err.message || '对比失败');
    } finally {
      setIsProcessing(false);
    }
  };

  // 兼职博导文件选择
  const handlePtFileChange = (e: React.ChangeEvent<HTMLInputElement>, which: 'current' | 'last') => {
    if (e.target.files && e.target.files.length > 0) {
      if (which === 'current') {
        setPtCurrentFile(e.target.files[0]);
        setPtCompareResult(null);
        setPtRepeatInfo(null);
        setPtError(null);
      } else {
        setPtLastYearFile(e.target.files[0]);
        setPtCompareResult(null);
        setPtRepeatInfo(null);
        setPtError(null);
      }
    }
  };

  // 兼职博导分析对比
  const handlePtCompare = async () => {
    if (!ptCurrentFile || !ptLastYearFile) {
      setPtError('请先上传本年度和去年兼职博导数据');
      return;
    }
    setPtIsProcessing(true);
    setPtError(null);
    setPtCompareResult(null);
    setPtRepeatInfo(null);
    try {
      const formData = new FormData();
      formData.append('currentFile', ptCurrentFile);
      formData.append('lastYearFile', ptLastYearFile);
      const response = await fetch(`${getApiBaseUrl()}/degree-workflow/compare-parttime`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const text = await response.text();
        try {
          const errData = JSON.parse(text);
          if (errData.repeatInfo) {
            setPtRepeatInfo(errData.repeatInfo);
            setPtError(errData.message || '数据存在重复');
            return;
          }
        } catch {}
        throw new Error(text);
      }
      const data = await response.json();
      setPtCompareResult(data);
    } catch (err: any) {
      setPtError(err.message || '对比失败');
    } finally {
      setPtIsProcessing(false);
    }
  };

  // 全职硕导文件选择
  const handleMasterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setMasterFile(e.target.files[0]);
      setMasterResult(null);
      setMasterError(null);
    }
  };

  // 全职硕导分析
  const handleProcessMaster = async () => {
    if (!masterFile) {
      setMasterError('请先选择本年度硕导申请数据');
      return;
    }
    setMasterIsProcessing(true);
    setMasterError(null);
    setMasterResult(null);
    try {
      const formData = new FormData();
      formData.append('file', masterFile);
      const response = await fetch(`${getApiBaseUrl()}/degree-workflow/fulltime-master`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = await response.json();
      setMasterResult({
        fileName: data.fileName ?? null,
        rawCount: data.raw_count ?? null,
        normalizedCount: data.normalized_count ?? null
      });
    } catch (err: any) {
      setMasterError(err.message || '处理失败');
    } finally {
      setMasterIsProcessing(false);
    }
  };

  // 重点审议处理
  const handleCrucialZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrucialZip(e.target.files[0]);
      setCrucialResult(null);
      setCrucialError(null);
    }
  };
  const handleCrucialExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrucialExcel(e.target.files[0]);
      setCrucialResult(null);
      setCrucialError(null);
    }
  };
  const handleCrucialProcess = async () => {
    if (!crucialZip) {
      setCrucialError('请先选择zip压缩包');
      return;
    }
    if (!crucialExcel) {
      setCrucialError('请先选择学生信息Excel');
      return;
    }
    setCrucialIsProcessing(true);
    setCrucialResult(null);
    setCrucialError(null);
    try {
      const formData = new FormData();
      formData.append('zip', crucialZip);
      formData.append('excel', crucialExcel);
      const response = await fetch(`${getApiBaseUrl()}/degree-workflow/crucial`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = await response.json();
      setCrucialResult({ success: true, message: '处理成功', zipFileName: data.zipFileName });
    } catch (err: any) {
      setCrucialError(err.message || '处理失败');
    } finally {
      setCrucialIsProcessing(false);
    }
  };

  const fullTimeInstructions = (
    <ol className="list-decimal list-inside text-gray-700 space-y-1">
      <li>请从j系统中下载本年度/去年博导申请数据并上传，点击分析本年度/去年数据，系统将实现如下处理(2-6)：</li>
      <li>一位导师最多有3个招生专业（2学术型、1专业型）</li>
      <li>工作流将自动将某导师的数据整合为一条规范化数据</li>
      <li><span className="font-bold">数据结构：学术型1，分委会1，院系1；学术型2，分委会2，院系2；专业型，分委会3，院系3</span></li>
      <li>同一学术型的招生专业的多个招生院系将被合并为一个字符串</li>
      <li>同一专业型的招生专业的多个分委会与招生院系将被合并为一个字符串</li>
      <li>点击对比本年度与去年数据，系统将自动生成在库申请（含超龄与专业调整）、本年度申请（含超龄）、本年度退出三个文件</li>
      <li>注：在是否超龄字段中，职称争议默认为超龄</li>
      <li><span className="font-bold">本流程旨在减轻人工数据处理压力，但特殊情况仍需人工调整，尤其是恢复的博导申请需手动从本年度申请数据中调整至在库申请中</span></li>
      <li>如有疑问请联系管理员。</li>
    </ol>
  );

  const partTimeInstructions = (
    <ol className="list-decimal list-inside text-gray-700 space-y-1">
      <li>兼职博导模版以学位办邮件中的附件为准</li>
      <li>本年度兼职博导数据由各学院提交后汇总得到</li>
      <li>去年兼职博导数据以去年学部上会通过文件为准</li>
    </ol>
  );

  const fullTimeMasterInstructions = (
    <ol className="list-decimal list-inside text-gray-700 space-y-1">
      <li>全职硕导的本年度数据请从j系统中导出</li>
      <li>恢复的硕导各学院默认不从j系统提交，但是如需使用本工作流，务必提醒各学院也将恢复的硕导从j系统提交</li>
      <li>在库硕导申请直接使用学部上会通过的最终文件，但一定要剔除掉退出的硕导</li>
    </ol>
  );

  const crucialInstructions = (
    <ol className="list-decimal list-inside text-gray-700 space-y-1">
      <li>由于windows压缩软件对中文文件名支持不佳，请使用Mac或Linux系统创建zip压缩包</li>
      <li>请为每位重点审议学生单独创建一个文件夹，文件夹名为学生姓名（需与Excel一致），并把所有文件夹打包为zip，但不要把excel文件打包进去</li>
      <li>学生文件夹中所有材料文件名首位必须为数字，并按照如下顺序命名：
        <ol className="list-decimal ml-6">
          <li>学部送复审专家意见</li>
          <li>答辩决议</li>
          <li>论文清单</li>
          <li>评阅意见</li>
          <li>反馈表</li>
          <li>(依次类推)</li>
        </ol>
      </li>
      <li>上传的Excel中必须包含学号、姓名、专业三列，且姓名需与文件夹名一致。</li>
      <li>点击“开始合并”后，系统将自动为每位重点审议学生创建一个复审材料PDF，PDF中包含封面及该学生文件夹中的所有材料。</li>
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
              onClick={() => setMode(m.key as any)}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* 卡片式操作区 */}
        <div className="bg-white rounded-lg shadow p-8 mb-10">
          {mode === 'crucial' ? (
            <>
              <div className="mb-4">
                <div className="mb-1 font-semibold text-blue-700">请上传包含所有学生文件夹的zip压缩包</div>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleCrucialZipChange}
                  className="block"
                />
                {crucialZip && (
                  <div className="mt-2 text-sm text-gray-600">已选择zip文件：{crucialZip.name}</div>
                )}
                <div className="mb-1 font-semibold text-blue-700 mt-4">请上传学生信息Excel</div>
                <input
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={handleCrucialExcelChange}
                  className="block"
                />
                {crucialExcel && (
                  <div className="mt-2 text-sm text-gray-600">已选择Excel文件：{crucialExcel.name}</div>
                )}
                <button
                  className="mt-4 w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-60"
                  onClick={handleCrucialProcess}
                  disabled={crucialIsProcessing || !crucialZip || !crucialExcel}
                >
                  {crucialIsProcessing ? '正在处理...' : '开始合并'}
                </button>
                {crucialResult && crucialResult.success && crucialResult.zipFileName && (
                  <div className="mt-4">
                    <a
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors block text-center"
                      href={`${getApiBaseUrl()}/degree-workflow/download?file=${encodeURIComponent(crucialResult.zipFileName)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      下载合并后的PDF压缩包
                    </a>
                  </div>
                )}
                {crucialError && (
                  <div className="mt-2 text-red-600 text-center">{crucialError}</div>
                )}
              </div>
              {/* 不再显示上方蓝色说明栏，说明内容已移至下方白色框 */}
            </>
          ) : mode === 'fullTime' ? (
            <>
              <div className="mb-4">
                <div className="mb-1 font-semibold text-blue-700">请上传本年度校内博导申请数据</div>
                
                <input type="file" accept=".xlsx,.xls" className="block" onChange={e => handleFileChange(e, 'current')} />
                {selectedFile && (
                  <div className="mt-2 text-sm text-gray-600">已选择文件：{selectedFile.name}</div>
                )}
                <button
                  className="mt-4 w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-60"
                  onClick={handleProcessCurrent}
                  disabled={isProcessing || !selectedFile}
                >
                  {isProcessing ? '正在分析...' : '分析本年度数据'}
                </button>
                {currentResult && (
                  <>
                    <div className="mt-4">
                      <button
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
                        onClick={() => {
                          if (currentResult.fileName) window.open(`${getApiBaseUrl()}/degree-workflow/download?file=${encodeURIComponent(currentResult.fileName)}`);
                        }}
                      >
                        下载分析结果
                      </button>
                    </div>
                    {(currentResult.rawCount !== null || currentResult.normalizedCount !== null) && (
                      <div className="mt-4 text-gray-700 text-center">
                        <div>原数据共有 <span className="font-bold">{currentResult.rawCount ?? '-'}</span> 条，规范化处理后本年度共有 <span className="font-bold">{currentResult.normalizedCount ?? '-'}</span> 位博导申请</div>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="mb-4">
                <div className="mb-1 font-semibold text-blue-700">请上传去年博导申请数据</div>
               
                <input type="file" accept=".xlsx,.xls" className="block" onChange={e => handleFileChange(e, 'last')} />
                {lastYearFile && (
                  <div className="mt-2 text-sm text-gray-600">已选择文件：{lastYearFile.name}</div>
                )}
                <button
                  className="mt-4 w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-60"
                  onClick={handleProcessLast}
                  disabled={isProcessing || !lastYearFile}
                >
                  {isProcessing ? '正在分析...' : '分析去年数据'}
                </button>
                {lastResult && (
                  <>
                    <div className="mt-4">
                      <button
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
                        onClick={() => {
                          if (lastResult.fileName) window.open(`${getApiBaseUrl()}/degree-workflow/download?file=${encodeURIComponent(lastResult.fileName)}`);
                        }}
                      >
                        下载分析结果
                      </button>
                    </div>
                    {(lastResult.rawCount !== null || lastResult.normalizedCount !== null) && (
                      <div className="mt-4 text-gray-700 text-center">
                        <div>原数据共有 <span className="font-bold">{lastResult.rawCount ?? '-'}</span> 条，规范化处理后本年度共有 <span className="font-bold">{lastResult.normalizedCount ?? '-'}</span> 位博导申请</div>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="mb-4 flex flex-col gap-2">
                <button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-60"
                  onClick={async () => {
                    if (!currentResult?.fileName || !lastResult?.fileName) {
                      setError('请先完成本年度和去年数据的分析！');
                      return;
                    }
                    setIsProcessing(true);
                    setError(null);
                    setCompareResult(null);
                    try {
                      const response = await fetch(`${getApiBaseUrl()}/degree-workflow/compare`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          currentFileName: currentResult.fileName,
                          lastYearFileName: lastResult.fileName
                        }),
                      });
                      if (!response.ok) {
                        throw new Error(await response.text());
                      }
                      const data = await response.json();
                      setCompareResult(data);
                    } catch (err: any) {
                      setError(err.message || '对比失败');
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  disabled={isProcessing || !currentResult?.fileName || !lastResult?.fileName}
                >
                  {isProcessing ? '正在对比...' : '对比本年度与去年数据'}
                </button>
                {compareResult && (
                  <div className="mt-4 text-center space-y-2">
                    <div>
                      <a className="text-blue-700 underline" href={`${getApiBaseUrl()}/degree-workflow/download?file=${encodeURIComponent(compareResult.inDb)}`} target="_blank" rel="noopener noreferrer">下载在库申请（含超龄与专业调整）</a>
                    </div>
                    <div>
                      <a className="text-blue-700 underline" href={`${getApiBaseUrl()}/degree-workflow/download?file=${encodeURIComponent(compareResult.curOnly)}`} target="_blank" rel="noopener noreferrer">下载本年度申请（含超龄）</a>
                    </div>
                    <div>
                      <a className="text-blue-700 underline" href={`${getApiBaseUrl()}/degree-workflow/download?file=${encodeURIComponent(compareResult.exitFile)}`} target="_blank" rel="noopener noreferrer">下载本年度退出</a>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : mode === 'partTime' ? (
            <>
              <div className="mb-4">
                <div className="mb-1 font-semibold text-blue-700">请上传本年度兼职博导数据</div>

                <input type="file" accept=".xlsx,.xls" className="block" onChange={e => handlePtFileChange(e, 'current')} />
                {ptCurrentFile && (
                  <div className="mt-2 text-sm text-gray-600">已选择文件：{ptCurrentFile.name}</div>
                )}
              </div>
              <div className="mb-4">
                <div className="mb-1 font-semibold text-blue-700">请上传去年兼职博导数据</div>
               
                <input type="file" accept=".xlsx,.xls" className="block" onChange={e => handlePtFileChange(e, 'last')} />
                {ptLastYearFile && (
                  <div className="mt-2 text-sm text-gray-600">已选择文件：{ptLastYearFile.name}</div>
                )}
              </div>
              <div className="mb-4 flex flex-col gap-2">
                <button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-60"
                  onClick={handlePtCompare}
                  disabled={ptIsProcessing || !ptCurrentFile || !ptLastYearFile}
                >
                  {ptIsProcessing ? '正在分析对比...' : '分析对比'}
                </button>
                {ptError && (
                  <div className="mt-2 text-red-600 text-center">{ptError}</div>
                )}
                {ptRepeatInfo && (
                  <div className="mt-2 text-orange-600 text-center">
                    <div>存在重复数据，移动电话如下：</div>
                    <pre className="bg-orange-50 p-2 rounded text-xs overflow-x-auto max-h-40">{JSON.stringify(ptRepeatInfo, null, 2)}</pre>
                  </div>
                )}
                {ptCompareResult && (
                  <div className="mt-4 text-center space-y-2">
                    <div>
                      <a className="text-blue-700 underline" href={`${getApiBaseUrl()}/degree-workflow/download?file=${encodeURIComponent(ptCompareResult.inDb)}`} target="_blank" rel="noopener noreferrer">下载在库申请</a>
                    </div>
                    <div>
                      <a className="text-blue-700 underline" href={`${getApiBaseUrl()}/degree-workflow/download?file=${encodeURIComponent(ptCompareResult.curOnly)}`} target="_blank" rel="noopener noreferrer">下载本年度新增</a>
                    </div>
                    <div>
                      <a className="text-blue-700 underline" href={`${getApiBaseUrl()}/degree-workflow/download?file=${encodeURIComponent(ptCompareResult.exitFile)}`} target="_blank" rel="noopener noreferrer">下载本年度退出</a>
                    </div>
                  </div>
                )}
                {ptCompareResult?.stats && (
                  <div className="mt-4 text-center text-gray-700 space-y-1">
                    <div>
                      在库申请 <span className="font-bold">{ptCompareResult.stats.in_db_count}</span> 人，
                      其中含 <span className="font-bold">{ptCompareResult.stats.in_db_overage}</span> 超龄，
                      <span className="font-bold">{ptCompareResult.stats.in_db_major_changed}</span> 专业调整
                    </div>
                    <div>
                      本年度新增 <span className="font-bold">{ptCompareResult.stats.cur_only_count}</span> 人，
                      其中含 <span className="font-bold">{ptCompareResult.stats.cur_only_overage}</span> 超龄
                    </div>
                    <div>
                      本年度退出 <span className="font-bold">{ptCompareResult.stats.exit_count}</span> 人
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <div className="mb-1 font-semibold text-blue-700">请上传本年度硕导申请数据</div>
               
                <input type="file" accept=".xlsx,.xls" className="block" onChange={handleMasterFileChange} />
                {masterFile && (
                  <div className="mt-2 text-sm text-gray-600">已选择文件：{masterFile.name}</div>
                )}
                <button
                  className="mt-4 w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-60"
                  onClick={handleProcessMaster}
                  disabled={masterIsProcessing || !masterFile}
                >
                  {masterIsProcessing ? '正在分析...' : '分析本年度数据'}
                </button>
                {masterResult && (
                  <div className="mt-4">
                    <button
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
                      onClick={() => {
                        if (masterResult.fileName) window.open(`${getApiBaseUrl()}/degree-workflow/download?file=${encodeURIComponent(masterResult.fileName)}`);
                      }}
                    >
                      下载规范化结果
                    </button>
                  </div>
                )}
                {masterResult && (masterResult.rawCount !== null || masterResult.normalizedCount !== null) && (
                  <div className="mt-4 text-gray-700 text-center">
                    <div>原数据共有 <span className="font-bold">{masterResult.rawCount ?? '-'}</span> 条，规范化处理后本年度共有 <span className="font-bold">{masterResult.normalizedCount ?? '-'}</span> 位硕导申请</div>
                  </div>
                )}
                {masterError && (
                  <div className="mt-2 text-red-600 text-center">{masterError}</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 使用说明 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold mb-2 text-gray-800">使用说明</h4>
          {mode === 'fullTime' && fullTimeInstructions}
          {mode === 'partTime' && partTimeInstructions}
          {mode === 'fullTimeMaster' && fullTimeMasterInstructions}
          {mode === 'crucial' && crucialInstructions}
        </div>
      </div>
    </div>
  );
} 