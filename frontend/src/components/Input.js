"use client";

export default function Input({
  type = "text",
  value,
  onChange,
  placeholder,
  name,
  id,
  className = ""
}) {
  return (
    <div className="input-wrapper">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        name={name}
        id={id}
        className={className}
      />
    </div>
  );
}
