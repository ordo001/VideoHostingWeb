import React, { useRef, useEffect } from 'react';

const LineChart = ({ data, title, color = '#4F46E5', height = 300 }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // Устанавливаем размер canvas с учётом плотности пикселей
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    // Очищаем canvas
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Определяем размеры графика
    const padding = 40;
    const graphWidth = rect.width - (padding * 2);
    const graphHeight = rect.height - (padding * 2);
    
    // Находим максимальное значение для масштабирования
    const maxValue = Math.max(...data.map(item => item.value));
    
    // Функция для преобразования значения в координату Y
    const valueToY = (value) => {
      return padding + graphHeight - (value / maxValue) * graphHeight;
    };
    
    // Функция для преобразования индекса в координату X
    const indexToX = (index) => {
      return padding + (index / (data.length - 1)) * graphWidth;
    };
    
    // Рисуем сетку
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 0.5;
    
    // Горизонтальные линии сетки
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i / 5) * graphHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + graphWidth, y);
      ctx.stroke();
    }
    
    // Вертикальные линии сетки
    for (let i = 0; i < data.length; i++) {
      const x = indexToX(i);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + graphHeight);
      ctx.stroke();
    }
    
    // Рисуем.line график
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    data.forEach((item, index) => {
      const x = indexToX(index);
      const y = valueToY(item.value);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Рисуем точки
    ctx.fillStyle = color;
    data.forEach((item, index) => {
      const x = indexToX(index);
      const y = valueToY(item.value);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Рисуем подписи по оси X
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    
    data.forEach((item, index) => {
      const x = indexToX(index);
      ctx.fillText(item.label, x, padding + graphHeight + 20);
    });
    
    // Рисуем подписи по оси Y
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i / 5) * graphHeight;
      const value = Math.round(maxValue * (1 - i / 5));
      ctx.fillText(value.toString(), padding - 10, y + 4);
    }
    
  }, [data, color, height]);
  
  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
      <div className="relative" style={{ height: `${height}px` }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};

export default LineChart;