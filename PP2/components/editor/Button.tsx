import React, { ReactNode, Ref, PropsWithChildren, forwardRef, ButtonHTMLAttributes } from 'react'
import ReactDOM from 'react-dom'

interface BaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
  active: boolean
  reversed?: boolean
}

export function Button ({ className, active, reversed, ...props }: PropsWithChildren<BaseProps>) {
  const buttonClassName = `
    ${className || ""}
    cursor-pointer
    focus:outline-none
    px-4
    py-2
    rounded
    ${reversed
      ? active
        ? 'text-white'
        : 'text-gray-400'
      : active
      ? 'text-black'
      : 'text-gray-300'}
    bg-transparent
    border-none`
    return <button className={buttonClassName} {...props}  />
  
}