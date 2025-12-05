import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

function DropdownPortal({ anchorRef, children, className = '', visible = true, offsetY = 4 }) {
  const [style, setStyle] = useState({ display: 'none' });

  useEffect(() => {
    function update() {
      const anchor = anchorRef?.current;
      if (!anchor || !visible) {
        setStyle({ display: 'none' });
        return;
      }

      const rect = anchor.getBoundingClientRect();
      const top = rect.bottom + offsetY;
      const left = rect.left;
      const width = rect.width;

      setStyle({
        display: 'block',
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        right: 'auto',
        zIndex: 200000,
      });
    }

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    const ro = new ResizeObserver(update);
    if (anchorRef?.current) ro.observe(anchorRef.current);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      ro.disconnect();
    };
  }, [anchorRef, visible, offsetY]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className={className} style={style} aria-hidden={!visible}>
      {children}
    </div>,
    document.body
  );
}

export default DropdownPortal;
