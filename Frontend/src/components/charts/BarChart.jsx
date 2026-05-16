import React, { useRef, useEffect } from 'react';

const BarChart = ({ data, title, colors = ['#4F46E5', '#10B981'], height = 300 }) => {
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
    const maxValue = Math.max(...data.flatMap(item => 
      Object.keys(item).filter(key => key !== 'label').map(key => item[key])
    ));
    
    // Количество групп (категорий)
    const groupCount = data.length;
    // Количество баров в каждой группе
    const barsPerGroup = data.length > 0 ? Object.keys(data[0]).filter(key => key !== 'label').length : 1;
    // Ширина группы баров
    const groupWidth = graphWidth / groupCount;
    // Отступ между бар внутри группы
    const barSpacing = 10;
    // Ширина каждого бара
    const barWidth = (groupWidth - barSpacing * (barsPerGroup - 1)) / barsPerGroup;
    
    // Функция для преобразования значения в координату Y
    const valueToY = (value) => {
      return padding + graphHeight - (value / maxValue) * graphHeight;
    };
    
    // Функция для получения позиции X для группы
    const groupIndexToX = (index) => {
      return padding + index * groupWidth;
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
    
    // Рисуем бары
    data.forEach((item, groupIndex) => {
      const groupX = groupIndexToX(groupIndex);
      
      // Получаем ключи баров (все ключи кроме 'label')
      const barKeys = Object.keys(item).filter(key => key !== 'label');
      
      barKeys.forEach((key, barIndex) => {
        const value = item[key];
        const x = groupX + barIndex * (barWidth + barSpacing);
        const y = valueToY(value);
        const barHeight = valueToY(0) - y;
        
        // Устанавливаем цвет для бара
        ctx.fillStyle = colors[barIndex % colors.length];
        
        // Рисуем бар
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Добавляем значение над баром если место позволяет
        if (barHeight > 20) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(value.toString(), x + barWidth / 2, y + 15);
          ctx.fillStyle = colors[barIndex % colors.length];
        }
      });
    });
    
    // Рисуем подписи по оси X
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    
    data.forEach((item, index) => {
      const x = groupIndexToX(index) + groupWidth / 2;
      ctx.fillText(item.label, x, padding + graphHeight + 20);
    });
    
    // Рисуем подписи по оси Y
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i / 5) * graphHeight;
      const value = Math.round(maxValue * (1 - i / 5));
      ctx.fillText(value.toString(), padding - 10, y + 4);
    }
    
    // Рисуем легенду
    if (barsPerGroup > 1) {
      ctx.textAlign = 'left';
      const barKeys = Object.keys(data[0]).filter(key => key !== 'label');
      
      barKeys.forEach((key, index) => {
        const legendX = padding + 10 + index * 100;
        const legendY = 15;
        
        // Рисуем квадрат цвета
        ctx.fillStyle = colors[index % colors.length];
        ctx.fillRect(legendX, legendY, 10, 10);
        
        // Рисуем текст
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '12px sans-serif';
        ctx.fillText(key, legendX + 15, legendY + 9);
      });
    }
    
  }, [data, colors, height]);
  
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

export default BarChart;