import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CircleCheck, Info, TriangleAlert, X } from "lucide-react";

type ToastKind = "success" | "info" | "error";

interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  text?: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastOptions {
  kind?: ToastKind;
  text?: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

type Notify = (title: string, options?: ToastOptions) => void;

const ToastContext = createContext<Notify>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback<Notify>(
    (title, options = {}) => {
      const id = Date.now() + Math.random();
      setItems((list) => [
        ...list.slice(-2),
        {
          id,
          title,
          kind: options.kind ?? "success",
          text: options.text,
          actionLabel: options.actionLabel,
          onAction: options.onAction,
        },
      ]);
      window.setTimeout(() => dismiss(id), options.duration ?? 5000);
    },
    [dismiss]
  );

  const value = useMemo(() => notify, [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="toast-stack" aria-live="polite">
        {items.map((t) => (
          <div className={`toast toast-${t.kind}`} key={t.id}>
            <div className="toast-icon">
              {t.kind === "success" && <CircleCheck size={20} />}
              {t.kind === "info" && <Info size={20} />}
              {t.kind === "error" && <TriangleAlert size={20} />}
            </div>

            <div className="toast-body">
              <strong>{t.title}</strong>
              {t.text && <span>{t.text}</span>}
            </div>

            {t.actionLabel && t.onAction && (
              <button
                className="toast-action"
                onClick={() => {
                  t.onAction?.();
                  dismiss(t.id);
                }}
              >
                {t.actionLabel}
              </button>
            )}

            <button
              className="toast-close"
              onClick={() => dismiss(t.id)}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
