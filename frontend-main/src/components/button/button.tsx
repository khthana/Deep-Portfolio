import type { ButtonHTMLAttributes } from "react";
import classNames from "classnames";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "orange" | "contrast";
  disable?: boolean;
  iconSrc?: string;
  loading?: boolean;
};

const Button: React.FC<Props> = ({
  onClick,
  className,
  children,
  variant = "primary",
  disable = false,
  iconSrc: icon,
  loading = false,
  ...props
}: Props) => {
  const variantClasses: Record<string, string> = {
    // blue bg => hover: dark blue
    primary:
      "transition ease-in-out duration-300 text-white bg-secondary-blue py-2 px-6 rounded-3xl body-bold-3 hover:bg-[#2758BC] cursor-pointer",

    // blue outline
    secondary:
      "transition ease-in-out duration-300 text-secondary-blue border-2 border-secondary-blue py-2 px-6 rounded-4xl body-bold-3 cursor-pointer",

    // orange outline
    outline:
      "transition ease-in-out duration-300 border-[2.5px] border-primary-orange text-primary-orange py-2 px-4 rounded-4xl body-bold-3 cursor-pointer",

    // orange bg => hover:dark orange
    orange:
      "transition ease-in-out duration-300 bg-primary-orange text-white py-2 px-6 rounded-2xl body-bold-3 hover:bg-[#C95426] cursor-pointer",

    // blue bg => hover:dark orange
    contrast:
      "transition ease-in-out duration-300 text-white bg-secondary-blue py-2 px-6 rounded-2xl body-bold-3 hover:bg-[#C95426] cursor-pointer",
  };

  return (
    <button
      className={classNames(className, variantClasses[variant], {
        // ✅ แก้ไขตรงนี้: ใช้ ! เพื่อบังคับทับสีเดิมให้เป็นสีเทา
        "!bg-gray-300 !border-gray-300 !text-gray-500 !cursor-not-allowed hover:!bg-gray-300 shadow-none":
          disable || loading,
      })}
      onClick={onClick}
      disabled={disable || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
          <span>Loading...</span>
        </div>
      ) : icon ? (
        <div className="flex gap-2 items-center justify-center">
          <img src={icon} alt="icon" />
          <div>{children}</div>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
