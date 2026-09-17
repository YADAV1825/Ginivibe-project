import React from 'react';

export interface DeviceFrameProps {
  /** @deprecated Layout is CSS-driven; kept for API compatibility. */
  width?: number;
  /** @deprecated Layout is CSS-driven; kept for API compatibility. */
  height?: number;
  src?: string;
  videoSrc?: string;
  videoRef?: React.Ref<HTMLVideoElement>;
  videoLabel?: string;
  className?: string;
}

/** Android-style device screen presenting the actual GiniVibe demo video.
 *  The screen keeps the exact 478x850 aspect of the demo video (see
 *  .gv-phone-screen in landing.css), so the video fits edge to edge with
 *  zero cropping on every viewport. Rendered as plain HTML for reliable
 *  video sizing; the outer bezel comes from .gv-device-frame. */
export function DeviceFrame({
  src,
  videoSrc,
  videoRef,
  videoLabel = 'GiniVibe Android app demo video',
  className = '',
}: DeviceFrameProps) {
  return (
    <div
      className={`gv-phone-screen ${className}`.trim()}
      role="img"
      aria-label={src || videoSrc ? videoLabel : 'Android phone frame'}
    >
      <div className="gv-phone-camera" aria-hidden="true" />
      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          disablePictureInPicture
          preload="metadata"
          aria-label={videoLabel}
        />
      ) : src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={videoLabel} />
      ) : null}
    </div>
  );
}

export default DeviceFrame;
