import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

const mockSendToBackend = (data) => {
  console.log(`[Backend Mock] Uploaded Session Data:`, data);
};

export const UserTracker = forwardRef(({ isEnabled, currentView, sessionName }, ref) => {
  const viewStartTime = useRef(Date.now());
  const lastMoveTime = useRef(0);
  const sessionRecords = useRef([]);

  const addRecord = (record) => {
    if (isEnabled) {
      sessionRecords.current.push(record);
    }
  };

  useImperativeHandle(ref, () => ({
    startSession: () => {
      sessionRecords.current = [];
      console.log("[UserTracker] Session Started");
    },
    endSessionAndAnalyze: () => {
      if (isEnabled) {
        const duration = Date.now() - viewStartTime.current;
        sessionRecords.current.push({
          type: 'dwell',
          page: currentView,
          duration_ms: duration,
          timestamp: Date.now()
        });
        viewStartTime.current = Date.now();
      }

      if (sessionRecords.current.length === 0) return;
      console.log("[UserTracker] Session Ended, Analyzing Data...");

      const data = sessionRecords.current;
      const analysis = {
        totalEvents: data.length,
        clicksByPage: {},
        movesByPage: {},
        dwellTimeByPage: {},
        sessionDuration: 0,
        rawRecords: data
      };

      let firstTime = data[0]?.timestamp || 0;
      let lastTime = data[data.length - 1]?.timestamp || 0;
      analysis.sessionDuration = lastTime - firstTime;

      data.forEach(event => {
        const p = event.page;
        if (!analysis.clicksByPage[p]) analysis.clicksByPage[p] = 0;
        if (!analysis.movesByPage[p]) analysis.movesByPage[p] = 0;
        if (!analysis.dwellTimeByPage[p]) analysis.dwellTimeByPage[p] = 0;

        if (event.type === 'click') analysis.clicksByPage[p]++;
        if (event.type === 'move') analysis.movesByPage[p]++;
        if (event.type === 'dwell') analysis.dwellTimeByPage[p] += event.duration_ms;
      });

      const finalSessionName = (sessionName && sessionName.trim() !== '') ? sessionName.trim() : new Date().toLocaleString();
      const payload = {
        type: 'session_analysis',
        sessionName: finalSessionName,
        analysis: analysis
      };

      try {
        // 設定 API 發送端點，未來如果您的自家電腦透過 ngrok 對外，只需要替換這個網址
        fetch('http://localhost:3000/api/tracking', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }).catch(err => {
          // 當沒有真實的後端接收時攔截錯誤，不做額外干擾。
          console.warn("[Backend Mock] 真實 API 無回應 (或尚未啟動)，資料已轉存至本機保護。");
        });
      } catch (e) {
        // 捕獲跨域或其他嚴重網路例外
      }

      // 同步寫入 localStorage 提供給本機報表讀取
      try {
        const existingReports = JSON.parse(localStorage.getItem('folk_song_tracking_reports') || '[]');
        existingReports.push(payload);
        localStorage.setItem('folk_song_tracking_reports', JSON.stringify(existingReports));
      } catch (e) {
        console.error("寫入 localStorage 失敗", e);
      }

      mockSendToBackend(payload);

      // Clear after analysis
      sessionRecords.current = [];
    }
  }));

  // 1. 停留時間 (Dwell Time)
  useEffect(() => {
    if (!isEnabled) return;
    
    viewStartTime.current = Date.now();
    
    return () => {
      const duration = Date.now() - viewStartTime.current;
      addRecord({
        type: 'dwell',
        page: currentView,
        duration_ms: duration,
        timestamp: Date.now()
      });
    };
  }, [currentView, isEnabled]);

  // 全域事件監聽
  useEffect(() => {
    if (!isEnabled) return;

    // 2. 點擊熱區 (Click Heatmap)
    const handleClick = (e) => {
      // 不記錄點擊開啟追蹤按鈕本身的事件
      if (e.target.closest && e.target.closest('button') && e.target.innerText.includes('後端追蹤')) return;

      addRecord({
        type: 'click',
        page: currentView,
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now()
      });
    };

    // 3. 游標移動軌跡 (Trajectory)
    const handleMouseMove = (e) => {
      const now = Date.now();
      // Throttle: 每 500ms 紀錄一次
      if (now - lastMoveTime.current > 500) {
        addRecord({
          type: 'move',
          page: currentView,
          x: e.clientX,
          y: e.clientY,
          timestamp: now
        });
        lastMoveTime.current = now;
      }
    };

    window.addEventListener('click', handleClick);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [currentView, isEnabled]);

  return null; // 此元件不渲染任何可見 UI
});

export default UserTracker;
