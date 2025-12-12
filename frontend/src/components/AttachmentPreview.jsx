import { useState } from "react";
import PropTypes from "prop-types";

function AttachmentPreview({ attachments }) {
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!Array.isArray(attachments) || attachments.length === 0) return null;

  const openPreview = (idx) => {
    setLoading(true);
    setExpandedIdx(idx);
  };

  const closePreview = () => {
    setExpandedIdx(null);
    setLoading(false);
  };

  const showOverlay = expandedIdx !== null;
  const closeAfterDelay = () => {
    setTimeout(() => {
      closePreview();
    }, 300);
  };

  return (
    <div className="grid gap-2">
      <span className="text-xs font-semibold text-slate-600">Attachments</span>
      <div className="flex flex-wrap gap-2">
        {attachments.map((url, idx) => (
          <button
            key={url}
            type="button"
            className="relative"
            onMouseEnter={() => openPreview(idx)}
            onClick={() => openPreview(idx)}
            onTouchStart={() => openPreview(idx)}
          >
            <img
              src={url}
              alt="Attachment"
              className="w-28 h-28 rounded-md shadow cursor-pointer object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {showOverlay && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
          onClick={closePreview}
          onMouseLeave={closeAfterDelay}
          role="presentation"
        >
          <div className="relative flex items-center justify-center rounded-2xl bg-white/5 p-3 shadow-2xl backdrop-blur">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/40 border-t-white animate-spin rounded-full" />
              </div>
            )}
            <img
              src={attachments[expandedIdx]}
              alt="Attachment preview"
              className="max-w-[90vw] max-h-[90vh] object-contain transition-transform duration-200 scale-100 hover:scale-[1.02]"
              onLoad={() => setLoading(false)}
              style={{ opacity: loading ? 0 : 1 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

AttachmentPreview.propTypes = {
  attachments: PropTypes.arrayOf(PropTypes.string),
};

AttachmentPreview.defaultProps = {
  attachments: [],
};

export default AttachmentPreview;
