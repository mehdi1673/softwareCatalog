import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft } from 'lucide-react';
import { PERSIAN_MONTH_NAMES, getDaysInJalaliMonth, gregorianToJalali } from '../utils/shamsi';

interface SolarDatePickerProps {
  value?: string;
  onChange: (dateStr: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const SolarDatePicker: React.FC<SolarDatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = '۱۴۰۳/۰۸/۰۱',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Parse current value or fallback to today
  const parseInitialDate = () => {
    if (value && value.includes('/')) {
      const parts = value.split('/').map(p => parseInt(p, 10));
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        return { year: parts[0], month: parts[1], day: parts[2] };
      }
    }
    const now = new Date();
    const [jy, jm, jd] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    return { year: jy, month: jm, day: jd };
  };

  const initial = parseInitialDate();
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);

  const daysInMonth = getDaysInJalaliMonth(viewYear, viewMonth);

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear(viewYear - 1);
      setViewMonth(12);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear(viewYear + 1);
      setViewMonth(1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const selected = `${viewYear}/${pad(viewMonth)}/${pad(day)}`;
    onChange(selected);
    setIsOpen(false);
  };

  const selectedParts = value ? value.split('/').map(p => parseInt(p, 10)) : null;
  const isDaySelected = (day: number) => {
    if (!selectedParts || selectedParts.length !== 3) return false;
    return selectedParts[0] === viewYear && selectedParts[1] === viewMonth && selectedParts[2] === day;
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 cursor-pointer transition ${
          disabled
            ? 'opacity-60 cursor-not-allowed border-slate-200 dark:border-slate-800'
            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500'
        }`}
      >
        <span className={value ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-400'}>
          {value || placeholder}
        </span>
        <CalendarIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      </div>

      {isOpen && !disabled && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-1 right-0 z-50 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-3 animate-in fade-in zoom-in-95">
            {/* Header: Month and Year Nav */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
                title="ماه بعد"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {PERSIAN_MONTH_NAMES[viewMonth - 1]} {viewYear}
              </div>
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
                title="ماه قبل"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1 text-slate-400 font-medium">
              <span>ش</span>
              <span>ی</span>
              <span>د</span>
              <span>س</span>
              <span>چ</span>
              <span>پ</span>
              <span>ج</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const selected = isDaySelected(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`h-8 w-8 mx-auto rounded-lg font-medium transition flex items-center justify-center ${
                      selected
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  const [jy, jm, jd] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
                  const pad = (n: number) => n.toString().padStart(2, '0');
                  onChange(`${jy}/${pad(jm)}/${pad(jd)}`);
                  setIsOpen(false);
                }}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                انتخاب تاریخ امروز
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="text-rose-500 hover:underline"
              >
                پاک کردن
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
