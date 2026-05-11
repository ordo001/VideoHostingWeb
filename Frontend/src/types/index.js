// Типы данных для пользователей
export const User = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  avatar: PropTypes.string,
  isAdmin: PropTypes.bool,
  createdAt: PropTypes.string,
  updatedAt: PropTypes.string,
};

// Типы данных для видео
export const Video = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  thumbnailUrl: PropTypes.string,
  hlsUrl: PropTypes.string,
  duration: PropTypes.number,
  views: PropTypes.number,
  likes: PropTypes.number,
  dislikes: PropTypes.number,
  createdAt: PropTypes.string,
  updatedAt: PropTypes.string,
  author: PropTypes.shape(User),
};

// Типы данных для каналов
export const Channel = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  avatarUrl: PropTypes.string,
  bannerUrl: PropTypes.string,
  subscribersCount: PropTypes.number,
  videosCount: PropTypes.number,
  createdAt: PropTypes.string,
};

// Типы данных для комментариев
export const Comment = {
  id: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  likes: PropTypes.number,
  createdAt: PropTypes.string,
  author: PropTypes.shape(User),
};

// Типы данных для уведомлений
export const Notification = {
  id: PropTypes.number.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']).isRequired,
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  duration: PropTypes.number,
};

// Типы данных для модальных окон
export const Modal = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', '2xl']),
};

// Типы данных для кнопок
export const Button = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'ghost', 'danger']),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};

// Типы данных для инпутов
export const Input = {
  label: PropTypes.string,
  id: PropTypes.string,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  error: PropTypes.string,
  required: PropTypes.bool,
  className: PropTypes.string,
};