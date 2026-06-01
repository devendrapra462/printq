// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';

const BACKEND_URL = "https://printq-7a8m.onrender.com";
const socket = io(BACKEND_URL);

function App() {
  const [roomId, setRoomId] = useState('');
  const [isCustomer, setIsCustomer] = useState(false);
  const [receivedFiles, setReceivedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [manualRoomInput, setManualRoomInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); 
      gain1.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.4);

      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime); 
        gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.3);
      }, 80);
    } catch (e) {
      console.log("Audio block bypass active.");
    }
  };

  useEffect(() => {
    document.title = "PrintQ⚡ – Secure File Transfer | Devendra Developer";

    const urlParams = new URLSearchParams(window.location.search);
    const room = urlParams.get('room');

    if (room) {
      setRoomId(room);
      setIsCustomer(true);
    } else {
      const newRoomId = Math.floor(100000 + Math.random() * 900000).toString();
      setRoomId(newRoomId);
      socket.emit('join_room', newRoomId);
    }

    socket.on('receive_file', (data) => {
      setReceivedFiles((prev) => [data, ...prev]);
      playAlertSound(); 
    });

    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&family=Oswald:wght@600;700&display=swap');
      
      body, html { 
        margin: 0; 
        padding: 0; 
        background-color: #ebe6dd; 
        color: #000000;
        font-family: 'Plus Jakarta Sans', sans-serif; 
        overflow-x: hidden;
        width: 100%;
      }

      .brutal-header {
        font-family: 'Oswald', sans-serif;
        text-transform: uppercase;
        font-size: 6.5rem;
        line-height: 0.9;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: #000000;
        margin: 0;
      }
      .brutal-blue { color: #2b5ce6; }

      .outline-drop-text {
        font-family: 'Oswald', sans-serif;
        font-size: 8rem;
        font-weight: 700;
        text-transform: uppercase;
        line-height: 1;
        color: transparent;
        -webkit-text-stroke: 1.5px #000000;
        letter-spacing: 0.05em;
        margin: 0;
      }

      .grid-container {
        display: flex;
        width: 100%;
        min-height: calc(100vh - 140px);
        border-bottom: 1px solid #000000;
      }
      .grid-left {
        flex: 1.1;
        border-right: 1px solid #000000;
        padding: 60px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background-color: #ebe6dd;
      }
      .grid-right {
        flex: 0.9;
        display: flex;
        flex-direction: column;
        background-color: #dfd9cc;
      }

      .btn-black {
        background-color: #000000;
        color: #ffffff;
        border: none;
        font-family: 'Oswald', sans-serif;
        text-transform: uppercase;
        font-size: 1.3rem;
        padding: 16px 32px;
        letter-spacing: 0.05em;
        display: inline-flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        width: fit-content;
        transition: transform 0.1s ease;
      }
      .btn-black:active { transform: scale(0.98); }

      .stat-box {
        flex: 1;
        border-right: 1px solid #000000;
        padding: 24px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 100px;
        box-sizing: border-box;
      }
      .stat-box:last-child { border-right: none; }
      .stat-num { font-family: 'Oswald', sans-serif; font-size: 2.2rem; color: #e6522b; line-height: 1; font-weight: 700; }
      .stat-label { font-size: 0.7rem; color: #706b64; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; margin-top: 8px; }

      .custom-scroll::-webkit-scrollbar { width: 4px; }
      .custom-scroll::-webkit-scrollbar-thumb { background: #000000; }

      @media (max-width: 768px) {
        .grid-container { flex-direction: column; }
        .grid-left { flex: none; border-right: none; border-bottom: 1px solid #000000; padding: 40px 20px; }
        .grid-right { flex: none; background-color: #dfd9cc; }
        .brutal-header { font-size: 3.8rem; }
        .outline-drop-text { font-size: 4.5rem; -webkit-text-stroke: 1px #000000; }
        .btn-black { width: 100%; justify-content: center; font-size: 1.1rem; }
        .stat-num { font-size: 1.6rem; }
      }
    `;
    document.head.appendChild(styleSheet);

    return () => {
      socket.off('receive_file');
    };
  }, []);

  const uploadFilesBatch = async (files) => {
    if (!files || files.length === 0) return;
    setUploadStatus(`PACKING ${files.length} ASSETS...`);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomId', roomId);

      try {
        await axios.post(`${BACKEND_URL}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
            setUploadStatus(`BEAMING FILE [${i + 1}/${files.length}]: ${percentCompleted}%`);
          }
        });
      } catch (err) {
        console.error(err);
        setUploadStatus('❌ STREAM TRANSMISSION TIMED OUT.');
        return;
      }
    }
    setUploadStatus('✅ ALL FILES TRANSMITTED SUCCESSFULLY!');
    setUploadProgress(0);
  };

  const triggerDirectPrint = (fileData, fileName) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      if (fileData.startsWith("data:image")) {
        printWindow.document.write(`<html><body style="margin:0;display:flex;justify-content:center;align-items:center;background:#ebe6dd;"><img src="${fileData}" style="max-width:100%;max-height:100vh;object-fit:contain;" onload="window.print();window.close();"/></body></html>`);
      } else {
        printWindow.document.write(`<html><body style="margin:0;height:100vh;"><iframe src="${fileData}" width="100%" height="100%" style="border:none;" onload="window.print();window.close();"></iframe></body></html>`);
      }
      printWindow.document.close();
    }
  };

  const triggerManualDownload = (fileData, fileName) => {
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = fileData;
    downloadAnchor.download = fileName;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  const shopUrl = `${window.location.origin}?room=${roomId}`;

  return (
    <div 
      onDragOver={(e) => e.preventDefault()} 
      onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) uploadFilesBatch(e.dataTransfer.files); }}
      style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ebe6dd' }}
    >
      
      {/* 1. TOP NAVBAR */}
      <header style={{ width: '100%', borderBottom: '1px solid #000000', padding: '25px 40px', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'Oswald', fontSize: '2.5rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '-0.03em', color: '#000000' }}>
          PrintQ<span style={{ color: '#2b5ce6' }}>⚡</span>
        </span>
        <span style={{ fontFamily: 'Oswald', fontSize: '1.1rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#706b64', fontWeight: '700' }}>
          DEVELOPER HUB
        </span>
      </header>

      {/* 2. CORE SYSTEM GRID LAYOUT */}
      <div className="grid-container">
        
        {/* LEFT BLOCK */}
        <div className="grid-left">
          <div>
            <h1 className="brutal-header">TO YOUR</h1>
            <h1 className="brutal-header brutal-blue">PRINTER.</h1>
            <p style={{ color: '#57534e', fontSize: '1.05rem', marginTop: '24px', maxWidth: '400px', lineHeight: '1.5', fontWeight: '500' }}>
              The fastest way to move photos and PDFs from your phone directly to the merchant shop print queue. Scan, drop, done.
            </p>
          </div>

          <div style={{ marginTop: '40px' }}>
            {isCustomer ? (
              <>
                <label className="btn-black" style={{ padding: '20px 40px', cursor: 'pointer' }}>
                  → SELECT FILES TO BEAM
                  <input type="file" multiple onChange={(e) => uploadFilesBatch(e.target.files)} style={{ display: 'none' }} />
                </label>
                {uploadStatus && <p style={{ fontFamily: 'Oswald', fontSize: '1.1rem', fontWeight: '700', marginTop: '15px' }}>{uploadStatus}</p>}
              </>
            ) : (
              <button onClick={() => window.location.reload()} className="btn-black">
                → START NEW SESSION
              </button>
            )}
          </div>
        </div>

        {/* RIGHT BLOCK */}
        <div className="grid-right">
          
          {/* QR GATEWAY BOX */}
          <div style={{ flex: '1', padding: '40px', borderBottom: '1px solid #000000', display: 'flex', boxSizing: 'border-box', minHeight: '300px', width: '100%' }}>
            {isCustomer ? (
              <div style={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h2 className="outline-drop-text">READY</h2>
                <p style={{ fontFamily: 'Oswald', fontSize: '1.2rem', color: '#706b64', marginTop: '10px' }}>TERMINAL PIPE CONNECTED</p>
              </div>
            ) : (
              <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                <div style={{ flex: '1' }}>
                  <h2 className="outline-drop-text">DROP</h2>
                  <p style={{ fontSize: '0.95rem', color: '#57534e', marginTop: '15px', lineHeight: '1.4', fontWeight: '500' }}>
                    Point your smartphone camera at this code to securely couple devices. Drag files anywhere to test.
                  </p>
                </div>
                <div style={{ background: '#ffffff', padding: '16px', border: '1px solid #000000', boxShadow: '5px 5px 0px #000000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {roomId && <QRCodeSVG value={shopUrl} size={135} level="M" />}
                </div>
              </div>
            )}
          </div>

          {/* STATS ROW */}
          <div style={{ display: 'flex', borderBottom: '1px solid #000000', width: '100%' }}>
            <div className="stat-box">
              <span className="stat-num">{isCustomer ? "00" : (roomId || "------")}</span>
              <span className="stat-label">{isCustomer ? "CLIENT PORT" : "SESSION PIN"}</span>
            </div>
            <div className="stat-box" style={{ borderLeft: '1px solid #000000' }}>
              <span className="stat-num">{receivedFiles.length}⚡</span>
              <span className="stat-label">QUEUED FILES</span>
            </div>
            <div className="stat-box" style={{ borderLeft: '1px solid #000000' }}>
              <span className="stat-num">∞</span>
              <span className="stat-label">FILE TYPES</span>
            </div>
          </div>

          {/* FILE QUEUE */}
          <div className="custom-scroll" style={{ flex: '1', padding: '30px', overflowY: 'auto', maxHeight: '280px', boxSizing: 'border-box' }}>
            {receivedFiles.length === 0 ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#706b64', fontFamily: 'Oswald', fontSize: '1.2rem', letterSpacing: '0.05em' }}>
                AWAITING DATA TRANSMISSION FLOW...
              </div>
            ) : (
              receivedFiles.map((file, index) => (
                <div key={index} style={{ border: '1px solid #000000', padding: '16px 20px', backgroundColor: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', boxShadow: '4px 4px 0px #000000', boxSizing: 'border-box' }}>
                  <div style={{ overflow: 'hidden', marginRight: '15px' }}>
                    <p style={{ margin: '0 0 4px 0', fontWeight: '700', fontSize: '1.1rem', color: '#000000', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{file.fileName}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: '700', color: '#2b5ce6', textTransform: 'uppercase' }}>{file.fileType ? file.fileType.split('/')[1] : 'ASSET'}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button onClick={() => triggerDirectPrint(file.fileData, file.fileName)} style={{ background: '#000000', color: '#ffffff', border: 'none', padding: '8px 16px', fontFamily: 'Oswald', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '700' }}>PRINT</button>
                    <button onClick={() => triggerManualDownload(file.fileData, file.fileName)} style={{ background: 'transparent', color: '#000000', border: '1px solid #000000', padding: '8px 16px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '700' }}>⬇</button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>

      {/* FOOTER */}
      <div style={{ padding: '30px 40px', boxSizing: 'border-box', width: '100%' }}>
        {!isCustomer && (
          <div style={{ marginBottom: '25px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#706b64', display: 'block', marginBottom: '8px', letterSpacing: '0.05em' }}>RESTORE SESSION REJOIN</span>
            <form onSubmit={(e) => { e.preventDefault(); if (manualRoomInput.trim().length === 6) window.location.href = `${window.location.origin}?room=${manualRoomInput.trim()}`; }} style={{ display: 'flex', maxWidth: '380px' }}>
              <input type="text" placeholder="Enter 6-digit session id" maxLength={6} value={manualRoomInput} onChange={(e) => setManualRoomInput(e.target.value)} style={{ flex: '1', padding: '12px', border: '1px solid #000000', background: 'transparent', fontSize: '1rem', color: '#000000' }} />
              <button type="submit" style={{ background: '#000000', color: '#ffffff', border: 'none', padding: '0 20px', fontFamily: 'Oswald', cursor: 'pointer' }}>REJOIN</button>
            </form>
          </div>
        )}

        <div style={{ borderTop: '1px solid #000000', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', fontWeight: '600' }}>
          <span style={{ color: '#000000' }}>© 2026 Devendra Developer</span>
          <a href="https://www.linkedin.com/in/devendra-prajapati-508693347" target="_blank" rel="noopener noreferrer" style={{ color: '#000000', textDecoration: 'none' }}>LinkedIn</a>
        </div>
      </div>

    </div>
  );
}

export default App;