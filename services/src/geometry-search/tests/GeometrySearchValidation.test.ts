import geometrySearch from "../GeometrySearch";

describe("GeometrySearch Validation", () => {
    test("it should fail when missing coordinates property", async () => {
        const query = "cafe";
        const geometries = [{ radius: 6000 }];
        // @ts-ignore
        await expect(geometrySearch({ query, geometries })).rejects.toMatchObject({
            message: "Validation error",
            service: "GeometrySearch",
            errors: [
                {
                    property: "/geometries/0",
                    message: "must have required property 'coordinates'"
                }
            ]
        });
    });

    test("it should fail when missing type property", async () => {
        const query = "cafe";
        const geometries = [{ radius: 6000, coordinates: [37.71205, -121.36434] }];
        // @ts-ignore
        await expect(geometrySearch({ query, geometries })).rejects.toMatchObject({
            message: "Validation error",
            service: "GeometrySearch",
            errors: [
                {
                    property: "/geometries/0",
                    message: "must have required property 'type'"
                }
            ]
        });
    });

    test("it should fail when geometryList property is missing", async () => {
        const query = "cafe";

        // @ts-ignore
        await expect(geometrySearch({ query })).rejects.toMatchObject({
            service: "GeometrySearch",
            errors: [
                {
                    message: "must have required property 'geometryList'",
                    property: ""
                }
            ]
        });
    });

    test("it should fail when type Circle is missing radius property", async () => {
        const query = "cafe";
        const geometries = [
            {
                type: "Circle",
                coordinates: [37.71205, -121.36434]
            }
        ];

        // @ts-ignore
        await expect(geometrySearch({ query, geometries })).rejects.toMatchObject({
            message: "Validation error",
            service: "GeometrySearch",
            errors: [
                {
                    property: "/geometries/0",
                    message: "must have required property 'radius'"
                }
            ]
        });
    });
});
