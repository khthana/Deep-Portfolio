import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import "./styles/typography.css";
import { RouterProvider } from "react-router-dom";

import { ConfigProvider, Grid } from "antd";
import router from "./routes/router.tsx";
import StoreProvider from "./components/layout/store-provider.tsx";

const { useBreakpoint } = Grid;

const AppConfig = () => {
  const screens = useBreakpoint();

  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: "Bai Jamjuree",
        },
        components: {
          Table: {
            headerBg: "rgb(244, 99, 42, 0.15)",
            headerColor: "#F4632A",
            headerSplitColor: "#DFDFDF",
            borderColor: "#DFDFDF",
            // cellPaddingBlock: 24,
            fontSize: screens.xl ? 16 : 14,
            borderRadius: 16,
            headerBorderRadius: 16,
          },
          Breadcrumb: {
            itemColor: "#F4632A",
            linkColor: "#F4632A",
            lastItemColor: "#7C7C7C",
            fontSize: 16,
          },
          Select: {
            activeBorderColor: "#7C7C7C",
            hoverBorderColor: "#7C7C7C",
            optionFontSize: 16,
          },
          Tabs: {
            inkBarColor: "#3068D9",
            itemActiveColor: "#3068D9",
            itemSelectedColor: "#3068D9",
            itemHoverColor: "#3068D9",
            horizontalItemGutter: 48,
            titleFontSize: 20,
          },
          Input: {
            // activeBorderColor: "#F4632A",
            // hoverBorderColor: "#F4632A",
            activeBorderColor: "#7C7C7C",
            hoverBorderColor: "#7C7C7C",
            fontSize: 16,
          },
          Form: {
            fontSize: 16,
          },
          DatePicker: {
            activeBorderColor: "#7C7C7C",
            hoverBorderColor: "#7C7C7C",
          },
          InputNumber: {
            activeBorderColor: "#7C7C7C",
            hoverBorderColor: "#7C7C7C",
          },
          Collapse: {
            fontSize: 14,
          },
          // Radio: {
          //   buttonSolidCheckedBg: "#ffffff",
          //   buttonSolidCheckedActiveBg: "#ffffff",
          //   buttonSolidCheckedHoverBg: "#ffffff",
          //   buttonSolidCheckedColor: "#F4632A",
          //   colorPrimary: "#ffffff",
          // },
        },
      }}
    >
      <StoreProvider>
        <RouterProvider router={router} />
      </StoreProvider>
    </ConfigProvider>
  );
};
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppConfig />
  </StrictMode>,
);
