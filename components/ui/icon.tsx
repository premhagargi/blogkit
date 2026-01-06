import { type ComponentProps } from 'react';
import { twMerge } from 'tailwind-merge';

type IconProps = ComponentProps<'svg'> & {
  icon: (props: ComponentProps<'svg'>) => React.ReactNode;
};

export function Icon({ icon: IconComponent, className, ...props }: IconProps) {
  return (
    <IconComponent
      className={twMerge('w-5 h-5 text-muted-foreground', className)}
      {...props}
    />
  );
}
