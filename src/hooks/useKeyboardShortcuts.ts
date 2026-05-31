import { useEffect } from 'react';

const useKeyboardShortcuts = (
  onAdd: () => void,
  enabled: boolean
) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;

      const isAltN = event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 'n';
      const isCtrlSpace = event.ctrlKey && !event.altKey && !event.metaKey && event.code === 'Space';

      if (isAltN || isCtrlSpace) {
        event.preventDefault();
        onAdd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onAdd, enabled]);
};

export default useKeyboardShortcuts;
