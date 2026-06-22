import { forwardRef } from 'react';

const RN_PROPS = ['onPress', 'onChangeText', 'keyboardType', 'onSubmitEditing', 'placeholderTextColor'];

function stripRNProps(props) {
  const domProps = { ...props };
  for (const key of RN_PROPS) {
    delete domProps[key];
  }
  return domProps;
}

export function View({ children, style, ...props }) {
  return <div style={style} {...stripRNProps(props)}>{children}</div>;
}

export function Text({ children, style, ...props }) {
  return <span style={{ display: 'block', ...style }} {...stripRNProps(props)}>{children}</span>;
}

export const Button = forwardRef(({ children, onPress, style, disabled, ...props }, ref) => {
  const base = {
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    border: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    padding: 0,
    background: 'none',
    color: 'inherit',
  };
  return <button ref={ref} style={{ ...base, ...style }} onClick={disabled ? undefined : onPress} disabled={disabled} {...stripRNProps(props)}>{children}</button>;
});

export const Input = forwardRef(({ onChangeText, keyboardType, onSubmitEditing, style, ...props }, ref) => {
  return (
    <input
      ref={ref}
      style={{
        border: 'none',
        outline: 'none',
        fontFamily: 'inherit',
        fontSize: 'inherit',
        background: 'none',
        color: 'inherit',
        ...style,
      }}
      onChange={onChangeText ? (e) => onChangeText(e.target.value) : undefined}
      inputMode={keyboardType === 'numeric' ? 'numeric' : keyboardType === 'email' ? 'email' : 'text'}
      onKeyDown={onSubmitEditing ? (e) => { if (e.key === 'Enter') onSubmitEditing(e); } : undefined}
      {...stripRNProps(props)}
    />
  );
});

export const Scroller = forwardRef(({ children, style, ...props }, ref) => {
  return <div ref={ref} style={{ overflowY: 'auto', ...style }} {...stripRNProps(props)}>{children}</div>;
});

export function Overlay({ children, style, ...props }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
      {...stripRNProps(props)}
    >
      {children}
    </div>
  );
}
