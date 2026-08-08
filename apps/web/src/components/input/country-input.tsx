import React, { forwardRef } from "react";
import { Input } from "antd";
import type { InputProps, InputRef } from "antd";

const CountryInput = forwardRef<InputRef, InputProps>((props, ref) => {
  return (
    <Input
      {...props}
      ref={ref}
      placeholder={props.placeholder || "เช่น ไทย จีน อังกฤษ"}
    />
  );
});

CountryInput.displayName = "CountryInput";

export default CountryInput;
