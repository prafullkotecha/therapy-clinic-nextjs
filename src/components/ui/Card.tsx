import type { ReactNode } from 'react';
import { clsx } from 'clsx';

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <div className={clsx('card', className)}>
      {children}
    </div>
  );
}

type CardHeaderProps = {
  children: ReactNode;
  className?: string;
};

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={clsx('card-header', className)}>
      {children}
    </div>
  );
}

type CardBodyProps = {
  children: ReactNode;
  className?: string;
};

export function CardBody({ children, className }: CardBodyProps) {
  return (
    <div className={clsx('card-body', className)}>
      {children}
    </div>
  );
}

type CardFooterProps = {
  children: ReactNode;
  className?: string;
};

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={clsx('card-footer', className)}>
      {children}
    </div>
  );
}
