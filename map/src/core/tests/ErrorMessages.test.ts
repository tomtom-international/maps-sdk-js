import { changingWhileNotInTheStyle } from "../ErrorMessages";

describe("Error messages tests", () => {
    test("Changing while not in the style", () => {
        expect(changingWhileNotInTheStyle("this property")).toStrictEqual(
            "Trying to change this property while it is not in the map style. Did you exclude it when loading the map?"
        );
    });
});
