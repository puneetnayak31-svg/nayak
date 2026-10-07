import { forwardRef, type AnchorHTMLAttributes } from 'react';
import { isInternal, navigate } from '../router';

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean; replace?: boolean; scroll?: boolean };

/** next/link for the preview build: internal links navigate in memory. */
const Link = forwardRef<HTMLAnchorElement, Props>(function Link({ href, prefetch: _p, replace, scroll, onClick, target: _t, ...rest }, ref) {
  return (
    <a
      ref={ref}
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || !isInternal(href) || e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        navigate(href, { replace, scroll });
      }}
    />
  );
});

export default Link;
