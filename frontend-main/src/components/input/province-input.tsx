import React, { forwardRef } from "react";
import { Input } from "antd";
import type { InputProps, InputRef } from "antd";

const ProvinceInput = forwardRef<InputRef, InputProps>((props, ref) => {
  return (
    <Input
      {...props}
      ref={ref}
      placeholder={props.placeholder || "เช่น กรุงเทพมหานคร เชียงใหม่"}
    />
  );
});

ProvinceInput.displayName = "ProvinceInput";

export default ProvinceInput;
