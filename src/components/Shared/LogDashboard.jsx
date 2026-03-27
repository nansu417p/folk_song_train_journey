import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

const LogDashboard = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, longest, shortest

  const rawReports = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('folk_song_tracking_reports') || '[]');
    } catch {
      return [];
    }
  }, []);

  const filteredAndSortedReports = useMemo(() => {
    let result = [...rawReports];

    if (searchTerm.trim()) {
      result = result.filter(r => r.sessionName.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    result.sort((a, b) => {
      if (sortBy === 'longest') return b.analysis.sessionDuration - a.analysis.sessionDuration;
      if (sortBy === 'shortest') return a.analysis.sessionDuration - b.analysis.sessionDuration;
      return 0;
    });

    if (sortBy === 'newest') {
      result.reverse(); 
    }
    return result;
  }, [rawReports, searchTerm, sortBy]);

  const handleExportCSV = () => {
    if (rawReports.length === 0) return;
    
    // 收集所有出現過的頁面/車廂名稱 (Unique keys)
    const allPageKeys = new Set();
    rawReports.forEach(r => {
      Object.keys(r.analysis.clicksByPage || {}).forEach(k => allPageKeys.add(k));
      Object.keys(r.analysis.movesByPage || {}).forEach(k => allPageKeys.add(k));
      Object.keys(r.analysis.dwellTimeByPage || {}).forEach(k => allPageKeys.add(k));
    });
    const pages = Array.from(allPageKeys).sort();

    // CSV Header (with BOM for Excel encoding support)
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
    csvContent += "追蹤紀錄名稱,體驗總時長(秒),總事件數,總點擊數,車廂平均停留(秒)";
    pages.forEach(p => {
      csvContent += `,${p}_點擊次數,${p}_滑鼠位移,${p}_停留時間(秒)`;
    });
    csvContent += "\n";

    rawReports.forEach(r => {
      const durationS = (r.analysis.sessionDuration / 1000).toFixed(1);
      const totalEvents = r.analysis.totalEvents;
      const totalClicks = Object.values(r.analysis.clicksByPage || {}).reduce((a, b) => a + b, 0);
      const dwellKeysLength = Object.keys(r.analysis.dwellTimeByPage || {}).length || 1;
      const avgDwell = (Object.values(r.analysis.dwellTimeByPage || {}).reduce((a, b) => a + b, 0) / 1000 / dwellKeysLength).toFixed(1);
      
      let row = `"${r.sessionName}",${durationS},${totalEvents},${totalClicks},${isNaN(avgDwell) ? 0 : avgDwell}`;
      
      pages.forEach(p => {
        const clicks = r.analysis.clicksByPage[p] || 0;
        const moves = r.analysis.movesByPage[p] || 0;
        const dwell = ((r.analysis.dwellTimeByPage[p] || 0) / 1000).toFixed(1);
        row += `,${clicks},${moves},${dwell}`;
      });
      
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tracking_academic_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClear = () => {
    if(window.confirm('確定要清除所有本機追蹤紀錄嗎？此動作無法復原。')) {
      localStorage.removeItem('folk_song_tracking_reports');
      window.location.reload();
    }
  };

  return (
    <motion.div 
      key="log"
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="absolute inset-0 z-[100] bg-gray-100 flex items-center justify-center p-4 md:p-8 select-none pointer-events-auto"
    >
      <div className="bg-white w-full max-w-6xl h-full rounded-xl shadow-2xl border border-gray-300 flex flex-col overflow-hidden relative font-serif">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-6 text-gray-400 hover:text-gray-800 hover:scale-110 text-4xl font-bold transition-all z-10 leading-none"
        >
          ×
        </button>
        
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex flex-col gap-4 relative z-0">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800 tracking-widest">後台系統：歷次旅程分析報表</h2>
            <div className="flex gap-3 md:mr-10 mr-4">
              <button 
                onClick={() => {
                  if (rawReports.length === 0) return;
                  const jsonString = JSON.stringify(rawReports, null, 2);
                  const blob = new Blob([jsonString], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `tracking_raw_data_${new Date().toISOString().slice(0,10)}.json`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 font-bold tracking-widest shadow-sm flex items-center gap-2 transition-colors"
                title="下載包含完整點擊座標與游標軌跡的原始資料包"
              >
                下載完整 JSON
              </button>
              <button 
                onClick={handleExportCSV}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 font-bold tracking-widest shadow-sm flex items-center gap-2 transition-colors"
                title="匯出成 CSV 摘要供 Excel 分析"
              >
                匯出 CSV
              </button>
              <button 
                onClick={handleClear} 
                className="px-4 py-2 text-sm bg-red-100 text-red-600 rounded-md hover:bg-red-200 font-bold tracking-widest transition-colors"
              >
                清除紀錄
              </button>
            </div>
          </div>
          
          <div className="flex gap-6 items-center bg-white p-3 rounded-lg border border-gray-200 shadow-inner">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-gray-500 font-bold text-sm tracking-widest whitespace-nowrap">名稱搜尋：</span>
              <input 
                type="text" 
                placeholder="輸入關鍵字..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="flex-1 max-w-[200px] px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-bold text-sm tracking-widest whitespace-nowrap">排序方式：</span>
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-sm bg-white cursor-pointer"
              >
                <option value="newest">建立時間 (新到舊)</option>
                <option value="oldest">建立時間 (舊到新)</option>
                <option value="longest">體驗總時長 (長到短)</option>
                <option value="shortest">體驗總時長 (短到長)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto w-full custom-scrollbar flex-1 bg-[#F9F9F9]">
          {rawReports.length === 0 ? (
            <div className="text-center text-gray-500 py-10 font-bold tracking-widest text-lg">尚未產生任何旅程分析紀錄。</div>
          ) : filteredAndSortedReports.length === 0 ? (
            <div className="text-center text-gray-500 py-10 font-bold tracking-widest text-lg">找不到符合搜尋條件的紀錄。</div>
          ) : (
            <div className="space-y-6">
              {filteredAndSortedReports.map((report, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-5 shadow-sm bg-white hover:shadow-md transition-shadow duration-300">
                  <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 border-b border-gray-200 pb-3 gap-2">
                    <h3 className="text-xl font-bold text-blue-800 tracking-wider">📦 {report.sessionName}</h3>
                    <span className="text-gray-500 font-mono text-[13px] bg-gray-100 px-3 py-1 rounded border border-gray-200">
                      當次體驗時長: <strong className="text-gray-800">{(report.analysis.sessionDuration / 1000).toFixed(1)} s</strong> | 
                      有效事件總數: <strong className="text-gray-800">{report.analysis.totalEvents}</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-400 opacity-50"></div>
                      <h4 className="font-bold text-gray-700 mb-3 border-b border-gray-200 pb-2 tracking-widest text-[0.9rem]">👆 各頁面點擊次序</h4>
                      <ul className="text-[13px] space-y-2 text-gray-600 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {Object.entries(report.analysis.clicksByPage).sort((a,b)=>b[1]-a[1]).map(([page, count]) => (
                          <li key={page} className="flex justify-between items-center"><span className="truncate pr-4 font-medium">{page}</span> <strong className="text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded min-w-[3.5rem] text-center shadow-sm">{count} 擊</strong></li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-green-400 opacity-50"></div>
                      <h4 className="font-bold text-gray-700 mb-3 border-b border-gray-200 pb-2 tracking-widest text-[0.9rem]">🖱 滑鼠位移次數收集</h4>
                      <ul className="text-[13px] space-y-2 text-gray-600 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {Object.entries(report.analysis.movesByPage).sort((a,b)=>b[1]-a[1]).map(([page, count]) => (
                          <li key={page} className="flex justify-between items-center"><span className="truncate pr-4 font-medium">{page}</span> <strong className="text-green-600 bg-green-100/80 px-2 py-0.5 rounded min-w-[3.5rem] text-center shadow-sm">{count} 次</strong></li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-amber-400 opacity-50"></div>
                      <h4 className="font-bold text-gray-700 mb-3 border-b border-gray-200 pb-2 tracking-widest text-[0.9rem]">⏱ 頁面分流停留時間</h4>
                      <ul className="text-[13px] space-y-2 text-gray-600 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {Object.entries(report.analysis.dwellTimeByPage).sort((a,b)=>b[1]-a[1]).map(([page, time]) => (
                          <li key={page} className="flex justify-between items-center"><span className="truncate pr-4 font-medium">{page}</span> <strong className="text-amber-600 bg-amber-100/80 px-2 py-0.5 rounded min-w-[4rem] text-center shadow-sm">{(time / 1000).toFixed(1)} s</strong></li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default LogDashboard;
