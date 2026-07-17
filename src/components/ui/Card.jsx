const Card = ({
  children,
  className = '',
  padding = true, // Ahora viene por defecto como 'p-4' en lugar de 'p-6'
  hover = false,
}) => {
  return (
    <div className={`
      bg-white rounded-xl shadow-sm border border-gray-200
      ${padding ? 'p-4' : ''} 
      ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};

export default Card;