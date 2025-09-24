import { useEffect } from 'react';

export const useKeyboardShortcuts = (callbacks: {
  onSave?: () => void;
  onNewFile?: () => void;
  onSearch?: () => void;
  onTogglePreview?: () => void;
  onToggleSplitView?: () => void;
  onToggleTheme?: () => void;
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { ctrlKey, metaKey, key, shiftKey } = event;
      const isModifierPressed = ctrlKey || metaKey;

      if (!isModifierPressed) return;

      switch (key) {
        case 's':
          event.preventDefault();
          callbacks.onSave?.();
          break;
        case 'n':
          event.preventDefault();
          callbacks.onNewFile?.();
          break;
        case 'f':
          event.preventDefault();
          callbacks.onSearch?.();
          break;
        case 'p':
          event.preventDefault();
          callbacks.onTogglePreview?.();
          break;
        case '\\':
          event.preventDefault();
          callbacks.onToggleSplitView?.();
          break;
        case 'k':
          if (shiftKey) {
            event.preventDefault();
            callbacks.onToggleTheme?.();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [callbacks]);
};