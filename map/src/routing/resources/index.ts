import instructionArrowIcon from "./instruction-line-arrow.svg";

let img;

// defensive check for SSR
if (typeof document !== "undefined") {
    img = document?.createElement("img");
    img.src = instructionArrowIcon;
}

export { img as instructionArrowIconImg };
