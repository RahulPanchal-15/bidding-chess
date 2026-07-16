import MetaMaskIcon from './MetaMaskIcon';

export default function MetaMaskButton({
  children,
  className = 'brutal-btn-accent',
  iconClassName = 'h-5 w-5',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={`${className} inline-flex items-center justify-center gap-2`}
      {...props}
    >
      <MetaMaskIcon className={iconClassName} />
      <span>{children}</span>
    </button>
  );
}
