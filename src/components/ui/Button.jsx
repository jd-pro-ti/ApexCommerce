'use client';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[#010f20] text-white hover:bg-[#031d3d] focus:outline-none focus:ring-1 focus:ring-[#010f20]',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:outline-none focus:ring-1 focus:ring-[#010f20]',
    outline: 'border-2 border-[#010f20] text-[#010f20] hover:bg-[#010f20] hover:text-white focus:outline-none focus:ring-1 focus:ring-[#010f20]',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-900',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-900',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const classes = `${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`;

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;