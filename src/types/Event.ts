type AgeRating = "G" | "R15" | "R18" | "R18G";

export type Event = {
    id: string;
    nameEnUS: string;
    organizerEnUS: string;
    startTime: Date;
    endTime: Date;
    numberOfDays: number;
    locationEnUS: string;
    descriptionEnUS?: string;
    ageRating?: AgeRating;
    links?: string[];
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
}