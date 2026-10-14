import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Square,
  Play,
  Pause,
  RotateCcw,
  Send,
  X,
  Upload,
  Camera,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function VideoRecorder({ onRecordingComplete, onCancel, uploadProgress = null }) {
  const { t } = useTranslation();

  const [hasCameraSupport, setHasCameraSupport] = useState(true);
  const [permissionError, setPermissionError] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' or 'environment'
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [uploadMode, setUploadMode] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const videoLiveRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);
  const rearCameraInputRef = useRef(null);
  const frontCameraInputRef = useRef(null);

  const MAX_SECONDS = 60; // 60 seconds strict limit

  useEffect(() => {
    checkBrowserCapabilities();
    return () => {
      stopMediaStream();
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, []);

  const stopMediaStream = () => {
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

  const checkBrowserCapabilities = async () => {
    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia ||
      typeof window.MediaRecorder === 'undefined'
    ) {
      setHasCameraSupport(false);
      setUploadMode(true);
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setAvailableDevices(videoInputs);
      if (videoInputs.length === 0) {
        setHasCameraSupport(false);
        setUploadMode(true);
        return;
      }
      // Start camera stream
      startCameraStream(facingMode);
    } catch (err) {
      console.warn('Error enumerating devices:', err);
      startCameraStream(facingMode);
    }
  };

  const startCameraStream = async (targetFacing, deviceId = null) => {
    stopMediaStream();
    setPermissionError(null);

    const videoConstraints = deviceId
      ? { deviceId: { exact: deviceId } }
      : {
          facingMode: targetFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: { ideal: 1.7777777778 }, // 16:9 rectangular
        };

    let stream = null;

    // 1. Try with video + audio
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: true,
      });
    } catch (err1) {
      console.warn('Initial video+audio getUserMedia failed, trying basic video+audio:', err1);
      // 2. Try basic video + audio
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch (err2) {
        console.warn('Video+audio failed, trying video only (no microphone):', err2);
        // 3. Fallback to video only in case PC has no microphone
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (err3) {
          console.error('All camera attempts failed:', err3);
          setHasCameraSupport(false);
          setUploadMode(true);
          if (err3.name === 'NotAllowedError' || err3.name === 'PermissionDeniedError') {
            setPermissionError(t('chat.permissionDenied', 'Kameraga ruxsat berilmadi.'));
          } else {
            setPermissionError('Kamera topilmadi yoki brauzer tomonidan cheklangan.');
          }
          return;
        }
      }
    }

    if (stream) {
      streamRef.current = stream;
      setUploadMode(false);
      setHasCameraSupport(true);
      if (videoLiveRef.current) {
        videoLiveRef.current.srcObject = stream;
        videoLiveRef.current.play().catch(() => {});
      }
    }
  };

  // Ensure live video element gets the stream when it mounts or re-renders
  useEffect(() => {
    if (videoLiveRef.current && streamRef.current && !videoUrl && !uploadMode) {
      videoLiveRef.current.srcObject = streamRef.current;
      videoLiveRef.current.play().catch(() => {});
    }
  }, [uploadMode, videoUrl]);

  const switchCameraFacing = async () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    setSelectedDeviceId(null);

    // If currently live and mediaDevices exists, attempt dynamic track flip
    if (navigator.mediaDevices?.getUserMedia && streamRef.current) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: nextFacing },
          audio: false,
        });
        const newVideoTrack = newStream.getVideoTracks()[0];
        const oldVideoTrack = streamRef.current.getVideoTracks()[0];
        if (oldVideoTrack && newVideoTrack) {
          streamRef.current.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
          streamRef.current.addTrack(newVideoTrack);
          if (videoLiveRef.current) {
            videoLiveRef.current.srcObject = streamRef.current;
            videoLiveRef.current.play().catch(() => {});
          }
          return;
        }
      } catch (e) {
        console.warn('Live track switch fallback to full restart:', e);
      }
    }
    startCameraStream(nextFacing);
  };

  const selectDevice = (deviceId) => {
    setSelectedDeviceId(deviceId);
    startCameraStream(facingMode, deviceId);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    setRecordingSeconds(0);

    const hasAudio = streamRef.current.getAudioTracks().length > 0;
    let mimeType = hasAudio ? 'video/webm;codecs=vp8,opus' : 'video/webm';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else {
        mimeType = '';
      }
    }

    try {
      const recorder = mimeType
        ? new MediaRecorder(streamRef.current, { mimeType })
        : new MediaRecorder(streamRef.current);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const type = recorder.mimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type });
        setVideoBlob(blob);
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        setIsRecording(false);
        stopMediaStream();
      };

      recorder.start(500);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= MAX_SECONDS - 1) {
            stopRecording();
            return MAX_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to start MediaRecorder:', err);
      setPermissionError('Video yozishni boshlab boʻlmadi.');
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
  };

  const handleRetake = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
    }
    setVideoBlob(null);
    setRecordingSeconds(0);
    setIsPlayingPreview(false);
    startCameraStream(facingMode, selectedDeviceId);
  };

  const handleSend = () => {
    if (!videoBlob) return;
    const ext = videoBlob.type.includes('mp4') ? 'mp4' : 'webm';
    const file = new File([videoBlob], `video_${Date.now()}.${ext}`, {
      type: videoBlob.type || 'video/webm',
    });
    onRecordingComplete?.(file);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      alert(t('chat.validVideoAlert', 'Please select a valid video file'));
      return;
    }
    setVideoBlob(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setUploadMode(false);
  };

  const handleClose = () => {
    stopMediaStream();
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    onCancel?.();
  };

  const togglePreviewPlay = () => {
    if (!videoPreviewRef.current) return;
    if (isPlayingPreview) {
      videoPreviewRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      videoPreviewRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const formatCountdown = (secondsElapsed) => {
    const remaining = Math.max(0, MAX_SECONDS - secondsElapsed);
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Video className="w-5 h-5 text-[#123D78] dark:text-blue-400" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {t('chat.recordVideo', 'Record Video')}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
              {t('chat.maxDuration', { seconds: MAX_SECONDS, defaultValue: `Max ${MAX_SECONDS}s` })}
            </span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Area - MUST BE RECTANGULAR: aspect-video */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
          {/* Upload fallback or chosen upload mode */}
          {uploadMode && !videoUrl ? (
            <div className="flex flex-col items-center justify-center p-6 text-center text-white space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-[#123D78]/50 border border-blue-500/40 flex items-center justify-center shadow-lg">
                <Video className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">
                  Kamera orqali video yozish
                </h4>
                <p className="text-xs text-gray-300 mt-1">
                  Maksimal 60 soniya. Kerakli kamerani tanlang va yozishni boshlang:
                </p>
              </div>

              {/* Native Mobile Camera Capture inputs */}
              <input
                ref={rearCameraInputRef}
                type="file"
                accept="video/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
              <input
                ref={frontCameraInputRef}
                type="file"
                accept="video/*"
                capture="user"
                onChange={handleFileUpload}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                <button
                  type="button"
                  onClick={() => rearCameraInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#F12D3A] hover:bg-[#d41f2b] text-white font-semibold text-xs shadow-md transition-transform active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Orqa kamera (Asosiy)</span>
                </button>
                <button
                  type="button"
                  onClick={() => frontCameraInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#123D78] hover:bg-[#0e2f5c] text-white font-semibold text-xs shadow-md transition-transform active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Old kamera (Selfie)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-gray-400 hover:text-white underline transition-colors pt-1"
              >
                Yoki galereyadan tayyor video yuklash
              </button>
            </div>
          ) : videoUrl ? (
            /* Recorded Preview (Rectangular) */
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoPreviewRef}
                src={videoUrl}
                playsInline
                className="w-full h-full object-contain"
                onPlay={() => setIsPlayingPreview(true)}
                onPause={() => setIsPlayingPreview(false)}
                onEnded={() => setIsPlayingPreview(false)}
              />
              <button
                type="button"
                onClick={togglePreviewPlay}
                className="absolute p-4 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-transform active:scale-95"
              >
                {isPlayingPreview ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-0.5 rtl:ml-0 rtl:mr-0.5" />
                )}
              </button>
            </div>
          ) : (
            /* Live Camera Stream (Rectangular) */
            <div className="relative w-full h-full">
              <video
                ref={videoLiveRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Countdown overlay during recording */}
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center space-x-2 rtl:space-x-reverse bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full text-white font-mono text-xs z-10">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping inline-block" />
                  <span className="text-red-500 font-bold">REC</span>
                  <span>{formatCountdown(recordingSeconds)}</span>
                </div>
              )}

              {/* Camera Switch Controls (Always accessible) */}
              <div className="absolute top-4 right-4 flex items-center space-x-2 rtl:space-x-reverse z-10">
                <button
                  type="button"
                  onClick={switchCameraFacing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md shadow-md transition-transform active:scale-95 text-xs font-semibold"
                  title={t('chat.switchCamera', 'Kamerani almashtirish')}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{facingMode === 'user' ? 'Orqa kamera' : 'Old kamera'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Upload progress bar if uploading */}
          {uploadProgress !== null && (
            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-white z-20">
              <div className="w-48 bg-gray-700 h-2.5 rounded-full overflow-hidden mb-3">
                <div
                  className="bg-[#123D78] h-full transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm font-medium">
                {t('chat.uploading', 'Uploading...')} {uploadProgress}%
              </p>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between p-4 px-6 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-800">
          {videoUrl ? (
            /* Review & Action controls */
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={handleRetake}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t('chat.rerecord', 'Re-record')}</span>
              </button>

              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-[#123D78] hover:bg-[#0e2f5c] text-white text-sm font-semibold shadow-md transition-transform active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>{t('chat.send', 'Send')}</span>
                </button>
              </div>
            </div>
          ) : uploadMode ? (
            /* Upload mode controls */
            <div className="flex items-center justify-between w-full">
              {hasCameraSupport && (
                <button
                  type="button"
                  onClick={() => {
                    setUploadMode(false);
                    startCameraStream(facingMode);
                  }}
                  className="flex items-center space-x-1.5 text-xs text-[#123D78] dark:text-blue-400 font-medium hover:underline"
                >
                  <Camera className="w-4 h-4" />
                  <span>{t('chat.tryCameraAgain', 'Try Camera Again')}</span>
                </button>
              )}
              <div className="flex-1" />
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium"
              >
                {t('common.cancel', 'Cancel')}
              </button>
            </div>
          ) : (
            /* Live Recording controls */
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => setUploadMode(true)}
                className="flex items-center space-x-1.5 text-xs text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
              >
                <Upload className="w-4 h-4" />
                <span>{t('chat.uploadFile', 'Upload file')}</span>
              </button>

              {/* Start / Stop Recording Button */}
              {isRecording ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-lg animate-pulse"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>{t('chat.stopRecording', 'Stop Recording')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-full bg-[#F12D3A] hover:bg-[#d41f2b] text-white font-semibold text-sm shadow-lg transition-transform active:scale-95"
                >
                  <span className="w-3 h-3 rounded-full bg-white inline-block" />
                  <span>{t('chat.startRecording', 'Start Recording')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium"
              >
                {t('common.cancel', 'Cancel')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
