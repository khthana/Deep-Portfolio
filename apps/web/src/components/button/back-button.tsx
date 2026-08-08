import React from "react";
import { Link } from "react-router-dom";

type Props = {
  href: string;
  title: string;
  color: "blue" | "orange" | "black";
};

const BackButton = (props: Props) => {
  return (
    <div className="flex gap-2 items-center">
      <Link to={props.href}>
        {props.color === "blue" ? (
          <img src="/assets/course/back-blue-icon.svg" alt="back icon" />
        ) : props.color === "orange" ? (
          <img src="/assets/course/back-icon.svg" alt="back icon" />
        ) : (
          <img src="/assets/portfolio/black-back-icon.svg" alt="back icon" />
        )}
      </Link>

      <div
        className={`body-bold-1 ${
          props.color === "blue"
            ? "text-secondary-blue"
            : props.color === "orange"
            ? "text-primary-orange"
            : "text-primary-black"
        }`}
      >
        {props.title}
      </div>
    </div>
  );
};

export default BackButton;
