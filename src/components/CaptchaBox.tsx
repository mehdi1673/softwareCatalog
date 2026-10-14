import React, { useState, useEffect } from 'react';
import { RefreshCw, Volume2, ShieldCheck } from 'lucide-react';
import { generateCaptchaText, renderOfflineCaptcha } from '../utils/captcha';

interface CaptchaBoxProps {
  onCaptchaGenerated: (code: string) => void;
  width?: number;
  height?: number;
}

export const CaptchaBox: React.FC<CaptchaBoxProps> = ({
  onCaptchaGenerated,
  width = 160,
  height = 44,
}) => {
  const [captchaText, setCaptchaText] = useState('');
  const [dataUrl, setDataUrl] = useState('');

  const refresh = () => {
    const text = generateCaptchaText(5);
    setCaptchaText(text);
    const url = renderOfflineCaptcha(text, width, height);
    setDataUrl(url);
    onCaptchaGenerated(text);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      // Spell out characters clearly
      const spelled = captchaText.split('').join(' ');
      const utterance = new SpeechSynthesisUtterance(spelled);
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 w-full justify-between select-none">
      <div 
        className="overflow-hidden rounded-lg border border-slate-300 dark:border-slate-600 bg-white flex items-center justify-center flex-shrink-0"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {dataUrl ? (
          <img
            src={dataUrl}
            alt="کد امنیتی کپچا"
            className="w-full h-full object-cover block"
          />
        ) : (
          <div className="text-xs text-slate-400">در حال تولید...</div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleSpeak}
          title="خوانش صوتی حروف کپچا"
          className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition"
        >
          <Volume2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={refresh}
          title="تغییر تصویر کد امنیتی"
          className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition active:rotate-180"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
