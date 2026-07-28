export type ProcessEventResult =
    | { status: "processed" }
    | { status: "duplicated" };
