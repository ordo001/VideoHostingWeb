import React, { useRef, useEffect } from 'react';

const PieChart = ({ data, title, colors, height = 300 }) => {
  const canvasRef = useRef(null);
  
  // Если цвета не предоставлены, используем стандартные
  const defaultColors = [
    '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', 
    '#F97316', '#84CC16', '#EC4899', '#6B7280'
  ];
  const chartColors = colors || defaultColors;
  
  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // Устанавливаем размер canvas с учётом плотности пикселей
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    
    // Очищаем canvas
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Определяем параметры круга
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(centerX, centerY) - 60; // Отступ для легенды
    
    // Вычисляем общую сумму
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    // Если общая сумма равна 0, ничего не рисуем
    if (total === 0) return;
    
    // Начальный угол
    let currentAngle = -Math.PI / 2; // Начинаем с верхнего положения
    
    // Рисуем сектора
    data.forEach((item, index) => {
      // Вычисляем угол сектора
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      
      // Рисуем сектор
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      
      // Устанавливаем цвет
      ctx.fillStyle = chartColors[index % chartColors.length];
      ctx.fill();
      
      // Обводка для контраста
      ctx.strokeStyle = '#111827'; // Темный цвет для обводки
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Сохраняем конечный угол для следующего сектора
      currentAngle += sliceAngle;
    });
    
    // Рисуем легенду
    ctx.textAlign = 'left';
    ctx.font = '12px sans-serif';
    
    // Позиция для легенды
    const legendX = 20;
    let legendY = rect.height - data.length * 20 - 10;
    
    data.forEach((item, index) => {
      // Пропускаем очень маленькие сектора (< 3%)
      if (item.value / total < 0.03) return;
      
      // Рисуем квадрат цвета
      ctx.fillStyle = chartColors[index % chartColors.length];
      ctx.fillRect(legendX, legendY, 10, 10);
      
      // Рисуем текст
      ctx.fillStyle = '#9CA3AF';
      const percentage = ((item.value / total) * 100).toFixed(1);
      ctx.fillText(`${item.label}: ${percentage}%`, legendX + 15, legendY + 9);
      
      // Сдвигаем Y для следующей записи
      legendY += 20;
    });
    
    // Добавляем текст с общим значением в центре круга
    if (total > 0) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(total.toString(), centerX, centerY);
    }
    
  }, [data, chartColors, height]);
  
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

export default PieChart;