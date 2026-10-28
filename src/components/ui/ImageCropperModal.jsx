import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Check,
  X,
  Move,
  Camera,
  Sliders,
  Sparkles,
} from 'lucide-react';
import Button from './Button';

/**
 * Telegram-style Interactive Image Cropper Modal
 * Allows zooming (slider, wheel, pinch), dragging in 4 directions (pan),
 * 90-degree rotating, and live circular preview.
 */
export default function ImageCropperModal({
  isOpen,
  imageFile = null,
  imageSrc = null,
  onClose,
  onCrop,
  title = 'Profil rasmini moslashtirish',
  subtitle = 'Rasmni suring, kattalashtiring va o‘lchamini sozlang',
}) {
  const [sourceUrl, setSourceUrl] = useState('');
  const [imgElement, setImgElement] = useState(null);
  const [imgNaturalSize, setImgNaturalSize] = useState({ width: 0, height: 0 });

  // Cropper state
  const [zoom, setZoom] = useState(1.0); // 1.0 to 3.5
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // References
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0, initialOffsetX: 0, initialOffsetY: 0 });
  const touchPinchRef = useRef({ initialDist: 0, initialZoom: 1 });

  // Crop area radius and canvas viewport size
  const CANVAS_SIZE = 340;
  const CROP_RADIUS = 135; // 270px diameter circle

  // 1. Convert imageFile to URL or use imageSrc
  useEffect(() => {
    if (!isOpen) {
      setImgElement(null);
      setSourceUrl('');
      setZoom(1.0);
      setOffset({ x: 0, y: 0 });
      setRotation(0);
      return;
    }

    let activeUrl = '';
    if (imageFile) {
      if (typeof imageFile === 'string') {
        activeUrl = imageFile;
      } else {
        activeUrl = URL.createObjectURL(imageFile);
      }
    } else if (imageSrc) {
      activeUrl = imageSrc;
    }

    if (!activeUrl) return;

    setSourceUrl(activeUrl);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImgNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      setImgElement(img);
      setZoom(1.0);
      setOffset({ x: 0, y: 0 });
      setRotation(0);
    };
    img.onerror = () => {
      console.error('ImageCropperModal: Failed to load image');
    };
    img.src = activeUrl;

    return () => {
      if (activeUrl && activeUrl.startsWith('blob:')) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [isOpen, imageFile, imageSrc]);

  // Compute base scale so image always completely covers the crop circle at zoom=1.0
  const getBaseScale = useCallback(
    (rot = rotation) => {
      if (!imgNaturalSize.width || !imgNaturalSize.height) return 1.0;
      const isSwapped = rot === 90 || rot === 270;
      const effW = isSwapped ? imgNaturalSize.height : imgNaturalSize.width;
      const effH = isSwapped ? imgNaturalSize.width : imgNaturalSize.height;
      const diameter = CROP_RADIUS * 2;
      return Math.max(diameter / effW, diameter / effH);
    },
    [imgNaturalSize, rotation]
  );

  // Clamp offset to ensure the crop circle never reveals empty space outside the image
  const clampOffset = useCallback(
    (x, y, currentZoom = zoom, rot = rotation) => {
      if (!imgNaturalSize.width || !imgNaturalSize.height) return { x: 0, y: 0 };
      const isSwapped = rot === 90 || rot === 270;
      const effW = isSwapped ? imgNaturalSize.height : imgNaturalSize.width;
      const effH = isSwapped ? imgNaturalSize.width : imgNaturalSize.height;

      const baseScale = getBaseScale(rot);
      const totalW = effW * baseScale * currentZoom;
      const totalH = effH * baseScale * currentZoom;
      const diameter = CROP_RADIUS * 2;

      const maxOffsetX = Math.max(0, (totalW - diameter) / 2);
      const maxOffsetY = Math.max(0, (totalH - diameter) / 2);

      return {
        x: Math.max(-maxOffsetX, Math.min(maxOffsetX, x)),
        y: Math.max(-maxOffsetY, Math.min(maxOffsetY, y)),
      };
    },
    [imgNaturalSize, zoom, rotation, getBaseScale]
  );

  // Redraw Main Canvas and Mini Preview
  useEffect(() => {
    if (!canvasRef.current || !imgElement) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;
    ctx.scale(dpr, dpr);

    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;

    // Clear background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw Transformed Image
    ctx.save();
    ctx.translate(cx + offset.x, cy + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    const scale = getBaseScale() * zoom;
    ctx.scale(scale, scale);
    ctx.drawImage(
      imgElement,
      -imgNaturalSize.width / 2,
      -imgNaturalSize.height / 2,
      imgNaturalSize.width,
      imgNaturalSize.height
    );
    ctx.restore();

    // Draw Modern Squircle Cutout & Outer Vignette
    const cropSize = CROP_RADIUS * 2;
    const cropLeft = cx - CROP_RADIUS;
    const cropTop = cy - CROP_RADIUS;
    const squircleRadius = 36;

    ctx.save();
    ctx.fillStyle = 'rgba(11, 17, 32, 0.72)';
    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    // Cutout squircle using counter-clockwise path
    if (ctx.roundRect) {
      // Use roundRect or custom path
      ctx.roundRect(cropLeft, cropTop, cropSize, cropSize, squircleRadius);
    } else {
      ctx.moveTo(cropLeft + squircleRadius, cropTop);
      ctx.lineTo(cropLeft + cropSize - squircleRadius, cropTop);
      ctx.quadraticCurveTo(cropLeft + cropSize, cropTop, cropLeft + cropSize, cropTop + squircleRadius);
      ctx.lineTo(cropLeft + cropSize, cropTop + cropSize - squircleRadius);
      ctx.quadraticCurveTo(cropLeft + cropSize, cropTop + cropSize, cropLeft + cropSize - squircleRadius, cropTop + cropSize);
      ctx.lineTo(cropLeft + squircleRadius, cropTop + cropSize);
      ctx.quadraticCurveTo(cropLeft, cropTop + cropSize, cropLeft, cropTop + cropSize - squircleRadius);
      ctx.lineTo(cropLeft, cropTop + squircleRadius);
      ctx.quadraticCurveTo(cropLeft, cropTop, cropLeft + squircleRadius, cropTop);
    }
    ctx.fill('evenodd');

    // Subtle grid lines when dragging
    if (isDragging) {
      ctx.save();
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(cropLeft, cropTop, cropSize, cropSize, squircleRadius);
      } else {
        ctx.rect(cropLeft, cropTop, cropSize, cropSize);
      }
      ctx.clip();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      const third = cropSize / 3;

      // 2 horizontal grid lines
      ctx.beginPath();
      ctx.moveTo(cropLeft, cropTop + third);
      ctx.lineTo(cropLeft + cropSize, cropTop + third);
      ctx.moveTo(cropLeft, cropTop + third * 2);
      ctx.lineTo(cropLeft + cropSize, cropTop + third * 2);

      // 2 vertical grid lines
      ctx.moveTo(cropLeft + third, cropTop);
      ctx.lineTo(cropLeft + third, cropTop + cropSize);
      ctx.moveTo(cropLeft + third * 2, cropTop);
      ctx.lineTo(cropLeft + third * 2, cropTop + cropSize);
      ctx.stroke();
      ctx.restore();
    }

    // Modern Squircle Border Ring
    ctx.strokeStyle = '#10b981'; // emerald-500
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(cropLeft, cropTop, cropSize, cropSize, squircleRadius);
    } else {
      ctx.rect(cropLeft, cropTop, cropSize, cropSize);
    }
    ctx.stroke();
    ctx.restore();

    // Draw Mini Preview Thumbnail
    if (previewCanvasRef.current) {
      const pCanvas = previewCanvasRef.current;
      const pCtx = pCanvas.getContext('2d');
      if (pCtx) {
        const pSize = 56;
        pCanvas.width = pSize * dpr;
        pCanvas.height = pSize * dpr;
        pCtx.scale(dpr, dpr);

        pCtx.clearRect(0, 0, pSize, pSize);
        pCtx.save();
        pCtx.beginPath();
        if (pCtx.roundRect) {
          pCtx.roundRect(0, 0, pSize, pSize, 12);
        } else {
          pCtx.rect(0, 0, pSize, pSize);
        }
        pCtx.clip();

        const pRatio = pSize / (CROP_RADIUS * 2);
        pCtx.translate(pSize / 2 + offset.x * pRatio, pSize / 2 + offset.y * pRatio);
        pCtx.rotate((rotation * Math.PI) / 180);
        const pScale = scale * pRatio;
        pCtx.scale(pScale, pScale);
        pCtx.drawImage(
          imgElement,
          -imgNaturalSize.width / 2,
          -imgNaturalSize.height / 2,
          imgNaturalSize.width,
          imgNaturalSize.height
        );
        pCtx.restore();
      }
    }
  }, [
    imgElement,
    imgNaturalSize,
    zoom,
    offset,
    rotation,
    isDragging,
    getBaseScale,
  ]);

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialOffsetX: offset.x,
      initialOffsetY: offset.y,
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const nextOffset = clampOffset(
      dragStartRef.current.initialOffsetX + dx,
      dragStartRef.current.initialOffsetY + dy
    );
    setOffset(nextOffset);
  };

  const handleMouseUp = () => {
    if (isDragging) setIsDragging(false);
  };

  // Touch handlers (Drag & Pinch Zoom)
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        initialOffsetX: offset.x,
        initialOffsetY: offset.y,
      };
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchPinchRef.current = { initialDist: dist, initialZoom: zoom };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging) {
      e.preventDefault();
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      const nextOffset = clampOffset(
        dragStartRef.current.initialOffsetX + dx,
        dragStartRef.current.initialOffsetY + dy
      );
      setOffset(nextOffset);
    } else if (e.touches.length === 2 && touchPinchRef.current.initialDist > 0) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / touchPinchRef.current.initialDist;
      const newZoom = Math.min(3.5, Math.max(1.0, touchPinchRef.current.initialZoom * ratio));
      setZoom(newZoom);
      setOffset((prev) => clampOffset(prev.x, prev.y, newZoom));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchPinchRef.current.initialDist = 0;
  };

  // Wheel zoom handler
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    const newZoom = Math.min(3.5, Math.max(1.0, zoom + delta));
    setZoom(newZoom);
    setOffset((prev) => clampOffset(prev.x, prev.y, newZoom));
  };

  // Rotate 90 degrees
  const handleRotate = () => {
    const nextRot = (rotation + 90) % 360;
    setRotation(nextRot);
    setOffset((prev) => clampOffset(prev.x, prev.y, zoom, nextRot));
  };

  // Reset to original center & zoom
  const handleReset = () => {
    setZoom(1.0);
    setOffset({ x: 0, y: 0 });
    setRotation(0);
  };

  // Zoom slider change
  const handleZoomChange = (e) => {
    const val = parseFloat(e.target.value);
    setZoom(val);
    setOffset((prev) => clampOffset(prev.x, prev.y, val));
  };

  // Export cropped avatar
  const handleApplyCrop = async () => {
    if (!imgElement) return;

    try {
      setIsProcessing(true);

      // Create an off-screen HD 512x512 canvas for crisp avatar quality
      const EXPORT_SIZE = 512;
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = EXPORT_SIZE;
      exportCanvas.height = EXPORT_SIZE;
      const expCtx = exportCanvas.getContext('2d');

      if (!expCtx) throw new Error('Canvas context not available');

      // Ratio of export size to crop diameter
      const exportRatio = EXPORT_SIZE / (CROP_RADIUS * 2);

      // Background white (for clean JPEGs without black background)
      expCtx.fillStyle = '#ffffff';
      expCtx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);

      // Translate & Draw full edge-to-edge square image
      expCtx.save();
      expCtx.translate(
        EXPORT_SIZE / 2 + offset.x * exportRatio,
        EXPORT_SIZE / 2 + offset.y * exportRatio
      );
      expCtx.rotate((rotation * Math.PI) / 180);
      const finalScale = getBaseScale() * zoom * exportRatio;
      expCtx.scale(finalScale, finalScale);

      expCtx.drawImage(
        imgElement,
        -imgNaturalSize.width / 2,
        -imgNaturalSize.height / 2,
        imgNaturalSize.width,
        imgNaturalSize.height
      );
      expCtx.restore();

      // Export as high quality JPEG
      const croppedDataUrl = exportCanvas.toDataURL('image/jpeg', 0.92);

      exportCanvas.toBlob(
        (blob) => {
          let croppedFile = null;
          if (blob) {
            croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
          }
          if (onCrop) {
            onCrop(croppedDataUrl, croppedFile);
          }
          setIsProcessing(false);
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      console.error('Failed to export cropped image:', err);
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crop Viewport */}
        <div className="p-4 flex flex-col items-center bg-gray-50 dark:bg-gray-950/50">
          <div
            className="relative rounded-2xl overflow-hidden shadow-inner border border-gray-200/80 dark:border-gray-800 select-none cursor-grab active:cursor-grabbing touch-none"
            style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            <canvas
              ref={canvasRef}
              style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
              className="block"
            />

            {/* Telegram Hint Badge */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] text-white/90 font-medium flex items-center gap-1.5 pointer-events-none">
              <Move className="w-3 h-3 text-emerald-400" />
              <span>Surish va yaqinlashtirish mumkin</span>
            </div>
          </div>

          {/* Zoom Slider Bar */}
          <div className="w-full max-w-[340px] mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const nextZ = Math.max(1.0, zoom - 0.2);
                setZoom(nextZ);
                setOffset((prev) => clampOffset(prev.x, prev.y, nextZ));
              }}
              title="Kichraytirish"
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <div className="flex-1 relative flex items-center">
              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.01"
                value={zoom}
                onChange={handleZoomChange}
                className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-500"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                const nextZ = Math.min(3.0, zoom + 0.2);
                setZoom(nextZ);
                setOffset((prev) => clampOffset(prev.x, prev.y, nextZ));
              }}
              title="Kattalashtirish"
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <span className="text-[11px] font-mono font-bold text-gray-600 dark:text-gray-300 w-10 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Action Toolbar & Mini Preview */}
          <div className="w-full max-w-[340px] mt-3.5 pt-3 border-t border-gray-200/60 dark:border-gray-800/80 flex items-center justify-between">
            {/* Rotate & Reset buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleRotate}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-xs transition-colors"
                title="90 gradus burish"
              >
                <RotateCw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>90° burish</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 rounded-xl text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors"
                title="Boshlang‘ich holatga qaytarish"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Telegram circular live mini preview */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
                Natija:
              </span>
              <div
                className="w-10 h-10 rounded-full border-2 border-emerald-500/80 shadow-md overflow-hidden bg-gray-800"
                title="Guruh yoki profildagi ko‘rinishi"
              >
                <canvas
                  ref={previewCanvasRef}
                  style={{ width: 40, height: 40 }}
                  className="block"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2.5 bg-white dark:bg-gray-900">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isProcessing}
          >
            Bekor qilish
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleApplyCrop}
            loading={isProcessing}
            icon={Check}
          >
            Tasdiqlash va saqlash
          </Button>
        </div>
      </div>
    </div>
  );
}
