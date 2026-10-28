import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Play,
  Pause,
  RotateCcw,
  Send,
  X,
  Camera,
  RefreshCw,
  AlertCircle,
  Check,
  Trash2,
  Lock,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function VideoRecorder({
  onRecordingComplete,
  onCancel,
  uploadProgress = null,
  autoStart = false,
}) {
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
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  const [cameraNotification, setCameraNotification] = useState('');
  const autoStartedRef = useRef(false);

  const videoLiveRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);
  const rearCameraInputRef = useRef(null);
  const frontCameraInputRef = useRef(null);

  const MAX_SECONDS = 60; // 60 seconds Telegram video note limit

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
      startCameraStream(facingMode);
    } catch (err) {
      console.warn('Error enumerating devices:', err);
      startCameraStream(facingMode);
    }
  };

  const startCameraStream = async (targetFacing, deviceId = null) => {
    stopMediaStream();
    setPermissionError(null);

    // Square 1:1 aspect ratio for circular video note
    const videoConstraints = deviceId
      ? { deviceId: { exact: deviceId } }
      : {
          facingMode: targetFacing,
          width: { ideal: 720 },
          height: { ideal: 720 },
          aspectRatio: { ideal: 1 },
        };

    let stream = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: true,
      });
    } catch (err1) {
      console.warn('Video+audio failed, trying basic:', err1);
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch (err2) {
        console.warn('Trying video only:', err2);
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

  useEffect(() => {
    if (videoLiveRef.current && streamRef.current && !videoUrl && !uploadMode) {
      videoLiveRef.current.srcObject = streamRef.current;
      videoLiveRef.current.play().catch(() => {});
    }
  }, [uploadMode, videoUrl]);

  // Auto-start recording when autoStart prop is true and stream is ready
  useEffect(() => {
    if (
      autoStart &&
      !autoStartedRef.current &&
      hasCameraSupport &&
      streamRef.current &&
      !isRecording &&
      !videoBlob &&
      !uploadMode
    ) {
      autoStartedRef.current = true;
      const t = setTimeout(() => {
        startRecording();
      }, 350);
      return () => clearTimeout(t);
    }
  }, [autoStart, hasCameraSupport, uploadMode, isRecording, videoBlob]);

  const switchCameraFacing = async () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setIsSwitchingCamera(true);

    if (navigator.mediaDevices?.getUserMedia && streamRef.current) {
      try {
        let newStream = null;
        try {
          newStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: nextFacing },
              width: { ideal: 720 },
              height: { ideal: 720 },
              aspectRatio: { ideal: 1 },
            },
            audio: false,
          });
        } catch {
          newStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: nextFacing },
            audio: false,
          });
        }

        const newVideoTrack = newStream?.getVideoTracks()[0];
        const oldVideoTrack = streamRef.current.getVideoTracks()[0];
        if (oldVideoTrack && newVideoTrack) {
          streamRef.current.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
          streamRef.current.addTrack(newVideoTrack);
          setFacingMode(nextFacing);
          setSelectedDeviceId(null);

          if (videoLiveRef.current) {
            videoLiveRef.current.srcObject = streamRef.current;
            videoLiveRef.current.play().catch(() => {});
          }

          const label = nextFacing === 'environment' ? 'Orqa kamera' : 'Old kamera';
          setCameraNotification(`Kamera: ${label}`);
          setTimeout(() => setCameraNotification(''), 2000);
          setIsSwitchingCamera(false);
          return;
        }
      } catch (e) {
        console.warn('Live track switch note:', e);
      }
    }

    if (!isRecording) {
      setFacingMode(nextFacing);
      setSelectedDeviceId(null);
      startCameraStream(nextFacing);
    }
    setIsSwitchingCamera(false);
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

      recorder.start(400);
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
      setPermissionError('Video yozishni boshlab bo‘lmadi.');
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
    if (isRecording) {
      // If user clicks send while recording, stop and send immediately
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.onstop = () => {
          const type = mediaRecorderRef.current?.mimeType || 'video/webm';
          const blob = new Blob(chunksRef.current, { type });
          const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
          const file = new File([blob], `video_note_${Date.now()}.${ext}`, {
            type: blob.type || 'video/webm',
          });
          stopMediaStream();
          onRecordingComplete?.(file);
        };
        mediaRecorderRef.current.stop();
        return;
      }
    }

    if (!videoBlob) return;
    const ext = videoBlob.type.includes('mp4') ? 'mp4' : 'webm';
    const file = new File([videoBlob], `video_note_${Date.now()}.${ext}`, {
      type: videoBlob.type || 'video/webm',
    });
    onRecordingComplete?.(file);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      alert(t('chat.validVideoAlert', 'Iltimos, video fayl tanlang'));
      return;
    }
    // Rename as video_note so it renders as a circular video note
    const videoNoteFile = new File([file], `video_note_${Date.now()}_${file.name}`, {
      type: file.type,
    });
    setVideoBlob(videoNoteFile);
    const url = URL.createObjectURL(videoNoteFile);
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

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Circular progress calculation
  // Circle radius 136, circumference = 2 * PI * 136 ≈ 854.5
  const circleRadius = 136;
  const circumference = 2 * Math.PI * circleRadius;
  const progressRatio = recordingSeconds / MAX_SECONDS;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-sm flex flex-col items-center justify-center gap-6 text-center">
        {/* Top Header / Timer & Status */}
        <div className="flex items-center justify-between w-full px-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-white text-xs font-bold tracking-wider uppercase">
              Dumaloq video xabar
            </span>
          </div>

          {/* Close / Cancel Button */}
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            title="Bekor qilish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera switch notification */}
        {cameraNotification && (
          <div className="absolute top-10 px-3 py-1 bg-emerald-600/90 text-white text-xs font-medium rounded-full shadow-lg z-20 animate-fade-in">
            {cameraNotification}
          </div>
        )}

        {/* Fallback upload UI if camera not supported */}
        {uploadMode && !videoUrl ? (
          <div className="w-72 h-72 rounded-full border-4 border-dashed border-emerald-500/50 bg-gray-900 flex flex-col items-center justify-center p-6 text-white space-y-3">
            <Video className="w-10 h-10 text-emerald-400" />
            <p className="text-xs text-gray-300">
              Kameraga to‘g‘ridan-to‘g‘ri ulanib bo‘lmadi.
            </p>
            <input
              ref={frontCameraInputRef}
              type="file"
              accept="video/*"
              capture="user"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => frontCameraInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
            >
              Kamerani ochish
            </button>
          </div>
        ) : (
          /* TELEGRAM-STYLE CIRCULAR VIEWFINDER */
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 aspect-square flex items-center justify-center">
            {/* SVG Progress Ring */}
            <svg
              className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-10"
              viewBox="0 0 300 300"
            >
              {/* Background circle track */}
              <circle
                cx="150"
                cy="150"
                r={circleRadius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="6"
              />
              {/* Progress active bar */}
              <circle
                cx="150"
                cy="150"
                r={circleRadius}
                fill="none"
                stroke="#10b981"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300 ease-linear"
              />
            </svg>

            {/* Inner Video Circle (Telegram Mask) */}
            <div className="w-[264px] h-[264px] sm:w-[294px] sm:h-[294px] rounded-full overflow-hidden bg-black relative shadow-[0_0_50px_rgba(16,185,129,0.3)] border-2 border-emerald-500/40">
              {videoUrl ? (
                /* Preview Mode */
                <div
                  className="w-full h-full relative cursor-pointer group"
                  onClick={togglePreviewPlay}
                >
                  <video
                    ref={videoPreviewRef}
                    src={videoUrl}
                    playsInline
                    loop
                    autoPlay
                    className="w-full h-full object-cover"
                    onPlay={() => setIsPlayingPreview(true)}
                    onPause={() => setIsPlayingPreview(false)}
                  />
                  {!isPlayingPreview && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="w-12 h-12 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-lg">
                        <Play className="w-6 h-6 fill-current ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Live Camera Stream */
                <video
                  ref={videoLiveRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover ${
                    facingMode === 'user' ? 'scale-x-[-1]' : ''
                  }`}
                />
              )}

              {/* Live recording timer badge inside circle */}
              {isRecording && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-mono font-bold border border-red-500/40 z-20">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-red-400">REC</span>
                  <span>{formatTimer(recordingSeconds)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Control Actions */}
        <div className="flex items-center justify-center gap-4 w-full pt-1">
          {videoUrl ? (
            /* Controls after recording stopped: Retake or Send */
            <div className="flex items-center gap-4 animate-fade-in">
              <button
                type="button"
                onClick={handleRetake}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-transform active:scale-95"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Qayta olish</span>
              </button>

              <button
                type="button"
                onClick={handleSend}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-blue-600/40 dark:shadow-emerald-600/40 transition-transform active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Yuborish</span>
              </button>
            </div>
          ) : (
            /* Live Recording Controls */
            <div className="flex items-center gap-5">
              {/* Camera Flip Button */}
              <button
                type="button"
                onClick={switchCameraFacing}
                disabled={isSwitchingCamera}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-transform active:scale-90"
                title="Kamerani almashtirish (Old/Orqa)"
              >
                <RefreshCw className={`w-5 h-5 ${isSwitchingCamera ? 'animate-spin' : ''}`} />
              </button>

              {/* Main Record / Stop Button */}
              {isRecording ? (
                <button
                  type="button"
                  onClick={handleSend}
                  className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-blue-600/50 dark:shadow-emerald-600/50 transition-transform active:scale-95 ring-4 ring-blue-400/30 dark:ring-emerald-400/30"
                  title="Yozishni yakunlash va yuborish"
                >
                  <Send className="w-7 h-7" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-xl shadow-red-600/50 transition-transform active:scale-95 ring-4 ring-red-400/30"
                  title="Video xabar yozishni boshlash"
                >
                  <div className="w-6 h-6 rounded-full bg-white animate-pulse" />
                </button>
              )}

              {/* Cancel Button */}
              <button
                type="button"
                onClick={handleClose}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-transform active:scale-90"
                title="Bekor qilish"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
