import type { FormInstance } from "antd";

export const scrollToErrorField = (formInstance: FormInstance, error: any) => {
  if (!error?.errorFields?.length) return;

  const firstErrorField = error.errorFields[0].name;
  setTimeout(() => {
    formInstance.scrollToField(firstErrorField, {
      behavior: "smooth",
      block: "center",
      scrollMode: "if-needed",
    });
  }, 100);
};
