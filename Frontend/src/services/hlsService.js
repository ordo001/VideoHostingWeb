import Hls from 'hls.js';

const HLS_BASE_URL = 'http://localhost:9000'; // S3/MinIO хранилище

/**
 * Упрощенный сервис для работы с HLS видео
 */
export const hlsService = {
    /**
     * Получает мастер плейлист HLS напрямую из S3
     * @param {string} videoId - ID видео
     * @returns {Promise<string>} - Содержимое мастер плейлиста
     */
    getMasterPlaylist: async (videoId) => {
        try {
            const response = await fetch(`${HLS_BASE_URL}/videos/${videoId}/master.m3u8`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.text();
        } catch (error) {
            console.error('Error fetching master playlist:', error);
            throw error;
        }
    },

    /**
     * Извлекает доступные качества из мастер плейлиста
     * @param {string} playlistContent - Содержимое мастер плейлиста
     * @returns {Array<{height: number, name: string}>} - Доступные качества
     */
    getAvailableQualities: (playlistContent) => {
        const qualities = [];
        const lines = playlistContent.split('\n');
        
        // Парсим плейлист для извлечения информации о качествах
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Ищем строки с информацией о разрешении
            if (line.startsWith('#EXT-X-STREAM-INF:')) {
                const resolutionMatch = line.match(/RESOLUTION=\d+x(\d+)/);
                if (resolutionMatch) {
                    const height = parseInt(resolutionMatch[1], 10);
                    // Переходим к следующей строке, которая содержит URL плейлиста
                    const playlistLine = lines[i + 1]?.trim();
                    if (playlistLine && !playlistLine.startsWith('#')) {
                        // Извлекаем качество из URL плейлиста
                        const qualityMatch = playlistLine.match(/stream_(\d+p)/);
                        if (qualityMatch) {
                            const qualityName = qualityMatch[1].toUpperCase();
                            qualities.push({
                                height,
                                name: qualityName,
                                playlistUrl: playlistLine
                            });
                        }
                    }
                }
            }
        }
        
        // Сортируем по возрастанию качества
        return qualities.sort((a, b) => a.height - b.height);
    }
};

export default hlsService;