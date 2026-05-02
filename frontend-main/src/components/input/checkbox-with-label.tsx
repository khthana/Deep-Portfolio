import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  color?: "green" | "orange" | "blue" | "black";
};

const CheckboxWithLabel = ({ label, color = "blue", ...rest }: Props) => {
  return (
    <label className={`custom-checkbox ${color}`}>
      <input type="checkbox" {...rest} />
      <span className="checkmark"></span>
      <span className="caption-regular">{label}</span>
    </label>
  );
};

export default CheckboxWithLabel;
