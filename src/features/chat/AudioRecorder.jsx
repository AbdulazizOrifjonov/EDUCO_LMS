import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, Play, Pause, AlertCircle, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AudioRecorder({ onRecordingComplete, onCancel }) {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const previewAudioRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const nativeMicRef = useRef(null);
  const isMountedRef = useRef(true);
  const shouldSendOnStopRef = useRef(false);

  const MAX_SECONDS = 120; // 2 minutes

  useEffect(() => {
    isMountedRef.current = true;
    startRecording();
    return () => {
      isMountedRef.current = false;
      cleanupStreams();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  const cleanupStreams = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];
    setRecordDuration(0);
    shouldSendOnStopRef.current = false;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      setErrorMessage(t('chat.microphoneNotSupported', 'Mikrofon ushbu brauzerda qoʻllab-quvvatlanmaydi'));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!isMountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;

      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        } else {
          mimeType = '';
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const type = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setIsRecording(false);

        if (shouldSendOnStopRef.current) {
          shouldSendOnStopRef.current = false;
          const ext = type.includes('mp4') ? 'mp4' : 'webm';
          const file = new File([blob], `audio_${Date.now()}.${ext}`, { type });
          onRecordingComplete?.(file);
        }
      };

      recorder.start(250); // collect 250ms chunks
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => {
          if (prev >= MAX_SECONDS - 1) {
            stopRecording();
            return MAX_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Audio recorder error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage(t('chat.permissionDenied', 'Mikrofonga ruxsat berilmadi. Ruxsatni yoqing yoki audio fayl yuklang.'));
      } else {
        setErrorMessage(t('chat.microphoneNotSupported', 'Mikrofon topilmadi yoki band. Audio fayl yuklashingiz mumkin.'));
      }
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleCancel = () => {
    cleanupStreams();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    onCancel?.();
  };

  const handleSend = () => {
    if (isRecording) {
      // If currently recording, stop and trigger immediate send in onstop
      shouldSendOnStopRef.current = true;
      stopRecording();
      return;
    }

    if (!audioBlob) return;
    const ext = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
    const file = new File([audioBlob], `audio_${Date.now()}.${ext}`, {
      type: audioBlob.type || 'audio/webm',
    });
    onRecordingComplete?.(file);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    cleanupStreams();
    onRecordingComplete?.(file);
  };

  const handleNativeAudioRecord = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    cleanupStreams();
    setAudioBlob(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setErrorMessage(null);
    setIsRecording(false);
  };

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current) return;
    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play().catch(() => {});
      setIsPlayingPreview(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!previewAudioRef.current) return;
    const current = previewAudioRef.current.currentTime;
    const dur = previewAudioRef.current.duration || 1;
    if (dur && isFinite(dur)) {
      setPreviewProgress((current / dur) * 100);
    }
  };

  const handleAudioEnded = () => {
    setIsPlayingPreview(false);
    setPreviewProgress(0);
  };

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (errorMessage && !audioUrl) {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl text-blue-950 dark:text-blue-200">
        <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs">
          <Mic className="w-4 h-4 flex-shrink-0 text-[#123D78] dark:text-blue-400" />
          <span>Ovoz yozish uchun mikrofondan foydalaning:</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Native microphone capture for mobile devices */}
          <input
            ref={nativeMicRef}
            type="file"
            accept="audio/*"
            capture="microphone"
            onChange={handleNativeAudioRecord}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => nativeMicRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm transition-transform active:scale-95"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Ovoz yozish</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 text-gray-700 dark:text-gray-300 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Fayl</span>
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between w-full p-2.5 px-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
      {/* Recording State */}
      {isRecording ? (
        <div className="flex items-center space-x-3 rtl:space-x-reverse flex-1">
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-red-600 dark:text-red-400 font-mono font-medium text-sm">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-ping inline-block" />
            <Mic className="w-4 h-4 text-red-600" />
            <span>{formatSeconds(recordDuration)}</span>
          </div>

          <div className="flex-1 flex items-center justify-center space-x-1 rtl:space-x-reverse h-6 overflow-hidden max-w-xs">
            <span className="w-1 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="w-1 h-5 bg-red-500 rounded-full animate-pulse delay-75" />
            <span className="w-1 h-2 bg-red-500 rounded-full animate-pulse delay-150" />
            <span className="w-1 h-6 bg-red-500 rounded-full animate-pulse" />
            <span className="w-1 h-4 bg-red-500 rounded-full animate-pulse delay-100" />
            <span className="w-1 h-2 bg-red-500 rounded-full animate-pulse delay-200" />
          </div>

          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow transition-colors"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>{t('chat.stopRecording', 'Toʻxtatish')}</span>
          </button>
        </div>
      ) : (
        /* Preview State */
        <div className="flex items-center space-x-3 rtl:space-x-reverse flex-1">
          {audioUrl && (
            <audio
              ref={previewAudioRef}
              src={audioUrl}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleAudioEnded}
              preload="metadata"
            />
          )}

          <button
            type="button"
            onClick={togglePreviewPlay}
            className="p-2 rounded-full bg-[#123D78] hover:bg-[#0e2f5c] text-white transition-colors"
          >
            {isPlayingPreview ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5 rtl:ml-0 rtl:mr-0.5" />
            )}
          </button>

          <div className="flex-1 flex flex-col justify-center">
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#123D78] h-full transition-all duration-100"
                style={{ width: `${previewProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-mono">
              <span>{formatSeconds(Math.floor(previewAudioRef.current?.currentTime || 0))}</span>
              <span>{formatSeconds(recordDuration)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex items-center space-x-2 rtl:space-x-reverse ml-3 rtl:mr-3">
        <button
          type="button"
          onClick={handleCancel}
          className="p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          title={t('chat.cancelRecording', 'Bekor qilish')}
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Send Button: Works both while recording (instant stop & send) and in preview */}
        <button
          type="button"
          onClick={handleSend}
          className="p-2 rounded-full bg-[#123D78] hover:bg-[#0e2f5c] text-white shadow-sm transition-transform active:scale-95"
          title={t('chat.send', 'Yuborish')}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

