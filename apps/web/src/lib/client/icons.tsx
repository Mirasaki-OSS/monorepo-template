// https://github.com/homarr-labs/dashboard-icons
// Dashboard Icons CDN Format: <Base URL>/<Format>/<Icon Name>.<Format>
// Example: <img src="https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/plex.svg" alt="Plex">
// Browse Icons:

import { cn } from '@md-oss/design-system/lib/utils';
import { icons } from 'lucide-react';
import Image from 'next/image';
import { createElement } from 'react';

const DASHBOARD_ICON_BASE_URL =
  'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons';

export type DashboardIconOptions = {
  icon: string;
  className?: string;
  format?: 'svg' | 'png';
  size?: number;
  alt?: string;
};

export type DashboardIcon = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'alt' | 'width' | 'height'
> & {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type DashboardIconProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'alt' | 'width' | 'height'
> &
  DashboardIconOptions;

/**
 * Generates the necessary attributes for rendering a dashboard icon from the Homarr Labs Dashboard Icons CDN.
 *
 * @see {@link https://dashboardicons.com/icons?q= Dashboard Icons} for available icons and their names.
 *
 * @param options - An object containing the icon name, optional className, format, size, and alt text.
 *   - icon: The name of the icon to render (e.g., 'plex', 'discord').
 *   - className: Optional additional CSS classes to apply to the image element.
 *   - format: The format of the icon, either 'svg' or 'png'. Defaults to 'svg'.
 *   - size: The size (width and height) of the icon in pixels. Defaults to 16.
 *   - alt: The alt text for the image. Defaults to `${icon} icon`.
 *
 * @returns An object containing the attributes for an HTML image element to render the specified dashboard icon.
 *
 * @example
 * <img {...dashboardIconAttributes({ icon: 'plex', format: 'svg', size: 24 })} />
 * <Image {...dashboardIconAttributes({ icon: 'discord', format: 'png', size: 32, alt: 'Discord Logo' })} />
 */
export const dashboardIconAttributes = ({
  icon,
  format = 'svg',
  size = 16,
  className,
  alt = `${icon} icon`,
}: DashboardIconOptions): DashboardIcon => ({
  width: size,
  height: size,
  className: cn('inline-block shrink-0 w-auto', className),
  src: icon.startsWith('http')
    ? icon
    : `${DASHBOARD_ICON_BASE_URL}/${format}/${icon}.${format}`,
  alt,
  style: { width: `${size}px`, height: `${size}px` },
});

export const DashboardIcon = ({
  icon,
  format = 'svg',
  size = 16,
  alt = `${icon} icon`,
  ...props
}: DashboardIconProps) => (
  <Image {...dashboardIconAttributes({ icon, format, size, alt })} {...props} />
);

export const DiscordIcon = ({
  size = 16,
  format,
  alt = 'Discord Logo',
  ...props
}: Omit<DashboardIconProps, 'icon'>) => (
  <DashboardIcon
    icon="discord"
    format={format}
    size={size}
    alt={alt}
    {...props}
  />
);

export const GithubIcon = ({
  size = 16,
  format,
  alt = 'GitHub Logo',
  className,
  ...props
}: Omit<DashboardIconProps, 'icon'>) => (
  <>
    <DashboardIcon
      icon="https://cdn.jsdelivr.net/npm/@lobehub/icons-static-svg@latest/icons/github.svg"
      format={format}
      size={size}
      alt={alt}
      className={cn('inline-block dark:hidden', className)}
      {...props}
    />
    <DashboardIcon
      icon="https://cdn.jsdelivr.net/npm/@lobehub/icons-static-png@latest/dark/github.png"
      format={format}
      size={size}
      alt={alt}
      className={cn('dark:inline-block hidden', className)}
      {...props}
    />
  </>
);

export const iconRenderer = (icon: string | undefined) => {
  if (!icon) {
    return;
  }

  const normalizedIcon = icon.replace(/Icon$/, '');
  const lowercaseIcon = normalizedIcon.toLowerCase();

  if (lowercaseIcon === 'discord') {
    return createElement(DiscordIcon, { size: 16 });
  }

  if (lowercaseIcon === 'github') {
    return createElement(GithubIcon, { size: 16, className: '' });
  }

  if (normalizedIcon in icons) {
    return createElement(icons[normalizedIcon as keyof typeof icons]);
  }
};
