const Card = ({
  children,
  className = '',
  padding = true, 
  hover = false,
}) => {
  return (
    <div className={`
      bg-white rounded-xl shadow-sm border border-gray-200 
      overflow-hidden flex flex-col
      ${padding ? 'p-4' : ''} 
      ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
      ${className}
    `}>
      <div className="w-full h-full [&_img]:w-full [&_img]:h-48 [&_img]:object-cover [&_img]:rounded-lg">
        {children}
      </div>
    </div>
  );
};

export default Card;