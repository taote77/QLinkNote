import { useEffect, useState } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // 等待动画完成
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Check size={18} />;
      case 'error':
        return <X size={18} />;
      case 'info':
        return <AlertCircle size={18} />;
      default:
        return null;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success':
        return '#10b981'; // green-500
      case 'error':
        return '#ef4444'; // red-500
      case 'info':
        return '#3b82f6'; // blue-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: 'var(--bg-primary)',
        border: `1px solid ${getColor()}`,
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
        minWidth: '200px',
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s ease',
        color: getColor()
      }}
      onClick={() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }}
    >
      {getIcon()}
      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
        {message}
      </span>
    </div>
  );
};

interface ToastManagerProps {
  toasts: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>;
  onRemoveToast: (id: string) => void;
}

export const ToastManager: React.FC<ToastManagerProps> = ({ toasts, onRemoveToast }) => {
  return (
    <>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            position: 'fixed',
            top: `${20 + index * 70}px`,
            right: '20px',
            zIndex: 1000
          }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => onRemoveToast(toast.id)}
          />
        </div>
      ))}
    </>
  );
};

export default Toast;