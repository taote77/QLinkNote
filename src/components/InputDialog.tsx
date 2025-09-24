import { useState } from 'react';

interface InputDialogProps {
  isOpen: boolean;
  title: string;
  placeholder: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

const InputDialog: React.FC<InputDialogProps> = ({
  isOpen,
  title,
  placeholder,
  defaultValue = '',
  onConfirm,
  onCancel
}) => {
  const [value, setValue] = useState(defaultValue);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onConfirm(value.trim());
      setValue('');
    }
  };

  const handleCancel = () => {
    onCancel();
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={handleCancel}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '24px',
          minWidth: '300px',
          maxWidth: '500px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            margin: '0 0 16px 0',
            color: 'var(--text-primary)',
            fontSize: '16px',
            fontWeight: 600
          }}
        >
          {title}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              marginBottom: '16px',
              outline: 'none'
            }}
          />
          
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              取消
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: 'var(--text-accent)',
                color: 'white',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              确定
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InputDialog;