import instructionArrowIcon from "./instruction-line-arrow.svg";

let img;

if (document !== undefined) {
    img = document?.createElement("img");
    img.src = instructionArrowIcon;
}

export { img as instructionArrowIconImg };
