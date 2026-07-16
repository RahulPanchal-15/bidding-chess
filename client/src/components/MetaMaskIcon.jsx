import { assetUrl } from '../utils/format';

export default function MetaMaskIcon({ className = 'h-5 w-5' }) {
  return (
    <img
      src={assetUrl('metamask.svg')}
      alt=""
      className={`shrink-0 ${className}`}
      width={20}
      height={20}
      aria-hidden="true"
      decoding="async"
    />
  );
}
